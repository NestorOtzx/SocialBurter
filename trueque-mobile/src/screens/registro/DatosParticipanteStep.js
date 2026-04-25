import React, { useMemo, useState } from 'react';
import { Alert, Platform, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Chip from '../../components/Chip';
import CheckboxOption from '../../components/CheckboxOption';
import InputField from '../../components/InputField';
import WizardStepLayout from '../../components/WizardStepLayout';
import {
  CONDICIONES_CLIMATICAS,
  CORREGIMIENTOS_BY_MUNICIPIO,
  LIDERAZGO_OPTIONS,
  MUNICIPIOS,
  SISTEMAS_PRODUCTIVOS,
  TIPOS_SUELO,
} from '../../constants/options';
import { colors, fonts, spacing } from '../../constants/theme';
import { useFormValidator } from '../../hooks/useFormValidator';
import { saveParticipantRequest } from '../../services/api';
import { saveCachedParticipantProfile } from '../../services/profileCache';
import { buildParticipantPayload, hasMissingPredioData } from '../../services/participantTransforms';
import { useAuthStore } from '../../store/authStore';
import { useRegistroStore } from '../../store/registroStore';

function toggleSelection(list, value) {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
}

export default function DatosParticipanteStep({ completionOnly = false }) {
  const { width } = useWindowDimensions();
  const { required, numeric } = useFormValidator();
  const user = useAuthStore((state) => state.user);
  const participanteData = useRegistroStore((state) => state.participanteData);
  const isNewParticipant = useRegistroStore((state) => state.isNewParticipant);
  const mergeParticipantData = useRegistroStore((state) => state.mergeParticipantData);
  const setStep = useRegistroStore((state) => state.setStep);
  const setParticipantId = useRegistroStore((state) => state.setParticipantId);
  const setFaltanDatosPredio = useRegistroStore((state) => state.setFaltanDatosPredio);
  const markCompleted = useRegistroStore((state) => state.markCompleted);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const useTwoColumns = Platform.OS === 'web' ? width >= 360 : width >= 560;
  const rowStyle = [styles.row, !useTwoColumns && styles.rowStack];
  const corregimientos = useMemo(
    () => CORREGIMIENTOS_BY_MUNICIPIO[participanteData.municipio] || [],
    [participanteData.municipio]
  );

  const validateForm = () => {
    const nextErrors = {
      nombreCompleto: required(participanteData.nombreCompleto),
      celular: required(participanteData.celular),
      nombreFinca: required(participanteData.nombreFinca),
      municipio: required(participanteData.municipio),
      corregimiento: required(participanteData.corregimiento),
      vereda: required(participanteData.vereda),
      tipoSuelo: required(participanteData.tipoSuelo),
      condicionesClimaticas: required(participanteData.condicionesClimaticas),
      sistemasProductivos: required(participanteData.sistemasProductivos),
      liderazgo: required(participanteData.liderazgo),
      truequesAnio: numeric(participanteData.truequesAnio),
      latitud: numeric(participanteData.latitud),
      longitud: numeric(participanteData.longitud),
      altitud: numeric(participanteData.altitud),
    };

    setErrors(nextErrors);
    return !Object.values(nextErrors).some(Boolean);
  };

  const handleContinue = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setSaving(true);
      await saveCachedParticipantProfile(participanteData);

      if (!isNewParticipant || completionOnly) {
        const saved = await saveParticipantRequest(
          buildParticipantPayload(participanteData, user?.username, { mode: 'pre' }),
          { mode: 'pre', cedula: participanteData.cedula }
        );

        setParticipantId(saved?.id || null);
        await saveCachedParticipantProfile({ ...participanteData, id: saved?.id || null });
      }

      setFaltanDatosPredio(hasMissingPredioData(participanteData));

      if (completionOnly) {
        markCompleted();
      } else {
        setStep(3);
      }
    } catch (error) {
      Alert.alert('Error', 'Ocurrió un error de red. Intenta nuevamente.');
    } finally {
      setSaving(false);
    }
  };

  const renderChipGroup = (options, field, multi = false) => (
    <View style={styles.chipGroup}>
      {options.map((option) => {
        const selected = multi
          ? participanteData[field].includes(option)
          : participanteData[field] === option;

        return (
          <Chip
            key={option}
            label={option}
            compact
            small
            selected={selected}
            onPress={() => {
              if (multi) {
                mergeParticipantData({
                  [field]: toggleSelection(participanteData[field], option),
                });
              } else if (field === 'municipio') {
                mergeParticipantData({ municipio: option, corregimiento: '' });
              } else {
                mergeParticipantData({ [field]: option });
              }

              if (errors[field]) {
                setErrors((current) => ({ ...current, [field]: '' }));
              }
            }}
          />
        );
      })}
      {errors[field] ? <Text style={styles.errorText}>{errors[field]}</Text> : null}
    </View>
  );

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
          {saving ? 'Guardando...' : completionOnly ? 'Guardar datos faltantes' : 'Confirmar y continuar →'}
        </Text>
      </Pressable>
    </View>
  );

  return (
    <WizardStepLayout footer={footer}>
      {isNewParticipant ? (
        <View style={styles.banner}>
          <Text style={styles.bannerText}>Nuevo participante — completa el formulario.</Text>
        </View>
      ) : null}

      <Text style={styles.title}>Datos del Participante</Text>

      <Text style={styles.sectionTitle}>Datos personales</Text>
      <View style={rowStyle}>
        <View style={styles.fieldCell}>
          <InputField
            label="Nombre completo *"
            value={participanteData.nombreCompleto}
            onChangeText={(value) => mergeParticipantData({ nombreCompleto: value })}
            placeholder="Ej: María García López"
            error={errors.nombreCompleto}
            compact
          />
        </View>
        <View style={styles.fieldCell}>
          <InputField
            label="Celular *"
            value={participanteData.celular}
            onChangeText={(value) => mergeParticipantData({ celular: value })}
            placeholder="Ej: 3174567890"
            keyboardType="phone-pad"
            error={errors.celular}
            compact
          />
        </View>
      </View>
      <View style={rowStyle}>
        <View style={styles.fieldCell}>
          <InputField
            label="Trueques realizados en el año"
            value={participanteData.truequesAnio}
            onChangeText={(value) => mergeParticipantData({ truequesAnio: value })}
            keyboardType="numeric"
            error={errors.truequesAnio}
            compact
          />
        </View>
        {useTwoColumns ? <View style={styles.fieldCell} /> : null}
      </View>

      <Text style={styles.sectionTitle}>Datos de la finca</Text>
      <View style={rowStyle}>
        <View style={styles.fieldCell}>
          <InputField
            label="Nombre de la finca *"
            value={participanteData.nombreFinca}
            onChangeText={(value) => mergeParticipantData({ nombreFinca: value })}
            error={errors.nombreFinca}
            compact
          />
        </View>
        <View style={styles.fieldCell}>
          <InputField
            label="Latitud"
            value={participanteData.latitud}
            onChangeText={(value) => mergeParticipantData({ latitud: value })}
            placeholder="Ej: 1.2134"
            keyboardType="numeric"
            error={errors.latitud}
            compact
          />
        </View>
      </View>
      <View style={rowStyle}>
        <View style={styles.fieldCell}>
          <InputField
            label="Longitud"
            value={participanteData.longitud}
            onChangeText={(value) => mergeParticipantData({ longitud: value })}
            placeholder="Ej: -77.281"
            keyboardType="numeric"
            error={errors.longitud}
            compact
          />
        </View>
        <View style={styles.fieldCell}>
          <InputField
            label="Altitud (msnm)"
            value={participanteData.altitud}
            onChangeText={(value) => mergeParticipantData({ altitud: value })}
            placeholder="Ej: 2800"
            keyboardType="numeric"
            error={errors.altitud}
            compact
          />
        </View>
      </View>

      <Text style={styles.sectionTitle}>Ubicación</Text>
      <View style={rowStyle}>
        <View style={[styles.fieldCell, styles.fieldGroup]}>
          <Text style={styles.fieldLabel}>Municipio *</Text>
          {renderChipGroup(MUNICIPIOS, 'municipio')}
        </View>
        <View style={[styles.fieldCell, styles.fieldGroup]}>
          <Text style={styles.fieldLabel}>Corregimiento *</Text>
          {participanteData.municipio ? (
            renderChipGroup(corregimientos, 'corregimiento')
          ) : (
            <Text style={styles.infoText}>Selecciona un municipio primero</Text>
          )}
        </View>
      </View>

      <InputField
        label="Vereda *"
        value={participanteData.vereda}
        onChangeText={(value) => mergeParticipantData({ vereda: value })}
        helperText={!participanteData.corregimiento ? 'Selecciona un corregimiento primero' : undefined}
        error={errors.vereda}
        compact
      />

      <Text style={styles.sectionTitle}>Condiciones del predio</Text>
      <View style={rowStyle}>
        <View style={[styles.fieldCell, styles.fieldGroup]}>
          <Text style={styles.fieldLabel}>Tipo de suelo *</Text>
          {renderChipGroup(TIPOS_SUELO, 'tipoSuelo')}
        </View>
        <View style={[styles.fieldCell, styles.fieldGroup]}>
          <Text style={styles.fieldLabel}>Condiciones climáticas *</Text>
          {renderChipGroup(CONDICIONES_CLIMATICAS, 'condicionesClimaticas')}
        </View>
      </View>

      <View style={rowStyle}>
        <View style={[styles.fieldCell, styles.fieldGroup]}>
          <Text style={styles.fieldLabel}>Sistemas productivos *</Text>
          {renderChipGroup(SISTEMAS_PRODUCTIVOS, 'sistemasProductivos', true)}
        </View>
        <View style={[styles.fieldCell, styles.fieldGroup]}>
          <Text style={styles.fieldLabel}>El cultivo es liderado por:</Text>
          <View style={styles.checkboxGroup}>
            {LIDERAZGO_OPTIONS.map((option) => (
              <CheckboxOption
                key={option}
                label={option}
                compact
                selected={participanteData.liderazgo.includes(option)}
                onPress={() => {
                  mergeParticipantData({
                    liderazgo: toggleSelection(participanteData.liderazgo, option),
                  });

                  if (errors.liderazgo) {
                    setErrors((current) => ({ ...current, liderazgo: '' }));
                  }
                }}
              />
            ))}
          </View>
          {errors.liderazgo ? <Text style={styles.errorText}>{errors.liderazgo}</Text> : null}
        </View>
      </View>
    </WizardStepLayout>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: colors.warningBackground,
    borderRadius: 12,
    padding: 12,
    marginBottom: spacing.md,
  },
  bannerText: {
    color: colors.warningText,
    fontSize: 13,
    fontFamily: fonts.semibold,
  },
  title: {
    fontSize: 20,
    color: colors.text,
    fontFamily: fonts.bold,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: 15,
    color: colors.text,
    fontFamily: fonts.semibold,
    marginBottom: 8,
    marginTop: 4,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  rowStack: {
    flexDirection: 'column',
    gap: 0,
  },
  fieldCell: {
    flex: 1,
    minWidth: 0,
  },
  fieldGroup: {
    marginBottom: spacing.xs,
  },
  fieldLabel: {
    fontSize: 12,
    color: colors.text,
    marginBottom: 6,
    fontFamily: fonts.semibold,
  },
  chipGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: spacing.sm,
  },
  checkboxGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: spacing.sm,
  },
  infoText: {
    marginBottom: spacing.sm,
    color: colors.lightText,
    fontSize: 11,
    fontFamily: fonts.regular,
  },
  errorText: {
    width: '100%',
    color: colors.error,
    fontSize: 11,
    fontFamily: fonts.medium,
    marginBottom: spacing.sm,
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
    flex: 1.5,
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
});
