import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Modal, Pressable, StyleSheet, Text, View, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import AppHeader from '../components/AppHeader';
import EmptyState from '../components/EmptyState';
import { colors, fonts, spacing } from '../constants/theme';
import { fetchRankingRequest } from '../services/api';
import { useNetworkStore } from '../store/networkStore';

const YEARS = ['2026', '2025', '2024', '2023', '2022'];

export default function RankingScreen({ navigation }) {
  const [selectedYear, setSelectedYear] = useState('2026');
  const [ranking, setRanking] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [rule, setRule] = useState(null);
  const isOffline = useNetworkStore(state => state.isOffline);

  const loadRanking = async (year = selectedYear) => {
    try {
      setLoading(true);
      const response = await fetchRankingRequest(year);
      const nextRanking = (response?.ranking || []).map((item, index) => ({
        ...item,
        position: item.position || index + 1,
        puntaje: item.puntaje ?? item.score ?? 0,
      }));
      setRanking(nextRanking);
      setRule(response?.rule || null);
    } catch (error) {
      const isOfflineState = useNetworkStore.getState().isOffline;
      if (isOfflineState && error.message.includes('cached')) {
        Alert.alert(
          'Modo Offline',
          'No hay datos guardados de ranking para este año. Conéctate a internet para ver la información.\n\nNota: Los nuevos registros no aparecerán aquí hasta que se sincronicen y el servidor calcule los puntajes.'
        );
      } else {
        Alert.alert('Error', 'Ocurrió un error de red. Intenta nuevamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRanking(selectedYear);
  }, [selectedYear]);

  const handleExportCSV = async () => {
    try {
      if (!ranking.length) {
        Alert.alert('Sin datos', 'No hay registros para exportar');
        return;
      }

      let csvContent = 'Posicion,Cedula,Nombre,Diversidad,Volumen,Practicas,Liderazgo,Puntaje\n';

      ranking.forEach(item => {
        const row = [
          item.position,
          item.cedula,
          `"${item.name || ''}"`,
          item.diversity,
          item.volume,
          item.practices || item.practicas ? 'Si' : 'No',
          item.leadership || item.liderazgo ? 'Si' : 'No',
          Number(item.puntaje).toFixed(1)
        ].join(',');
        csvContent += row + '\n';
      });

      const fileName = `Ranking_${selectedYear}_${Date.now()}.csv`;

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
        await Sharing.shareAsync(filePath, { UTI: 'public.comma-separated-values-text', mimeType: 'text/csv', dialogTitle: 'Compartir ranking CSV' });
      } else {
        Alert.alert('Exportado', `El archivo se guardó en:\n${filePath}`);
      }
    } catch (error) {
      console.error('Error al exportar CSV:', error);
      Alert.alert('Error', 'No se pudo generar el reporte CSV');
    }
  };

  const renderItem = ({ item }) => {
    const isTop1 = item.position === 1;
    const isTop2 = item.position === 2;
    const isTop3 = item.position === 3;
    const isTopThree = item.position <= 3;

    const podioColor = isTop1
      ? colors.gold
      : isTop2
      ? colors.silver
      : isTop3
      ? colors.bronze
      : colors.border;

    const podioCircleBg = isTop1
      ? '#FEF3C7'
      : isTop2
      ? '#D8F3DC'
      : isTop3
      ? '#F5E6D3'
      : '#F0F4F1';

    const weights = rule?.pesos || { diversidad: 25, volumen: 25, practicas: 25, liderazgo: 25 };
    
    const divPts = Number(item.diversity || 0) * (weights.diversidad / 100);
    const volPts = Number(item.volume || 0) * (weights.volumen / 100);
    const hasPrac = item.practices || item.practicas ? 1 : 0;
    const pracPts = hasPrac * (weights.practicas / 100);
    const hasLid = item.leadership || item.liderazgo ? 1 : 0;
    const lidPts = hasLid * (weights.liderazgo / 100);

    const breakdown = `Div(${divPts.toFixed(2)}) + Vol(${volPts.toFixed(2)})\nPrac(${pracPts.toFixed(2)}) + Lid(${lidPts.toFixed(2)})`;

    return (
      <View style={[styles.rowCard, { borderLeftColor: podioColor }]}>
        <View style={styles.leftSection}>
          <View style={[styles.positionCircle, { backgroundColor: podioCircleBg }]}>
            <Text style={[styles.positionText, { color: isTopThree ? podioColor : colors.mutedText }]}>
              {item.position}
            </Text>
          </View>
          <View style={styles.personInfo}>
            <Text style={styles.name} numberOfLines={2}>
              {item.name}
            </Text>
            <Text style={styles.meta}>Cédula: {item.cedula}</Text>
            <Text style={styles.metric}>Diversidad: {item.diversity}</Text>
            <Text style={styles.metric}>Volumen: {Number(item.volume).toFixed(0)} kg</Text>
            <Text style={styles.metric}>Practicas: {hasPrac ? 'Si' : 'No'}</Text>
            <Text style={styles.metric}>Liderazgo: {hasLid ? 'Si' : 'No'}</Text>
          </View>
        </View>
        <View style={styles.rightSection}>
          <Text style={styles.scoreLabel}>Puntaje</Text>
          <Text style={[styles.scoreValue, { color: isTopThree ? podioColor : colors.primary }]}>
            {Number(item.puntaje).toFixed(1)}
          </Text>
          <Text style={{ fontSize: 10, color: colors.mutedText, textAlign: 'right', marginTop: 4 }}>
            {breakdown}
          </Text>
        </View>
      </View>
    );
  };

  const emptyComponent = useMemo(() => {
    if (loading) {
      return (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      );
    }
    return <EmptyState message="No hay datos para este año" />;
  }, [loading]);

  return (
    <View style={styles.screen}>
      <AppHeader title="Ranking y Premiación" showBack navigation={navigation} />
      <FlatList
        data={ranking}
        keyExtractor={(item) => `${item.participantId || item.cedula}-${item.position}`}
        ListHeaderComponent={
          <View style={styles.headerContent}>
            <Text style={styles.bannerTitle}>Ranking {selectedYear}</Text>
            <Text style={styles.bannerSubtitle}>Ordenado por puntaje acumulado</Text>

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Pressable style={styles.filterButton} onPress={() => setModalVisible(true)}>
                <Text style={styles.filterButtonText}>{selectedYear}</Text>
                <Feather name="calendar" size={16} color={colors.primary} />
              </Pressable>
              
              <Pressable style={[styles.filterButton, { backgroundColor: 'rgba(255,255,255,0.15)' }]} onPress={handleExportCSV}>
                <Text style={styles.filterButtonText}>CSV</Text>
                <Feather name="file-text" size={16} color="#fff" />
              </Pressable>
            </View>
            
            {isOffline && (
              <View style={{ marginTop: 12, backgroundColor: 'rgba(255,255,255,0.2)', padding: 10, borderRadius: 8, flexDirection: 'row', alignItems: 'center' }}>
                <Feather name="wifi-off" size={16} color="#fff" style={{ marginRight: 8 }} />
                <Text style={{ color: '#fff', fontSize: 13, fontFamily: fonts.semibold }}>
                  Modo offline: Mostrando ranking guardado.
                </Text>
              </View>
            )}
          </View>
        }
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={emptyComponent}
      />

      <Modal visible={modalVisible} transparent animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={() => setModalVisible(false)}>
          <View style={styles.modalCard}>
            {YEARS.map((year) => (
              <Pressable
                key={year}
                style={styles.modalItem}
                onPress={() => {
                  setSelectedYear(year);
                  setModalVisible(false);
                }}
              >
                <Text style={styles.modalItemText}>{year}</Text>
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>
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
  headerContent: {
    backgroundColor: colors.primary,
    marginHorizontal: -spacing.md,
    marginTop: -spacing.md,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
    marginBottom: spacing.lg,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  bannerTitle: {
    fontSize: 24,
    color: '#FFFFFF',
    fontFamily: fonts.bold,
  },
  bannerSubtitle: {
    fontSize: 14,
    color: colors.primarySurface,
    marginTop: 8,
    fontFamily: fonts.regular,
  },
  filterButton: {
    marginTop: spacing.md,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  filterButtonText: {
    fontSize: 15,
    color: '#FFFFFF',
    fontFamily: fonts.semibold,
  },
  rowCard: {
    borderRadius: 14,
    borderLeftWidth: 5,
    backgroundColor: colors.background,
    padding: spacing.md,
    marginBottom: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 2,
  },
  leftSection: {
    flexDirection: 'row',
    flex: 1,
    paddingRight: spacing.sm,
  },
  rightSection: {
    width: 92,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  positionCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  positionText: {
    fontFamily: fonts.bold,
    fontSize: 15,
  },
  personInfo: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    color: colors.text,
    fontFamily: fonts.bold,
  },
  meta: {
    marginTop: 6,
    fontSize: 12,
    color: colors.mutedText,
    fontFamily: fonts.regular,
  },
  metric: {
    marginTop: 4,
    fontSize: 13,
    color: colors.text,
    fontFamily: fonts.regular,
  },
  scoreLabel: {
    fontSize: 12,
    color: colors.lightText,
    marginBottom: 6,
    fontFamily: fonts.regular,
  },
  scoreValue: {
    fontSize: 22,
    fontFamily: fonts.bold,
  },
  loaderContainer: {
    paddingVertical: 40,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  modalCard: {
    width: '100%',
    maxWidth: 320,
    borderRadius: 16,
    backgroundColor: colors.background,
    paddingVertical: spacing.sm,
  },
  modalItem: {
    paddingVertical: 14,
    paddingHorizontal: spacing.lg,
  },
  modalItemText: {
    fontSize: 16,
    color: colors.text,
    fontFamily: fonts.semibold,
  },
});
