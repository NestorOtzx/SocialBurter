import axios from 'axios';
import { normalizeParticipantResponse } from './participantTransforms';
import { getStoredSession } from './authStorage';

export const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:3000';

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 12000,
});

api.interceptors.request.use(async (config) => {
  const session = await getStoredSession();

  if (session?.token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${session.token}`;
  }

  return config;
});

function normalizePercent(value) {
  if (value === null || value === undefined) {
    return 0;
  }

  return value <= 1 ? Math.round(value * 100) : Math.round(value);
}

function normalizeRankingResponse(response) {
  const ranking = response?.ranking || response?.data || response || [];

  return {
    rule: response?.rule || response?.config || null,
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
      diversidad: normalizePercent(pesos.diversidad ?? rule.diversityWeight ?? rule.diversity),
      volumen: normalizePercent(pesos.volumen ?? rule.volumeWeight ?? rule.volume),
      practicas: normalizePercent(pesos.practicas ?? rule.practiceWeight ?? rule.practicesWeight ?? rule.practices),
      liderazgo: normalizePercent(pesos.liderazgo ?? rule.leadershipWeight ?? rule.leadership),
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

  const response = await tryRequest([
    async () => {
      if (options.mode !== 'pre') {
        throw Object.assign(new Error('skip'), { response: { status: 404 } });
      }

      return api.post('/participants/preregister', payload);
    },
    async () => {
      if (!options.cedula) {
        throw Object.assign(new Error('skip'), { response: { status: 404 } });
      }

      return api.put(`/participants/${options.cedula}`, payload);
    },
    async () => api.post('/participants', payload),
  ]);

  return normalizeParticipantResponse(response.data);
}

export async function addContributionsRequest(participantId, eventYear, contributions, options = {}) {
  const response = await api.post(`/participants/${participantId}/contributions`, {
    eventYear,
    year: eventYear,
    contributions,
    aportes: contributions,
    tipoRegistro: options.mode || 'pre',
  });

  return response.data;
}

export async function fetchRankingRequest(eventYear) {
  const response = await api.get('/ranking', {
    params: {
      eventYear,
      year: eventYear,
    },
  });

  return normalizeRankingResponse(response.data);
}

export async function fetchHistoricalContributionsRequest(eventYear) {
  const response = await api.get('/participants/contributions', {
    params: {
      eventYear,
      year: eventYear,
    },
  });

  return response.data || [];
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
