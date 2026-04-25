import { create } from 'zustand';
import { getCategoryUnit } from '../constants/options';

const createAporte = () => ({
  localId: `${Date.now()}-${Math.random()}`,
  categoria: '',
  tipo: '',
  cantidad: '',
  unidad: 'kg',
});

export const emptyParticipantData = {
  cedula: '',
  nombreCompleto: '',
  celular: '',
  truequesAnio: '0',
  nombreFinca: '',
  latitud: '',
  longitud: '',
  altitud: '',
  municipio: '',
  corregimiento: '',
  vereda: '',
  tipoSuelo: '',
  condicionesClimaticas: '',
  sistemasProductivos: [],
  liderazgo: [],
  esPreRegistro: false,
};

const createInitialState = (tipoRegistro = 'pre') => ({
  tipoRegistro,
  step: 1,
  participantId: null,
  participantStatus: 'idle',
  isNewParticipant: false,
  faltanDatosPredio: false,
  participanteData: { ...emptyParticipantData },
  originalParticipantData: { ...emptyParticipantData },
  aportes: [createAporte()],
  completed: false,
});

export const useRegistroStore = create((set) => ({
  ...createInitialState(),
  startFlow: (tipoRegistro) => set(createInitialState(tipoRegistro)),
  setStep: (step) => set({ step }),
  setParticipantData: (participanteData) => set({ participanteData }),
  setOriginalParticipantData: (originalParticipantData) => set({ originalParticipantData }),
  mergeParticipantData: (patch) =>
    set((state) => ({
      participanteData: { ...state.participanteData, ...patch },
    })),
  setParticipantSearchResult: ({
    participanteData,
    originalParticipantData,
    participantId,
    participantStatus = 'existing',
    isNewParticipant,
    faltanDatosPredio = false,
    nextStep = 2,
  }) =>
    set({
      participanteData,
      originalParticipantData: originalParticipantData || participanteData,
      participantId,
      participantStatus,
      isNewParticipant,
      faltanDatosPredio,
      step: nextStep,
      completed: false,
    }),
  setParticipantNotFound: (cedula) =>
    set((state) => ({
      participanteData: { ...emptyParticipantData, cedula },
      originalParticipantData: { ...emptyParticipantData, cedula },
      participantId: null,
      participantStatus: 'missing',
      isNewParticipant: false,
      faltanDatosPredio: true,
      step: 2,
      completed: false,
      tipoRegistro: state.tipoRegistro,
    })),
  setParticipantId: (participantId) => set({ participantId }),
  setParticipantStatus: (participantStatus) => set({ participantStatus }),
  setIsNewParticipant: (isNewParticipant) => set({ isNewParticipant }),
  setFaltanDatosPredio: (faltanDatosPredio) => set({ faltanDatosPredio }),
  addAporte: () =>
    set((state) => ({
      aportes: [...state.aportes, createAporte()],
    })),
  updateAporte: (localId, patch) =>
    set((state) => ({
      aportes: state.aportes.map((aporte) => {
        if (aporte.localId !== localId) {
          return aporte;
        }

        const nextAporte = { ...aporte, ...patch };

        if (patch.categoria) {
          nextAporte.unidad = getCategoryUnit(patch.categoria);
        }

        return nextAporte;
      }),
    })),
  removeAporte: (localId) =>
    set((state) => ({
      aportes:
        state.aportes.length === 1
          ? state.aportes
          : state.aportes.filter((aporte) => aporte.localId !== localId),
    })),
  resetWizard: () => set((state) => createInitialState(state.tipoRegistro)),
  markCompleted: () => set({ completed: true }),
}));
