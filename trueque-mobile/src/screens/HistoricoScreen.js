import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
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
import { fetchHistoricalContributionsRequest } from '../services/api';
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
  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return '-';
  }

  return `${date.getDate()} de ${MONTHS[date.getMonth()]} de ${date.getFullYear()}`;
}

export default function HistoricoScreen() {
  const [cedula, setCedula] = useState('');
  const [nombre, setNombre] = useState('');
  const [selectedYear, setSelectedYear] = useState('2026');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedMunicipio, setSelectedMunicipio] = useState('all');
  const [items, setItems] = useState([]);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [loading, setLoading] = useState(false);

  const debouncedCedula = useDebounce(cedula, 450);
  const debouncedNombre = useDebounce(nombre, 450);

  const loadItems = async (year) => {
    try {
      setLoading(true);
      const response = await fetchHistoricalContributionsRequest(year);
      setItems(response || []);
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
      const displayType = getContributionDisplayType(item).toLowerCase();
      const matchesCedula = debouncedCedula
        ? item.participantCedula?.toLowerCase().includes(debouncedCedula.toLowerCase())
        : true;
      const matchesNombre = debouncedNombre
        ? item.participantName?.toLowerCase().includes(debouncedNombre.toLowerCase())
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

  return (
    <View style={styles.screen}>
      <AppHeader title="Consulta Historica" />
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

            <Text style={styles.resultsText}>Resultados: {filteredItems.length}</Text>
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
                {item.participantName}
              </Text>
              <Text style={styles.cardCedula}>CC {item.participantCedula}</Text>

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
              <Text style={styles.cardDetail}>Estado: {item.stage || 'llega'}</Text>
              <Text style={styles.cardDetail}>Municipio: {item.municipality}</Text>
              <Text style={styles.cardDetail}>Vereda: {item.village}</Text>
              <Text style={styles.cardDetail}>Fecha: {formatHistoricDate(item.registeredAt)}</Text>
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
});
