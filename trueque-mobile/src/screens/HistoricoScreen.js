import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Pressable, StyleSheet, Text, View, Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Feather } from '@expo/vector-icons';
import AppHeader from '../components/AppHeader';
import Chip from '../components/Chip';
import EmptyState from '../components/EmptyState';
import InputField from '../components/InputField';
import {
  APORTE_CATEGORIES,
  getCategoryAppearance,
  getCategoryLabel,
  HISTORICO_YEARS,
  MUNICIPIOS,
} from '../constants/options';
import { colors, fonts, shadow, spacing } from '../constants/theme';
import { useDebounce } from '../hooks/useDebounce';
import { fetchHistoricalContributionsRequest, deleteContributionRequest } from '../services/api';
import { getPendingContributions } from '../services/localDb';
import { getCachedParticipantProfile } from '../services/profileCache';
import { useNetworkStore } from '../store/networkStore';
import {
  getContributionDisplayQuantity,
  getContributionDisplayType,
  getContributionDisplayUnit,
} from '../services/participantTransforms';

const PAGE_SIZE = 12;
const CATEGORY_FILTERS = [{ label: 'Todas', value: 'all' }, ...APORTE_CATEGORIES];
const MUNICIPALITY_FILTERS = [
  { label: 'Todos', value: 'all' },
  ...MUNICIPIOS.map((item) => ({ label: item, value: item })),
];
const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

function formatHistoricDate(dateValue) {
  if (!dateValue) return 'Sin fecha';
  
  // Handle SQLite format with space instead of T
  const safeDate = typeof dateValue === 'string' ? dateValue.replace(' ', 'T') : dateValue;
  const date = new Date(safeDate);
  
  if (Number.isNaN(date.getTime())) {
    return 'Sin fecha';
  }

  return `${date.getDate()} de ${MONTHS[date.getMonth()]} de ${date.getFullYear()}`;
}

export default function HistoricoScreen({ navigation }) {
  const [cedula, setCedula] = useState('');
  const [nombre, setNombre] = useState('');
  const [selectedYear, setSelectedYear] = useState('2026');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedMunicipio, setSelectedMunicipio] = useState('all');
  const [items, setItems] = useState([]);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [loading, setLoading] = useState(false);
  const isOffline = useNetworkStore(state => state.isOffline);

  const debouncedCedula = useDebounce(cedula, 450);
  const debouncedNombre = useDebounce(nombre, 450);

  const showAlert = (title, message, buttons) => {
    if (Platform.OS === 'web') {
      const confirmButton = buttons.find(b => b.style === 'destructive' || b.text === 'Eliminar' || b.text === 'Aceptar');
      if (window.confirm(`${title}\n\n${message}`)) {
        if (confirmButton && confirmButton.onPress) confirmButton.onPress();
      }
    } else {
      Alert.alert(title, message, buttons);
    }
  };

  const handleDeleteContribution = (id, productName) => {
    if (!id || String(id).startsWith('offline')) {
      Alert.alert('Error', 'No se puede eliminar un registro que aún no se ha sincronizado.');
      return;
    }
    if (isOffline) {
      showAlert('Error', 'Necesitas conexión a internet para eliminar registros.', [{ text: 'Aceptar' }]);
      return;
    }
    showAlert(
      'Eliminar Producto',
      `¿Estás seguro que deseas eliminar el producto "${productName}"? Esta acción no se puede deshacer.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Eliminar', 
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              console.log('Eliminando producto ID:', id);
              await deleteContributionRequest(id);
              showAlert('Éxito', 'Producto eliminado correctamente.', [{ text: 'Aceptar' }]);
              loadItems(selectedYear); // reload
            } catch (error) {
              console.error('Error al eliminar:', error);
              showAlert('Error', 'No se pudo eliminar el producto.', [{ text: 'Aceptar' }]);
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const loadItems = async (year) => {
    try {
      setLoading(true);
      let response = await fetchHistoricalContributionsRequest(year) || [];
      
      const isOfflineState = useNetworkStore.getState().isOffline;
      if (isOfflineState) {
        try {
          const pending = await getPendingContributions();
          const offlineItems = [];
          
          for (const pendingRecord of pending) {
            if (pendingRecord.event_year.toString() !== year.toString()) continue;
            
            const payload = JSON.parse(pendingRecord.payload_json);
            const cedula = pendingRecord.cedula;
            const profile = await getCachedParticipantProfile(cedula) || {};
            
            const contribs = payload.contributions || [];
            contribs.forEach((c, index) => {
              offlineItems.push({
                id: `offline_${pendingRecord.id}_${index}`,
                participantId: profile.id || `offline_p_${cedula}`,
                eventYear: pendingRecord.event_year,
                category: c.category,
                speciesCommonName: c.speciesCommonName,
                speciesScientificName: c.speciesScientificName,
                variety: c.variety,
                quantity: c.quantity,
                unit: c.unit,
                stage: c.stage,
                photoUri: c.photoUri,
                registeredAt: pendingRecord.created_at || new Date().toISOString(),
                participantName: profile.nombreCompleto || profile.name || 'Participante Offline',
                participantCedula: cedula,
                municipality: profile.municipio || profile.municipality || 'Offline',
                village: profile.vereda || profile.village || 'Offline'
              });
            });
          }
          
          response = [...offlineItems, ...response];
        } catch (offlineError) {
          console.error("Error merging offline contributions:", offlineError);
        }
      }
      
      setItems(response);
    } catch (error) {
      Alert.alert('Error', 'Ocurrió un error de red. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadItems(selectedYear);
  }, [selectedYear]);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const displayType = String(getContributionDisplayType(item) || '').toLowerCase();
      const matchesCedula = debouncedCedula
        ? String(item.participantCedula || item.cedula || '').toLowerCase() === debouncedCedula.toLowerCase()
        : true;
      const matchesNombre = debouncedNombre
        ? String(item.participantName || '').toLowerCase().includes(debouncedNombre.toLowerCase())
        : true;
      const matchesCategory = selectedCategory === 'all' ? true : item.category === selectedCategory;
      const matchesMunicipio = selectedMunicipio === 'all' ? true : item.municipality === selectedMunicipio;

      return matchesCedula && matchesNombre && matchesCategory && matchesMunicipio && !!displayType.length;
    });
  }, [debouncedCedula, debouncedNombre, items, selectedCategory, selectedMunicipio]);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [debouncedCedula, debouncedNombre, selectedCategory, selectedMunicipio, selectedYear]);

  const visibleItems = filteredItems.slice(0, visibleCount);

  const handleExportCSV = async () => {
    try {
      if (!filteredItems.length) {
        Alert.alert('Sin datos', 'No hay registros para exportar');
        return;
      }

      // Headers
      let csvContent = 'Cedula,Nombre,Año,Categoria,Producto,Variedad,Cantidad,Unidad,Estado,Municipio\n';

      // Rows
      filteredItems.forEach(item => {
        const row = [
          item.participantCedula,
          `"${item.participantName || ''}"`,
          item.eventYear,
          getCategoryLabel(item.category),
          `"${item.speciesCommonName || ''}"`,
          `"${item.variety || ''}"`,
          item.quantity,
          item.unit,
          item.stage,
          item.municipality
        ].join(',');
        csvContent += row + '\n';
      });

      const fileName = `Reporte_Trueque_${Date.now()}.csv`;

      if (Platform.OS === 'web') {
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = fileName;
        link.click();
        return;
      }

      const filePath = FileSystem.documentDirectory + fileName;
      await FileSystem.writeAsStringAsync(filePath, csvContent, { encoding: FileSystem.EncodingType.UTF8 });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(filePath, { UTI: 'public.comma-separated-values-text', mimeType: 'text/csv', dialogTitle: 'Compartir reporte CSV' });
      } else {
        Alert.alert('Exportado', `El archivo se guardó en:\n${filePath}`);
      }
    } catch (error) {
      console.error('Error al exportar CSV:', error);
      Alert.alert('Error', 'No se pudo generar el reporte CSV');
    }
  };


  return (
    <View style={styles.screen}>
      <AppHeader title="Consulta Histórica" showBack navigation={navigation} />
      <FlatList
        data={visibleItems}
        keyExtractor={(item) => `${item.id}`}
        numColumns={2}
        columnWrapperStyle={visibleItems.length ? styles.columnWrapper : null}
        contentContainerStyle={styles.listContent}
        onEndReached={() => {
          if (visibleCount < filteredItems.length) {
            setVisibleCount((count) => count + PAGE_SIZE);
          }
        }}
        onEndReachedThreshold={0.4}
        ListHeaderComponent={
          <View>
            <Text style={styles.bannerTitle}>Consulta de Aportes</Text>
            <Text style={styles.bannerSubtitle}>
              Registro de lo que cada participante ha traído al trueque
            </Text>

            {isOffline && (
              <View style={{ marginBottom: spacing.md, backgroundColor: colors.warningText, padding: 10, borderRadius: 8, flexDirection: 'row', alignItems: 'center' }}>
                <Feather name="wifi-off" size={16} color="#fff" style={{ marginRight: 8 }} />
                <Text style={{ color: '#fff', fontSize: 13, fontFamily: fonts.semibold, flex: 1 }}>
                  Modo offline: Mostrando datos guardados y registros pendientes por sincronizar.
                </Text>
              </View>
            )}

            <View style={styles.filterHeader}>
              <Text style={styles.filterTitle}>Filtros</Text>
              <Pressable
                onPress={() => {
                  setCedula('');
                  setNombre('');
                  setSelectedYear('2026');
                  setSelectedCategory('all');
                  setSelectedMunicipio('all');
                }}
              >
                <Text style={styles.clearText}>Limpiar</Text>
              </Pressable>
            </View>

            <InputField label="Cédula" value={cedula} onChangeText={setCedula} placeholder="Ej: 1088..." />
            <InputField label="Nombre" value={nombre} onChangeText={setNombre} placeholder="Ej: Ana Rosero" />

            <Text style={styles.groupLabel}>Año</Text>
            <View style={styles.chipGroup}>
              {HISTORICO_YEARS.map((year) => (
                <Chip
                  key={year}
                  label={year}
                  compact
                  selected={selectedYear === year}
                  onPress={() => setSelectedYear(year)}
                />
              ))}
            </View>

            <Text style={styles.groupLabel}>Categoría</Text>
            <View style={styles.chipGroup}>
              {CATEGORY_FILTERS.map((item) => (
                <Chip
                  key={item.value}
                  label={item.label}
                  compact
                  selected={selectedCategory === item.value}
                  onPress={() => setSelectedCategory(item.value)}
                />
              ))}
            </View>

            <Text style={styles.groupLabel}>Municipio</Text>
            <View style={styles.chipGroup}>
              {MUNICIPALITY_FILTERS.map((item) => (
                <Chip
                  key={item.value}
                  label={item.label}
                  compact
                  selected={selectedMunicipio === item.value}
                  onPress={() => setSelectedMunicipio(item.value)}
                />
              ))}
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, marginBottom: 10 }}>
              <Text style={styles.resultsText}>Resultados: {filteredItems.length}</Text>
              
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <Pressable onPress={handleExportCSV} style={[styles.exportBtn, { backgroundColor: '#2e7d32' }]}>
                  <Feather name="file-text" size={14} color="#fff" style={{ marginRight: 5 }} />
                  <Text style={styles.exportBtnText}>CSV</Text>
                </Pressable>
              </View>
            </View>
          </View>
        }
        ListEmptyComponent={
          loading ? (
            <View style={styles.loaderContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : (
            <EmptyState message="No se encontraron resultados" />
          )
        }
        renderItem={({ item }) => {
          const categoryAppearance = getCategoryAppearance(item.category);
          const aporteTipo = getContributionDisplayType(item);
          const aporteCantidad = getContributionDisplayQuantity(item);
          const aporteUnidad = getContributionDisplayUnit(item);

          return (
            <View style={styles.card}>
              <Text style={styles.cardName} numberOfLines={2}>
                {item.participantName || 'Nombre no disponible'}
              </Text>
              <Text style={styles.cardCedula}>CC {item.participantCedula || item.cedula || '---'}</Text>

              <View style={styles.badgesRow}>
                <View style={styles.yearBadge}>
                  <Text style={styles.yearBadgeText}>{item.eventYear}</Text>
                </View>
                <View style={[styles.categoryBadge, { backgroundColor: categoryAppearance.color }]}>
                  <Text style={[styles.categoryBadgeText, { color: categoryAppearance.textColor }]}>
                    {getCategoryLabel(item.category)}
                  </Text>
                </View>
              </View>

              <Text style={styles.cardDetail}>
                {getCategoryLabel(item.category)} – {aporteTipo || 'Sin especificación'}
              </Text>
              <Text style={styles.cardDetail}>
                Cantidad: {aporteCantidad} {aporteUnidad}
              </Text>
              <Text style={styles.cardDetail}>Estado: {item.stage || 'No registrado'}</Text>
              <Text style={styles.cardDetail}>Municipio: {item.municipality || 'No registrado'}</Text>
              <Text style={styles.cardDetail}>Vereda: {item.village || 'No registrado'}</Text>
              <Text style={styles.cardDetail}>Fecha: {formatHistoricDate(item.registeredAt)}</Text>
              
              {item.id && !String(item.id).startsWith('offline') && !isOffline && (
                <Pressable 
                  style={{ marginTop: 12, padding: 8, backgroundColor: colors.warningText, borderRadius: 8, alignItems: 'center' }}
                  onPress={() => handleDeleteContribution(item.id, item.speciesCommonName || 'Producto')}
                >
                  <Text style={{ color: '#fff', fontSize: 12, fontFamily: fonts.semibold }}>Eliminar Producto</Text>
                </Pressable>
              )}
              
              {!item.id && (
                <View style={{ marginTop: 12, padding: 8, backgroundColor: '#f0f0f0', borderRadius: 8, alignItems: 'center' }}>
                  <Text style={{ color: '#666', fontSize: 11, fontFamily: fonts.italic }}>Sin aportes registrados</Text>
                </View>
              )}
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  listContent: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
    flexGrow: 1,
  },
  bannerTitle: {
    fontSize: 22,
    color: colors.text,
    fontFamily: fonts.bold,
  },
  bannerSubtitle: {
    fontSize: 14,
    color: colors.mutedText,
    marginTop: 8,
    marginBottom: spacing.lg,
    lineHeight: 20,
    fontFamily: fonts.regular,
  },
  filterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  filterTitle: {
    fontSize: 18,
    color: colors.text,
    fontFamily: fonts.bold,
  },
  clearText: {
    fontSize: 14,
    color: colors.primary,
    fontFamily: fonts.semibold,
  },
  groupLabel: {
    fontSize: 14,
    color: colors.text,
    marginBottom: 8,
    fontFamily: fonts.semibold,
  },
  chipGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: spacing.sm,
  },
  resultsText: {
    marginTop: spacing.sm,
    marginBottom: spacing.md,
    fontSize: 15,
    color: colors.text,
    fontFamily: fonts.semibold,
  },
  columnWrapper: {
    justifyContent: 'space-between',
  },
  card: {
    width: '48%',
    borderRadius: 16,
    backgroundColor: colors.background,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadow,
  },
  cardName: {
    fontSize: 16,
    color: colors.text,
    fontFamily: fonts.bold,
  },
  cardCedula: {
    fontSize: 12,
    color: '#555555',
    marginTop: 4,
    fontFamily: fonts.regular,
  },
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  yearBadge: {
    borderRadius: 999,
    backgroundColor: colors.blueLight,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginRight: 6,
    marginBottom: 6,
  },
  yearBadgeText: {
    color: colors.primary,
    fontSize: 12,
    fontFamily: fonts.semibold,
  },
  categoryBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 6,
  },
  categoryBadgeText: {
    fontSize: 12,
    fontFamily: fonts.semibold,
  },
  cardDetail: {
    marginTop: 4,
    fontSize: 13,
    color: colors.text,
    fontFamily: fonts.regular,
  },
  loaderContainer: {
    paddingVertical: 40,
  },
  exportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  exportBtnText: {
    color: '#fff',
    fontSize: 12,
    fontFamily: fonts.bold,
  },
});
