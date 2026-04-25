import { create } from 'zustand';
import { clearStoredSession, getStoredSession, saveStoredSession } from '../services/authStorage';

export const useAuthStore = create((set) => ({
  token: null,
  user: null,
  isBootstrapping: true,
  hydrateSession: async () => {
    try {
      const session = await getStoredSession();
      set({
        token: session?.token || null,
        user: session?.user || null,
        isBootstrapping: false,
      });
    } catch (error) {
      set({ token: null, user: null, isBootstrapping: false });
    }
  },
  signIn: async (session) => {
    await saveStoredSession(session);
    set({
      token: session.token,
      user: session.user,
      isBootstrapping: false,
    });
  },
  signOut: async () => {
    await clearStoredSession();
    set({ token: null, user: null, isBootstrapping: false });
  },
}));
