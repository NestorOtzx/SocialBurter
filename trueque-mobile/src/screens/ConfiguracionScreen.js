import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Slider from '@react-native-community/slider';
import InputField from '../components/InputField';
import { TIE_BREAKERS } from '../constants/options';
import { colors, fonts, spacing } from '../constants/theme';
import { fetchConfigurationRequest, saveConfigurationRequest } from '../services/api';

const DEFAULT_YEAR = '2026';
const WEIGHT_KEYS = ['diversidad', 'volumen', 'practicas', 'liderazgo'];

function sumWeights(weights) {
  return WEIGHT_KEYS.reduce((sum, key) => sum + (weights[key] || 0), 0);
}

function rebalanceWeights(currentWeights, changedKey, nextValue) {
  const boundedValue = Math.max(0, Math.min(100, nextValue));
  const nextWeights = { ...currentWeights, [changedKey]: boundedValue };
  const remainingKeys = WEIGHT_KEYS.filter((key) => key !== changedKey);
  const remainingTotal = Math.max(0, 100 - boundedValue);
  const currentTotal = remainingKeys.reduce((sum, key) => sum + currentWeights[key], 0);

  if (!remainingKeys.length) {
    return nextWeights;
  }

  if (!currentTotal) {
    const base = Math.floor(remainingTotal / remainingKeys.length);
    let assigned = 0;

    remainingKeys.forEach((key, index) => {
      if (index === remainingKeys.length - 1) {
        nextWeights[key] = remainingTotal - assigned;
      } else {
        nextWeights[key] = base;
        assigned += base;
      }
    });

    return nextWeights;
  }

  let assigned = 0;

  remainingKeys.forEach((key, index) => {
    if (index === remainingKeys.length - 1) {
      nextWeights[key] = remainingTotal - assigned;
    } else {
      const scaled = Math.round((currentWeights[key] / currentTotal) * remainingTotal);
      nextWeights[key] = scaled;
      assigned += scaled;
    }
  });

  return nextWeights;
}

export default function ConfiguracionScreen() {
  const [year, setYear] = useState(DEFAULT_YEAR);
  const [weights, setWeights] = useState({
    diversidad: 25,
    volumen: 25,
    practicas: 25,
    liderazgo: 25,
  });
  const [desempate, setDesempate] = useState('diversity');
  const [saving, setSaving] = useState(false);

  const sliderItems = useMemo(
    () => [
      { key: 'diversidad', label: 'Diversidad' },
      { key: 'volumen', label: 'Volumen' },
      { key: 'practicas', label: 'Prácticas sostenibles' },
      { key: 'liderazgo', label: 'Liderazgo (mujeres/jóvenes)' },
    ],
    []
  );

  const loadConfiguration = async (eventYear) => {
    try {
      const rule = await fetchConfigurationRequest(eventYear);
      setWeights(rule.pesos);
      setDesempate(rule.tieBreaker || 'diversity');
    } catch (error) {
      Alert.alert('Error', 'Ocurrió un error de red. Intenta nuevamente.');
    }
  };

  useEffect(() => {
    if (year.length === 4) {
      loadConfiguration(year);
    }
  }, [year]);

  const handleSliderChange = (key, value) => {
    setWeights((current) => rebalanceWeights(current, key, value));
  };

  const handleSave = async () => {
    if (!/^\d{4}$/.test(year)) {
      Alert.alert('Validación', 'Ingresa un año válido de 4 dígitos.');
      return;
    }

    if (sumWeights(weights) !== 100) {
      Alert.alert('Validación', 'Los pesos deben sumar 100%');
      return;
    }

    try {
      setSaving(true);
      await saveConfigurationRequest({
        eventYear: Number(year),
        pesos: weights,
        tieBreaker: desempate,
      });
      Alert.alert('Éxito', 'Configuración guardada correctamente.');
    } catch (error) {
      Alert.alert('Error', 'Ocurrió un error de red. Intenta nuevamente.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Parametrizacion Anual</Text>
        <View style={styles.divider} />

        <Text style={styles.subtitle}>Reglas de Ranking</Text>
        <Text style={styles.subtitleHelper}>Configura los parámetros del sistema de puntuación</Text>

        <InputField
          label="Año del evento"
          value={year}
          onChangeText={setYear}
          keyboardType="numeric"
          maxLength={4}
        />

        <Text style={styles.sectionTitle}>Pesos de Criterios</Text>
        <Text style={styles.inlineHelper}>Define la importancia</Text>

        {sliderItems.map((item) => (
          <View key={item.key} style={styles.sliderBlock}>
            <View style={styles.sliderHeader}>
              <Text style={item.key === 'diversidad' ? styles.sliderTitleBold : styles.sliderTitle}>
                {item.label}
              </Text>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{weights[item.key]}%</Text>
              </View>
            </View>
            <Slider
              minimumValue={0}
              maximumValue={100}
              step={1}
              minimumTrackTintColor={colors.secondaryBlue}
              maximumTrackTintColor={colors.border}
              thumbTintColor={colors.secondaryBlue}
              value={weights[item.key]}
              onValueChange={(value) => handleSliderChange(item.key, value)}
            />
            <Text style={styles.sliderValue}>Valor actual: {weights[item.key]}%</Text>
          </View>
        ))}

        <Text style={styles.infoTitle}>Información</Text>
        <Text style={styles.infoText}>Los pesos serán normalizados automáticamente.</Text>
        <Text style={styles.totalText}>Total actual: {sumWeights(weights)}%</Text>

        <Text style={styles.radioLabel}>Criterio para resolver</Text>
        {TIE_BREAKERS.map((item) => (
          <Pressable key={item.value} style={styles.radioRow} onPress={() => setDesempate(item.value)}>
            <View style={[styles.radioOuter, desempate === item.value && styles.radioOuterSelected]}>
              {desempate === item.value ? <View style={styles.radioInner} /> : null}
            </View>
            <Text style={styles.radioText}>{item.label}</Text>
          </Pressable>
        ))}

        <Pressable
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          <Text style={styles.saveButtonText}>{saving ? 'Guardando...' : 'Guardar Configuración'}</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  title: {
    fontSize: 28,
    color: '#1A1A1A',
    marginTop: spacing.md,
    fontFamily: fonts.bold,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginTop: spacing.md,
    marginBottom: spacing.xl,
  },
  subtitle: {
    fontSize: 20,
    color: colors.text,
    fontFamily: fonts.semibold,
  },
  subtitleHelper: {
    fontSize: 14,
    color: colors.mutedText,
    marginTop: 8,
    marginBottom: spacing.lg,
    fontFamily: fonts.regular,
  },
  sectionTitle: {
    fontSize: 16,
    color: colors.text,
    fontFamily: fonts.semibold,
  },
  inlineHelper: {
    fontSize: 12,
    color: colors.lightText,
    fontStyle: 'italic',
    marginTop: 6,
    marginBottom: spacing.md,
    fontFamily: fonts.regular,
  },
  sliderBlock: {
    marginBottom: spacing.md,
  },
  sliderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  sliderTitleBold: {
    fontSize: 16,
    color: colors.text,
    fontFamily: fonts.bold,
  },
  sliderTitle: {
    fontSize: 16,
    color: colors.text,
    fontFamily: fonts.regular,
  },
  badge: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: colors.blueLight,
  },
  badgeText: {
    color: colors.secondaryBlue,
    fontSize: 13,
    fontFamily: fonts.semibold,
  },
  sliderValue: {
    fontSize: 12,
    color: colors.mutedText,
    fontFamily: fonts.regular,
  },
  infoTitle: {
    fontSize: 16,
    color: colors.text,
    marginTop: spacing.sm,
    fontFamily: fonts.regular,
  },
  infoText: {
    fontSize: 12,
    color: colors.lightText,
    fontStyle: 'italic',
    marginTop: 6,
    marginBottom: 6,
    fontFamily: fonts.regular,
  },
  totalText: {
    fontSize: 14,
    color: colors.text,
    marginBottom: spacing.lg,
    fontFamily: fonts.semibold,
  },
  radioLabel: {
    fontSize: 14,
    color: '#555555',
    marginBottom: spacing.md,
    fontFamily: fonts.regular,
  },
  radioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  radioOuterSelected: {
    borderColor: colors.secondaryBlue,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.secondaryBlue,
  },
  radioText: {
    fontSize: 16,
    color: colors.text,
    fontFamily: fonts.regular,
  },
  saveButton: {
    alignSelf: 'center',
    marginTop: spacing.lg,
    backgroundColor: colors.secondaryBlue,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 24,
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: colors.background,
    fontSize: 16,
    fontFamily: fonts.bold,
  },
});
