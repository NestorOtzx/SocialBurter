import axios from 'axios';
import * as Network from 'expo-network';
import { normalizeParticipantResponse } from './participantTransforms';
import { getStoredSession } from './authStorage';
import { useAuthStore } from '../store/authStore';
import { saveOfflineParticipant, saveOfflineContributions } from './localDb';
import { getCachedRanking, saveCachedRanking, getCachedHistory, saveCachedHistory } from './profileCache';

export const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:3000';

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 12000,
});

let isClearingInvalidSession = false;

api.interceptors.request.use(async (config) => {
  const session = await getStoredSession();

  if (session?.token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${session.token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error?.response?.status;
    const requestUrl = error?.config?.url || '';
    const isAuthRequest = requestUrl.includes('/auth/login');

    if (!isAuthRequest && (status === 401 || status === 403) && !isClearingInvalidSession) {
      isClearingInvalidSession = true;

      try {
        await useAuthStore.getState().signOut();
      } finally {
        isClearingInvalidSession = false;
      }
    }

    return Promise.reject(error);
  }
);

function normalizePercent(value) {
  if (value === null || value === undefined) {
    return 0;
  }

  return value <= 1 ? (value * 100) : value;
}

function normalizeRankingResponse(response, eventYear) {
  const ranking = response?.ranking || response?.data || response || [];

  return {
    rule: normalizeConfigResponse(response?.rule || response?.config || null, eventYear),
    ranking: Array.isArray(ranking)
      ? ranking.map((item) => ({
          ...item,
          puntaje: item?.puntaje ?? item?.score ?? 0,
          practicas: item?.practicas ?? item?.practice ?? item?.practices ?? 0,
          liderazgo: item?.liderazgo ?? item?.leadership ?? 0,
        }))
      : [],
  };
}

function normalizeConfigResponse(rule, eventYear) {
  if (!rule) {
    return {
      eventYear: Number(eventYear),
      pesos: {
        diversidad: 25,
        volumen: 25,
        practicas: 25,
        liderazgo: 25,
      },
      tieBreaker: 'diversity',
    };
  }

  const pesos = rule.pesos || {};

  return {
    eventYear: Number(rule.eventYear || rule.year || eventYear),
    pesos: {
      diversidad: normalizePercent(pesos.diversidad ?? rule.diversityWeight ?? rule.diversityweight ?? rule.diversity ?? 0),
      volumen: normalizePercent(pesos.volumen ?? rule.volumeWeight ?? rule.volumeweight ?? rule.volume ?? 0),
      practicas: normalizePercent(pesos.practicas ?? rule.practiceWeight ?? rule.practiceweight ?? rule.practicesWeight ?? rule.practices ?? 0),
      liderazgo: normalizePercent(pesos.liderazgo ?? rule.leadershipWeight ?? rule.leadershipweight ?? rule.leadership ?? 0),
    },
    tieBreaker: rule.tieBreaker || rule.desempate || 'diversity',
  };
}

async function tryRequest(requests) {
  let lastError = null;

  for (const request of requests) {
    try {
      return await request();
    } catch (error) {
      lastError = error;

      if (error?.response?.status && error.response.status !== 404) {
        throw error;
      }
    }
  }

  throw lastError;
}

export async function loginRequest(usuario, password) {
  const response = await api.post('/auth/login', {
    username: usuario,
    password,
  });

  return response.data;
}

export async function searchParticipantRequest(cedula) {
  const response = await api.get('/participants/by-cedula', {
    params: { cedula },
  });

  return normalizeParticipantResponse(response.data);
}

export async function saveParticipantRequest(participant, options = {}) {
  const payload = {
    participant,
    esPreRegistro: options.mode === 'pre',
    tipoRegistro: options.mode || 'pre',
    basicOnly: Boolean(options.basicOnly),
  };

  const netInfo = await Network.getNetworkStateAsync();
  if (!netInfo.isConnected) {
    // Offline Mode
    await saveOfflineParticipant(payload);
    // Return mock response so UI continues
    return normalizeParticipantResponse(participant);
  }

  const response = await tryRequest([
    async () => {
      if (options.mode !== 'pre') {
        throw Object.assign(new Error('skip'), { response: { status: 404 } });
      }

      return api.post('/participants/preregister', payload);
    },
    async () => api.post('/participants', payload),
  ]);

  return normalizeParticipantResponse(response.data);
}

export async function addContributionsRequest(participantId, eventYear, contributions, options = {}) {
  const payload = {
    eventYear,
    year: eventYear,
    contributions,
    aportes: contributions,
    tipoRegistro: options.mode || 'pre',
  };

  const netInfo = await Network.getNetworkStateAsync();
  if (!netInfo.isConnected) {
    // Participant ID might not be valid offline (if just created), use cedula if passed in options
    const cedula = options.cedula; 
    if (!cedula) throw new Error("Cedula is required for offline contribution saving");
    await saveOfflineContributions(cedula, eventYear, payload);
    return { success: true, offline: true };
  }

  const response = await api.post(`/participants/${participantId}/contributions`, payload);

  return response.data;
}

export async function fetchRankingRequest(eventYear) {
  try {
    const netInfo = await Network.getNetworkStateAsync();
    if (!netInfo.isConnected) {
      const cached = await getCachedRanking(eventYear);
      if (cached) return normalizeRankingResponse(cached);
      throw new Error('No internet and no cached ranking data');
    }

    const response = await api.get('/ranking', {
      params: {
        eventYear,
        year: eventYear,
      },
    });

    await saveCachedRanking(eventYear, response.data);
    return normalizeRankingResponse(response.data, eventYear);
  } catch (error) {
    if (error?.response?.status !== 404) {
      const cached = await getCachedRanking(eventYear);
      if (cached) return normalizeRankingResponse(cached, eventYear);
    }
    throw error;
  }
}

export async function fetchHistoricalContributionsRequest(eventYear) {
  try {
    const netInfo = await Network.getNetworkStateAsync();
    if (!netInfo.isConnected) {
      const cached = await getCachedHistory(eventYear);
      if (cached) return cached;
      throw new Error('No internet and no cached history data');
    }

    const response = await api.get('/participants/contributions', {
      params: {
        eventYear,
        year: eventYear,
      },
    });

    await saveCachedHistory(eventYear, response.data || []);
    return response.data || [];
  } catch (error) {
    if (error?.response?.status !== 404) {
      const cached = await getCachedHistory(eventYear);
      if (cached) return cached;
    }
    throw error;
  }
}

export async function fetchConfigurationRequest(eventYear) {
  const response = await api.get('/ranking/rule', {
    params: {
      eventYear,
      year: eventYear,
    },
  });

  return normalizeConfigResponse(response.data, eventYear);
}

export async function saveConfigurationRequest(payload) {
  const response = await api.post('/ranking/rule', {
    eventYear: Number(payload.eventYear),
    year: Number(payload.eventYear),
    pesos: payload.pesos,
    diversityWeight: payload.pesos.diversidad / 100,
    volumeWeight: payload.pesos.volumen / 100,
    practiceWeight: payload.pesos.practicas / 100,
    practicesWeight: payload.pesos.practicas / 100,
    leadershipWeight: payload.pesos.liderazgo / 100,
    tieBreaker: payload.tieBreaker,
  });

  return response.data;
}

export async function deleteParticipantRequest(cedula) {
  const response = await api.delete(`/participants/${cedula}`);
  return response.data;
}

export async function deleteContributionRequest(id) {
  const response = await api.delete(`/participants/contributions/${id}`);
  return response.data;
}

export async function changePasswordRequest(currentPassword, newPassword) {
  const response = await api.post('/auth/change-password', {
    currentPassword,
    newPassword,
  });
  return response.data;
}
