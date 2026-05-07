import React, { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import AppHeader from '../components/AppHeader';
import InputField from '../components/InputField';
import SegmentedPercentageEditor from '../components/SegmentedPercentageEditor';
import { TIE_BREAKERS } from '../constants/options';
import { colors, fonts, spacing } from '../constants/theme';
import { fetchConfigurationRequest, saveConfigurationRequest } from '../services/api';

const DEFAULT_YEAR = '2026';
const WEIGHT_KEYS = ['diversidad', 'volumen', 'practicas', 'liderazgo'];
const CRITERION_SEGMENTS = [
  { key: 'diversidad', label: 'Diversidad', color: '#95D5B2' },
  { key: 'volumen', label: 'Volumen', color: '#74C69D' },
  { key: 'practicas', label: 'Practicas', color: '#FFD166' },
  { key: 'liderazgo', label: 'Liderazgo', color: '#F4978E' },
];
const CRITERION_DETAILS = [
  {
    key: 'diversidad',
    title: 'Diversidad',
    description: 'Valora la cantidad de variedades distintas aportadas por cada participante.',
  },
  {
    key: 'volumen',
    title: 'Volumen',
    description: 'Valora la cantidad total registrada en los aportes del participante.',
  },
  {
    key: 'practicas',
    title: 'Practicas sostenibles',
    description:
      'Aplica cuando la produccion es agroecologica, silvopastoril o con practicas ancestrales.',
  },
  {
    key: 'liderazgo',
    title: 'Liderazgo',
    description:
      'Aplica cuando el sistema productivo es liderado por mujeres y/o jovenes.',
  },
];

function sumWeights(weights) {
  return WEIGHT_KEYS.reduce((sum, key) => sum + (weights[key] || 0), 0);
}

export default function ConfiguracionScreen({ navigation }) {
  const [year, setYear] = useState(DEFAULT_YEAR);
  const [weights, setWeights] = useState({
    diversidad: 25,
    volumen: 25,
    practicas: 25,
    liderazgo: 25,
  });
  const [desempate, setDesempate] = useState('diversity');
  const [saving, setSaving] = useState(false);
  const totalWeight = sumWeights(weights);
  const canSave = totalWeight === 100 && /^\d{4}$/.test(year) && !saving;

  const loadConfiguration = async (eventYear) => {
    try {
      const rule = await fetchConfigurationRequest(eventYear);
      setWeights(rule.pesos);
      setDesempate(rule.tieBreaker || 'diversity');
    } catch (error) {
      Alert.alert('Error', 'Ocurrio un error de red. Intenta nuevamente.');
    }
  };

  useEffect(() => {
    if (year.length === 4) {
      loadConfiguration(year);
    }
  }, [year]);

  const handleSave = async () => {
    if (!/^\d{4}$/.test(year)) {
      Alert.alert('Validacion', 'Ingresa un ano valido de 4 digitos.');
      return;
    }

    if (totalWeight !== 100) {
      Alert.alert('Validacion', 'Los pesos deben sumar 100%.');
      return;
    }

    try {
      setSaving(true);
      await saveConfigurationRequest({
        eventYear: Number(year),
        pesos: weights,
        tieBreaker: desempate,
      });
      Alert.alert('Exito', 'Configuracion guardada correctamente.');
    } catch (error) {
      Alert.alert('Error', 'Ocurrio un error de red. Intenta nuevamente.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.safeArea}>
      <AppHeader title="Configurar Reglas" showBack navigation={navigation} />
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Parametrizacion anual</Text>
        <View style={styles.divider} />

        <Text style={styles.subtitle}>Reglas de ranking</Text>
        <Text style={styles.subtitleHelper}>
          Ajusta los porcentajes del sistema escribiendo los valores de cada criterio. La barra se actualiza de inmediato para reflejar lo que ingresas.
        </Text>

        <InputField
          label="Ano del evento"
          value={year}
          onChangeText={setYear}
          keyboardType="numeric"
          maxLength={4}
        />

        <Text style={styles.sectionTitle}>Pesos de criterios</Text>
        <Text style={styles.inlineHelper}>
          No hay redistribucion automatica. Debes completar manualmente el total hasta llegar a 100%.
        </Text>

        <SegmentedPercentageEditor
          segments={CRITERION_SEGMENTS}
          values={weights}
          onChange={setWeights}
        />

        <Text style={styles.infoTitle}>Detalle de criterios</Text>
        <View style={styles.criteriaList}>
          {CRITERION_DETAILS.map((criterion, index) => (
            <View key={criterion.key} style={[styles.criteriaCard, index === CRITERION_DETAILS.length - 1 && styles.criteriaCardLast]}>
              <Text style={styles.criteriaTitle}>{criterion.title}</Text>
              <Text style={styles.criteriaDescription}>{criterion.description}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.infoTitle}>Estado actual</Text>
        <Text style={styles.infoText}>
          La barra refleja exactamente lo que escribes. Si falta o sobra porcentaje, no podras guardar la configuracion.
        </Text>
        <Text style={styles.totalText}>Total actual: {totalWeight}%</Text>

        <Text style={styles.radioLabel}>Criterio para resolver empates</Text>
        {TIE_BREAKERS.map((item) => (
          <Pressable key={item.value} style={styles.radioRow} onPress={() => setDesempate(item.value)}>
            <View style={[styles.radioOuter, desempate === item.value && styles.radioOuterSelected]}>
              {desempate === item.value ? <View style={styles.radioInner} /> : null}
            </View>
            <Text style={styles.radioText}>{item.label}</Text>
          </Pressable>
        ))}

        <Pressable
          style={[styles.saveButton, !canSave && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={!canSave}
        >
          <Text style={styles.saveButtonText}>{saving ? 'Guardando...' : 'Guardar configuracion'}</Text>
        </Pressable>
      </ScrollView>
    </View>
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
    lineHeight: 20,
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
    marginTop: 6,
    marginBottom: spacing.md,
    lineHeight: 18,
    fontFamily: fonts.regular,
  },
  infoTitle: {
    fontSize: 16,
    color: colors.text,
    marginTop: spacing.lg,
    fontFamily: fonts.semibold,
  },
  infoText: {
    fontSize: 12,
    color: colors.lightText,
    marginTop: 6,
    marginBottom: 6,
    lineHeight: 18,
    fontFamily: fonts.regular,
  },
  criteriaList: {
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  criteriaCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    backgroundColor: colors.surface,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: spacing.sm,
  },
  criteriaCardLast: {
    marginBottom: 0,
  },
  criteriaTitle: {
    fontSize: 14,
    color: colors.text,
    fontFamily: fonts.semibold,
    marginBottom: 4,
  },
  criteriaDescription: {
    fontSize: 12,
    color: colors.mutedText,
    lineHeight: 18,
    fontFamily: fonts.regular,
  },
  totalText: {
    fontSize: 14,
    color: colors.text,
    marginBottom: spacing.lg,
    fontFamily: fonts.bold,
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
