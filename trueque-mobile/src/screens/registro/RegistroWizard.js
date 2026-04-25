import React, { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import AppHeader from '../../components/AppHeader';
import Stepper from '../../components/Stepper';
import { REGISTRO_STEPS, REGISTRO_TITLES } from '../../constants/options';
import { colors, fonts, spacing } from '../../constants/theme';
import { hasMissingPredioData } from '../../services/participantTransforms';
import { useRegistroStore } from '../../store/registroStore';
import BuscarParticipanteStep from './BuscarParticipanteStep';
import DatosParticipanteStep from './DatosParticipanteStep';
import RegistrarAportesStep from './RegistrarAportesStep';
import ResumenParticipanteTruequeStep from './ResumenParticipanteTruequeStep';

export default function RegistroWizard({ navigation, route, tipoRegistro = 'pre' }) {
  const step = useRegistroStore((state) => state.step);
  const completed = useRegistroStore((state) => state.completed);
  const startFlow = useRegistroStore((state) => state.startFlow);
  const resetWizard = useRegistroStore((state) => state.resetWizard);
  const setParticipantSearchResult = useRegistroStore((state) => state.setParticipantSearchResult);

  useEffect(() => {
    startFlow(tipoRegistro);

    if (route?.params?.initialParticipantData) {
      const participantData = route.params.initialParticipantData;

      setParticipantSearchResult({
        participanteData: participantData,
        originalParticipantData: participantData,
        participantId: route.params.participantId || participantData.id || null,
        participantStatus: 'existing',
        isNewParticipant: false,
        faltanDatosPredio: hasMissingPredioData(participantData),
        nextStep: route.params.startStep || 2,
      });

      navigation.setParams({
        initialParticipantData: undefined,
        participantId: undefined,
        startStep: undefined,
        completionOnly: false,
      });
    }
  }, [navigation, route?.key, route?.params, setParticipantSearchResult, startFlow, tipoRegistro]);

  const isCompletionOnly = Boolean(route?.params?.completionOnly);
  const screenTitle = REGISTRO_TITLES[tipoRegistro];
  const successDescription =
    tipoRegistro === 'diaTrueque'
      ? 'Los aportes fueron registrados exitosamente.'
      : isCompletionOnly
        ? 'Los datos del participante fueron actualizados exitosamente.'
        : 'El participante y sus aportes fueron registrados exitosamente.';

  const renderCurrentStep = () => {
    if (completed) {
      return (
        <View style={styles.successContainer}>
          <Text style={styles.successTitle}>Registro completado</Text>
          <Text style={styles.successDescription}>{successDescription}</Text>

          <Pressable
            style={styles.primaryButton}
            onPress={() => {
              resetWizard();
              navigation.navigate(tipoRegistro === 'pre' ? 'PreRegistroWizardScreen' : 'RegistroRapidoTruequeScreen');
            }}
          >
            <Text style={styles.primaryButtonText}>
              {tipoRegistro === 'pre' ? 'Registrar otro participante' : 'Registrar otro aporte'}
            </Text>
          </Pressable>

          <Pressable
            style={styles.secondaryButton}
            onPress={() => {
              resetWizard();
              navigation.navigate('HomeScreen');
            }}
          >
            <Text style={styles.secondaryButtonText}>Ir al Home</Text>
          </Pressable>
        </View>
      );
    }

    if (step === 1) {
      return <BuscarParticipanteStep tipoRegistro={tipoRegistro} />;
    }

    if (step === 2 && tipoRegistro === 'diaTrueque') {
      return <ResumenParticipanteTruequeStep navigation={navigation} />;
    }

    if (step === 2) {
      return <DatosParticipanteStep completionOnly={isCompletionOnly} />;
    }

    return <RegistrarAportesStep tipoRegistro={tipoRegistro} navigation={navigation} />;
  };

  return (
    <View style={styles.screen}>
      <AppHeader title={screenTitle} />
      <Stepper currentStep={completed ? 3 : step} steps={REGISTRO_STEPS[tipoRegistro]} />
      <View style={styles.content}>{renderCurrentStep()}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    minHeight: 0,
    backgroundColor: colors.surface,
  },
  content: {
    flex: 1,
    minHeight: 0,
    backgroundColor: colors.surface,
  },
  successContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  successTitle: {
    fontSize: 24,
    color: colors.text,
    fontFamily: fonts.bold,
    marginBottom: spacing.sm,
  },
  successDescription: {
    fontSize: 15,
    color: colors.mutedText,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.xl,
    fontFamily: fonts.regular,
  },
  primaryButton: {
    width: '100%',
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  primaryButtonText: {
    color: colors.background,
    fontFamily: fonts.bold,
  },
  secondaryButton: {
    width: '100%',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 14,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: colors.text,
    fontFamily: fonts.semibold,
  },
});
