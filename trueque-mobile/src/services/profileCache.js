import AsyncStorage from '@react-native-async-storage/async-storage';

const PROFILE_CACHE_KEY = '@trueque/participant_profiles';
const RANKING_CACHE_KEY = '@trueque/ranking_data';
const HISTORY_CACHE_KEY = '@trueque/history_data';

export async function getProfileCache() {
  const raw = await AsyncStorage.getItem(PROFILE_CACHE_KEY);
  return raw ? JSON.parse(raw) : {};
}

export async function getCachedParticipantProfile(cedula) {
  const cache = await getProfileCache();
  return cache[cedula] || null;
}

export async function saveCachedParticipantProfile(profile) {
  if (!profile?.cedula) {
    return;
  }

  const cache = await getProfileCache();
  cache[profile.cedula] = profile;
  await AsyncStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(cache));
}

export async function getCachedRanking(eventYear) {
  const raw = await AsyncStorage.getItem(`${RANKING_CACHE_KEY}_${eventYear}`);
  return raw ? JSON.parse(raw) : null;
}

export async function saveCachedRanking(eventYear, rankingData) {
  await AsyncStorage.setItem(`${RANKING_CACHE_KEY}_${eventYear}`, JSON.stringify(rankingData));
}

export async function getCachedHistory(eventYear) {
  const raw = await AsyncStorage.getItem(`${HISTORY_CACHE_KEY}_${eventYear}`);
  return raw ? JSON.parse(raw) : null;
}

export async function saveCachedHistory(eventYear, historyData) {
  await AsyncStorage.setItem(`${HISTORY_CACHE_KEY}_${eventYear}`, JSON.stringify(historyData));
}
