import React, { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import CheckboxOption from '../../components/CheckboxOption';
import InputField from '../../components/InputField';
import WizardStepLayout from '../../components/WizardStepLayout';
import { colors, fonts, shadow, spacing } from '../../constants/theme';
import { useFormValidator } from '../../hooks/useFormValidator';
import { saveParticipantRequest } from '../../services/api';
import { saveCachedParticipantProfile } from '../../services/profileCache';
import { buildParticipantPayload, hasMissingPredioData } from '../../services/participantTransforms';
import { useAuthStore } from '../../store/authStore';
import { useRegistroStore } from '../../store/registroStore';

export default function ResumenParticipanteTruequeStep({ navigation }) {
  const { numeric } = useFormValidator();
  const user = useAuthStore((state) => state.user);
  const participanteData = useRegistroStore((state) => state.participanteData);
  const participantStatus = useRegistroStore((state) => state.participantStatus);
  const mergeParticipantData = useRegistroStore((state) => state.mergeParticipantData);
  const setStep = useRegistroStore((state) => state.setStep);
  const setParticipantId = useRegistroStore((state) => state.setParticipantId);
  const faltanDatosPredio = useRegistroStore((state) => state.faltanDatosPredio);
  const setFaltanDatosPredio = useRegistroStore((state) => state.setFaltanDatosPredio);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const handleContinue = async () => {
    const nextErrors = {
      celular: participanteData.celular ? numeric(participanteData.celular) : '',
    };

    setErrors(nextErrors);

    if (Object.values(nextErrors).some(Boolean)) {
      return;
    }

    try {
      setSaving(true);
      const saved = await saveParticipantRequest(
        buildParticipantPayload(participanteData, user?.username, { mode: 'diaTrueque' }),
        {
          mode: 'diaTrueque',
          cedula: participanteData.cedula,
          basicOnly: true,
        }
      );

      setParticipantId(saved?.id || null);
      await saveCachedParticipantProfile({ ...participanteData, id: saved?.id || null });
      setFaltanDatosPredio(faltanDatosPredio || hasMissingPredioData(participanteData));
      setStep(3);
    } catch (error) {
      Alert.alert('Error', 'Ocurrió un error de red. Intenta nuevamente.');
    } finally {
      setSaving(false);
    }
  };

  if (participantStatus === 'missing') {
    const footer = (
      <View style={styles.footerButtons}>
        <Pressable style={styles.secondaryButton} onPress={() => setStep(1)}>
          <Text style={styles.secondaryButtonText}>Volver</Text>
        </Pressable>
      </View>
    );

    return (
      <WizardStepLayout footer={footer}>
        <View style={styles.warningCard}>
          <Text style={styles.warningTitle}>Participante no registrado</Text>
          <Text style={styles.warningText}>
            Participante no registrado. Por favor use el módulo de Pre‑registro primero.
          </Text>
          <Pressable
            style={styles.primaryLinkButton}
            onPress={() => navigation.navigate('PreRegistroWizardScreen')}
          >
            <Text style={styles.primaryLinkButtonText}>Ir al Pre‑registro</Text>
          </Pressable>
        </View>
      </WizardStepLayout>
    );
  }

  const footer = (
    <View style={styles.footerButtons}>
      <Pressable style={styles.secondaryButton} onPress={() => setStep(1)}>
        <Text style={styles.secondaryButtonText}>Volver</Text>
      </Pressable>
      <Pressable
        style={[styles.primaryButton, saving && styles.disabledButton]}
        onPress={handleContinue}
        disabled={saving}
      >
        <Text style={styles.primaryButtonText}>
          {saving ? 'Guardando...' : 'Continuar a aportes →'}
        </Text>
      </Pressable>
    </View>
  );

  return (
    <WizardStepLayout footer={footer}>
      <View style={styles.infoBanner}>
        <Text style={styles.infoBannerText}>
          Los datos del predio no son necesarios hoy, pueden completarse después.
        </Text>
      </View>

      <Text style={styles.title}>Resumen del Participante</Text>

      <View style={styles.summaryCard}>
        <View style={styles.summaryHeader}>
          <Feather name="user" size={18} color={colors.primary} />
          <Text style={styles.summaryTitle}>{participanteData.nombreCompleto || 'Sin nombre'}</Text>
        </View>
        <Text style={styles.summaryText}>CC {participanteData.cedula}</Text>
        <Text style={styles.summaryText}>Finca: {participanteData.nombreFinca || 'Sin registrar'}</Text>
        <Text style={styles.summaryText}>Municipio: {participanteData.municipio || 'Sin registrar'}</Text>
      </View>

      <Text style={styles.sectionTitle}>Edición rápida</Text>
      <InputField
        label="Celular"
        value={participanteData.celular}
        onChangeText={(value) => mergeParticipantData({ celular: value })}
        placeholder="Ej: 3174567890"
        keyboardType="phone-pad"
        error={errors.celular}
        compact
      />
      <InputField
        label="Nombre de la finca"
        value={participanteData.nombreFinca}
        onChangeText={(value) => mergeParticipantData({ nombreFinca: value })}
        compact
      />

      <View style={styles.checkboxWrap}>
        <CheckboxOption
          label="Falta información del predio"
          selected={faltanDatosPredio}
          compact
          onPress={() => setFaltanDatosPredio(!faltanDatosPredio)}
        />
      </View>
    </WizardStepLayout>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 20,
    color: colors.text,
    fontFamily: fonts.bold,
    marginBottom: spacing.md,
  },
  infoBanner: {
    backgroundColor: colors.blueLight,
    borderRadius: 12,
    padding: 12,
    marginBottom: spacing.md,
  },
  infoBannerText: {
    color: colors.primary,
    fontSize: 13,
    lineHeight: 18,
    fontFamily: fonts.medium,
  },
  summaryCard: {
    borderRadius: 16,
    padding: spacing.md,
    backgroundColor: colors.background,
    marginBottom: spacing.md,
    ...shadow,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryTitle: {
    marginLeft: 8,
    fontSize: 16,
    color: colors.text,
    fontFamily: fonts.bold,
  },
  summaryText: {
    fontSize: 13,
    color: colors.mutedText,
    marginTop: 4,
    fontFamily: fonts.regular,
  },
  sectionTitle: {
    fontSize: 15,
    color: colors.text,
    fontFamily: fonts.semibold,
    marginBottom: 8,
  },
  checkboxWrap: {
    marginTop: spacing.sm,
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
    fontSize: 13,
    fontFamily: fonts.semibold,
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
    fontSize: 13,
    fontFamily: fonts.bold,
  },
  disabledButton: {
    opacity: 0.7,
  },
  warningCard: {
    borderRadius: 16,
    backgroundColor: colors.warningBackground,
    padding: spacing.lg,
  },
  warningTitle: {
    fontSize: 18,
    color: colors.warningText,
    fontFamily: fonts.bold,
    marginBottom: spacing.sm,
  },
  warningText: {
    fontSize: 14,
    color: colors.warningText,
    lineHeight: 20,
    marginBottom: spacing.lg,
    fontFamily: fonts.regular,
  },
  primaryLinkButton: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  primaryLinkButtonText: {
    color: colors.background,
    fontSize: 13,
    fontFamily: fonts.bold,
  },
});
