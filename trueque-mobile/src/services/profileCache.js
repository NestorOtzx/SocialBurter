import AsyncStorage from '@react-native-async-storage/async-storage';

const PROFILE_CACHE_KEY = '@trueque/participant_profiles';

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
