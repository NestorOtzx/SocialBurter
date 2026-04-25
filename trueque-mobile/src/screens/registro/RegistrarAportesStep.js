import React, { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import Chip from '../../components/Chip';
import InputField from '../../components/InputField';
import WizardStepLayout from '../../components/WizardStepLayout';
import {
  APORTE_CATEGORIES,
  getCategoryPlaceholder,
  getCategoryUnit,
} from '../../constants/options';
import { colors, fonts, shadow, spacing } from '../../constants/theme';
import { useFormValidator } from '../../hooks/useFormValidator';
import { addContributionsRequest, saveParticipantRequest } from '../../services/api';
import { saveCachedParticipantProfile } from '../../services/profileCache';
import {
  buildParticipantPayload,
  hasMissingPredioData,
  mapAportesToContributions,
} from '../../services/participantTransforms';
import { useAuthStore } from '../../store/authStore';
import { useRegistroStore } from '../../store/registroStore';

const CURRENT_YEAR = new Date().getFullYear();

export default function RegistrarAportesStep({ tipoRegistro, navigation }) {
  const { required, positiveNumber } = useFormValidator();
  const user = useAuthStore((state) => state.user);
  const participantId = useRegistroStore((state) => state.participantId);
  const participanteData = useRegistroStore((state) => state.participanteData);
  const isNewParticipant = useRegistroStore((state) => state.isNewParticipant);
  const faltanDatosPredio = useRegistroStore((state) => state.faltanDatosPredio);
  const aportes = useRegistroStore((state) => state.aportes);
  const updateAporte = useRegistroStore((state) => state.updateAporte);
  const addAporte = useRegistroStore((state) => state.addAporte);
  const removeAporte = useRegistroStore((state) => state.removeAporte);
  const setStep = useRegistroStore((state) => state.setStep);
  const setParticipantId = useRegistroStore((state) => state.setParticipantId);
  const markCompleted = useRegistroStore((state) => state.markCompleted);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const validateAportes = () => {
    const nextErrors = {};

    aportes.forEach((aporte) => {
      nextErrors[aporte.localId] = {
        categoria: required(aporte.categoria),
        tipo: required(aporte.tipo),
        cantidad: positiveNumber(aporte.cantidad),
      };
    });

    setErrors(nextErrors);

    return (
      aportes.length > 0 &&
      Object.values(nextErrors).every(
        (error) => !error.categoria && !error.tipo && !error.cantidad
      )
    );
  };

  const handleSubmit = async () => {
    if (!validateAportes()) {
      return;
    }

    try {
      setSubmitting(true);
      let activeParticipantId = participantId;

      if (isNewParticipant || !activeParticipantId) {
        const saved = await saveParticipantRequest(
          buildParticipantPayload(participanteData, user?.username, { mode: tipoRegistro }),
          { mode: tipoRegistro, cedula: participanteData.cedula }
        );

        activeParticipantId = saved?.id;
        setParticipantId(activeParticipantId);
        await saveCachedParticipantProfile({ ...participanteData, id: activeParticipantId });
      }

      await addContributionsRequest(
        activeParticipantId,
        CURRENT_YEAR,
        mapAportesToContributions(aportes, CURRENT_YEAR),
        { mode: tipoRegistro }
      );

      if (tipoRegistro === 'diaTrueque' && (faltanDatosPredio || hasMissingPredioData(participanteData))) {
        Alert.alert(
          'Aportes registrados',
          'Faltan datos del predio. ¿Desea completarlos ahora?',
          [
            {
              text: 'Ahora no',
              onPress: () => markCompleted(),
            },
            {
              text: 'Completar',
              onPress: () =>
                navigation.navigate('PreRegistroWizardScreen', {
                  initialParticipantData: participanteData,
                  participantId: activeParticipantId,
                  startStep: 2,
                  completionOnly: true,
                }),
            },
          ]
        );
      } else {
        markCompleted();
      }
    } catch (error) {
      Alert.alert('Error', 'Ocurrió un error de red. Intenta nuevamente.');
    } finally {
      setSubmitting(false);
    }
  };

  const footer = (
    <View style={styles.footerButtons}>
      <Pressable style={styles.secondaryButton} onPress={() => setStep(2)}>
        <Text style={styles.secondaryButtonText}>Volver</Text>
      </Pressable>
      <Pressable
        style={[styles.primaryButton, submitting && styles.disabledButton]}
        onPress={handleSubmit}
        disabled={submitting}
      >
        <Text style={styles.primaryButtonText}>
          {submitting ? 'Registrando...' : 'Registrar aportes'}
        </Text>
      </Pressable>
    </View>
  );

  return (
    <WizardStepLayout footer={footer}>
      <View style={styles.participantCard}>
        <View>
          <Text style={styles.participantName}>{participanteData.nombreCompleto || 'Participante'}</Text>
          <Text style={styles.participantCedula}>CC {participanteData.cedula}</Text>
          <Text style={styles.participantMeta}>
            {participanteData.nombreFinca || 'Finca no registrada'} · {participanteData.municipio || 'Municipio no registrado'}
          </Text>
        </View>
        <Pressable onPress={() => setStep(2)}>
          <Text style={styles.changeText}>Cambiar</Text>
        </Pressable>
      </View>

      <Text style={styles.title}>¿Qué trae al trueque?</Text>
      <Text style={styles.description}>
        Registra cada categoría de aporte por separado. Puedes agregar varios. Los aportes se acumulan a los ya registrados.
      </Text>

      {aportes.map((aporte, index) => (
        <View key={aporte.localId} style={styles.aporteCard}>
          <View style={styles.aporteHeader}>
            <Text style={styles.aporteTitle}>Aporte {index + 1}</Text>
            {aportes.length > 1 ? (
              <Pressable onPress={() => removeAporte(aporte.localId)}>
                <Feather name="trash-2" size={18} color={colors.error} />
              </Pressable>
            ) : null}
          </View>

          <Text style={styles.label}>Categoría *</Text>
          <View style={styles.categoryGroup}>
            {APORTE_CATEGORIES.map((category) => (
              <Chip
                key={category.value}
                label={category.label}
                compact
                small
                selected={aporte.categoria === category.value}
                onPress={() =>
                  updateAporte(aporte.localId, {
                    categoria: category.value,
                    unidad: getCategoryUnit(category.value),
                  })
                }
              />
            ))}
            {errors[aporte.localId]?.categoria ? (
              <Text style={styles.errorText}>{errors[aporte.localId]?.categoria}</Text>
            ) : null}
          </View>

          <InputField
            label="Tipo / Especificación *"
            value={aporte.tipo}
            onChangeText={(value) => updateAporte(aporte.localId, { tipo: value })}
            placeholder={getCategoryPlaceholder(aporte.categoria)}
            error={errors[aporte.localId]?.tipo}
            compact
          />

          <View style={styles.quantityRow}>
            <View style={styles.quantityInput}>
              <InputField
                label="Cantidad *"
                value={aporte.cantidad}
                onChangeText={(value) => updateAporte(aporte.localId, { cantidad: value })}
                keyboardType="numeric"
                error={errors[aporte.localId]?.cantidad}
                compact
              />
            </View>
            <View style={styles.unitCard}>
              <Text style={styles.unitLabel}>Unidad</Text>
              <Text style={styles.unitValue}>{aporte.unidad || 'kg'}</Text>
            </View>
          </View>
        </View>
      ))}

      <Pressable style={styles.addButton} onPress={addAporte}>
        <Text style={styles.addButtonText}>+ Agregar otro aporte</Text>
      </Pressable>
    </WizardStepLayout>
  );
}

const styles = StyleSheet.create({
  participantCard: {
    marginTop: spacing.xs,
    borderRadius: 16,
    padding: spacing.md,
    backgroundColor: colors.background,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    ...shadow,
  },
  participantName: {
    fontSize: 16,
    color: colors.text,
    fontFamily: fonts.bold,
  },
  participantCedula: {
    fontSize: 13,
    color: colors.mutedText,
    marginTop: 4,
    fontFamily: fonts.regular,
  },
  participantMeta: {
    fontSize: 12,
    color: colors.lightText,
    marginTop: 4,
    fontFamily: fonts.regular,
  },
  changeText: {
    color: colors.primary,
    fontSize: 14,
    fontFamily: fonts.semibold,
  },
  title: {
    fontSize: 18,
    color: colors.text,
    fontFamily: fonts.bold,
    marginTop: spacing.lg,
  },
  description: {
    color: colors.mutedText,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
    marginBottom: spacing.lg,
    fontFamily: fonts.regular,
  },
  aporteCard: {
    borderRadius: 16,
    padding: spacing.md,
    backgroundColor: colors.background,
    marginBottom: spacing.md,
    ...shadow,
  },
  aporteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  aporteTitle: {
    fontSize: 16,
    color: colors.text,
    fontFamily: fonts.bold,
  },
  label: {
    fontSize: 13,
    color: colors.text,
    marginBottom: 8,
    fontFamily: fonts.semibold,
  },
  categoryGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: spacing.sm,
  },
  quantityRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
  },
  quantityInput: {
    flex: 1.3,
  },
  unitCard: {
    flex: 0.7,
    minHeight: 54,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: colors.surface,
    justifyContent: 'center',
  },
  unitLabel: {
    fontSize: 11,
    color: colors.lightText,
    marginBottom: 4,
    fontFamily: fonts.medium,
  },
  unitValue: {
    fontSize: 13,
    color: colors.text,
    fontFamily: fonts.bold,
  },
  errorText: {
    width: '100%',
    color: colors.error,
    fontSize: 11,
    fontFamily: fonts.medium,
  },
  addButton: {
    alignSelf: 'flex-start',
    paddingVertical: 10,
  },
  addButtonText: {
    color: colors.primary,
    fontSize: 15,
    fontFamily: fonts.semibold,
  },
  footerButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  secondaryButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: colors.text,
    fontFamily: fonts.semibold,
    fontSize: 13,
  },
  primaryButton: {
    flex: 1.4,
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: colors.background,
    fontFamily: fonts.bold,
    fontSize: 13,
  },
  disabledButton: {
    opacity: 0.7,
  },
});
