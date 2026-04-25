import React, { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import InputField from '../../components/InputField';
import { colors, fonts, spacing } from '../../constants/theme';
import { searchParticipantRequest } from '../../services/api';
import { getCachedParticipantProfile } from '../../services/profileCache';
import {
  createBlankParticipant,
  hasMissingPredioData,
  mergeParticipantProfile,
} from '../../services/participantTransforms';
import { useRegistroStore } from '../../store/registroStore';

export default function BuscarParticipanteStep({ tipoRegistro }) {
  const participanteData = useRegistroStore((state) => state.participanteData);
  const mergeParticipantData = useRegistroStore((state) => state.mergeParticipantData);
  const setParticipantSearchResult = useRegistroStore((state) => state.setParticipantSearchResult);
  const setParticipantNotFound = useRegistroStore((state) => state.setParticipantNotFound);
  const [cedulaError, setCedulaError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    const cedula = participanteData.cedula.trim();

    if (!cedula) {
      setCedulaError('La cédula es obligatoria');
      return;
    }

    if (!/^\d+$/.test(cedula)) {
      setCedulaError('Solo se permiten números');
      return;
    }

    try {
      setCedulaError('');
      setLoading(true);
      const cachedProfile = await getCachedParticipantProfile(cedula);

      try {
        const backendParticipant = await searchParticipantRequest(cedula);
        const mergedProfile = mergeParticipantProfile(backendParticipant, cachedProfile);

        setParticipantSearchResult({
          participanteData: mergedProfile,
          originalParticipantData: mergedProfile,
          participantId: backendParticipant.id || cachedProfile?.id || null,
          participantStatus: 'existing',
          isNewParticipant: false,
          faltanDatosPredio: hasMissingPredioData(mergedProfile),
        });
      } catch (error) {
        if (error?.response?.status === 404) {
          if (tipoRegistro === 'diaTrueque') {
            setParticipantNotFound(cedula);
          } else {
            const newParticipant = createBlankParticipant(cedula);

            setParticipantSearchResult({
              participanteData: newParticipant,
              originalParticipantData: newParticipant,
              participantId: null,
              participantStatus: 'new',
              isNewParticipant: true,
              faltanDatosPredio: true,
            });
          }
        } else {
          throw error;
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Ocurrió un error de red. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Buscar Participante</Text>
      <Text style={styles.subtitle}>Identificación</Text>
      <Text style={styles.helper}>
        Ingresa la cédula para verificar si el participante ya existe o crear un nuevo registro.
      </Text>

      <InputField
        label="Número de cédula *"
        value={participanteData.cedula}
        onChangeText={(value) => {
          mergeParticipantData({ cedula: value });
          if (cedulaError) {
            setCedulaError('');
          }
        }}
        placeholder="Ej: 1008123456"
        keyboardType="numeric"
        maxLength={10}
        error={cedulaError}
        rightElement={
          <Pressable style={styles.searchButton} onPress={handleSearch} disabled={loading}>
            <Feather name="search" size={20} color={colors.background} />
          </Pressable>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    backgroundColor: colors.surface,
  },
  title: {
    fontSize: 22,
    color: colors.text,
    fontFamily: fonts.bold,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: 16,
    color: colors.text,
    fontFamily: fonts.semibold,
    marginBottom: 6,
  },
  helper: {
    fontSize: 14,
    color: colors.mutedText,
    fontFamily: fonts.regular,
    lineHeight: 20,
    marginBottom: spacing.lg,
  },
  searchButton: {
    width: 40,
    height: 40,
    borderRadius: 24,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
});
