import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import AppHeader from '../components/AppHeader';
import EmptyState from '../components/EmptyState';
import { colors, fonts, shadow, spacing } from '../constants/theme';
import { fetchRankingRequest } from '../services/api';

const YEARS = ['2026', '2025', '2024', '2023', '2022'];

export default function RankingScreen() {
  const [selectedYear, setSelectedYear] = useState('2026');
  const [ranking, setRanking] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

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
    } catch (error) {
      Alert.alert('Error', 'Ocurrió un error de red. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRanking(selectedYear);
  }, [selectedYear]);

  const renderItem = ({ item }) => {
    const isTopThree = item.position <= 3;

    return (
      <View style={styles.rowCard}>
        <View style={styles.leftSection}>
          <View style={[styles.positionCircle, isTopThree && styles.positionCircleTop]}>
            <Text style={[styles.positionText, isTopThree && styles.positionTextTop]}>{item.position}</Text>
          </View>
          <View style={styles.personInfo}>
            <Text style={styles.name} numberOfLines={2}>
              {item.name}
            </Text>
            <Text style={styles.meta}>Cédula: {item.cedula}</Text>
            <Text style={styles.metric}>Diversidad: {item.diversity}</Text>
            <Text style={styles.metric}>Volumen: {Number(item.volume).toFixed(0)} kg</Text>
          </View>
        </View>
        <View style={styles.rightSection}>
          <Text style={styles.scoreLabel}>Puntaje</Text>
          <Text style={styles.scoreValue}>{Number(item.puntaje).toFixed(1)}</Text>
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
      <AppHeader title="Ranking y Premiacion" />
      <FlatList
        data={ranking}
        keyExtractor={(item) => `${item.participantId || item.cedula}-${item.position}`}
        ListHeaderComponent={
          <View style={styles.headerContent}>
            <Text style={styles.bannerTitle}>Ranking {selectedYear}</Text>
            <Text style={styles.bannerSubtitle}>Ordenado por puntaje acumulado</Text>

            <Pressable style={styles.filterButton} onPress={() => setModalVisible(true)}>
              <Text style={styles.filterButtonText}>{selectedYear}</Text>
              <Feather name="refresh-cw" size={16} color={colors.primary} />
            </Pressable>
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
    marginBottom: spacing.lg,
  },
  bannerTitle: {
    fontSize: 24,
    color: colors.text,
    fontFamily: fonts.bold,
  },
  bannerSubtitle: {
    fontSize: 14,
    color: colors.mutedText,
    marginTop: 8,
    fontFamily: fonts.regular,
  },
  filterButton: {
    marginTop: spacing.md,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: colors.background,
  },
  filterButtonText: {
    fontSize: 15,
    color: colors.text,
    fontFamily: fonts.semibold,
  },
  rowCard: {
    borderRadius: 18,
    backgroundColor: colors.background,
    padding: spacing.md,
    marginBottom: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    ...shadow,
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
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  positionCircleTop: {
    backgroundColor: colors.blueLight,
  },
  positionText: {
    color: colors.secondaryBlue,
    fontFamily: fonts.bold,
  },
  positionTextTop: {
    color: colors.primary,
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
    color: colors.orange,
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
