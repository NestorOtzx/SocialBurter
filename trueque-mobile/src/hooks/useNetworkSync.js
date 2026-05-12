import { useEffect, useCallback, useRef } from 'react';
import { AppState } from 'react-native';
import * as Network from 'expo-network';
import { 
  getPendingParticipants, 
  getPendingContributions, 
  markParticipantSynced, 
  markContributionsSynced, 
  clearSyncedData 
} from '../services/localDb';
import { api, API_BASE_URL } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { useNetworkStore } from '../store/networkStore';

export const useNetworkSync = () => {
  const isOffline = useNetworkStore(state => state.isOffline);
  const setIsOffline = useNetworkStore(state => state.setOffline);
  const isSyncing = useNetworkStore(state => state.isSyncing);
  const setIsSyncing = useNetworkStore(state => state.setSyncing);
  const token = useAuthStore(state => state.token);

  // Sync function
  const syncData = useCallback(async () => {
    if (isSyncing || isOffline || token === 'OFFLINE_MODE') return;
    setIsSyncing(true);

    try {
      // 1. Sync Participants
      const pendingParticipants = await getPendingParticipants();
      for (const p of pendingParticipants) {
        try {
          const payload = JSON.parse(p.payload_json);
          // Post to backend
          await api.post('/participants', payload);
          await markParticipantSynced(p.id);
        } catch (error) {
          console.error(`Error syncing participant ${p.cedula}:`, error);
        }
      }

      // 2. Sync Contributions
      const pendingContributions = await getPendingContributions();
      for (const c of pendingContributions) {
        try {
          const payload = JSON.parse(c.payload_json);
          // First, get the actual backend ID for this cedula
          const resParticipant = await api.get('/participants/by-cedula', {
            params: { cedula: c.cedula }
          });
          
          if (resParticipant.data && resParticipant.data.id) {
            const participantId = resParticipant.data.id;
            // Now add contributions
            await api.post(`/participants/${participantId}/contributions`, {
              ...payload, // contains eventYear, contributions, tipoRegistro
              year: payload.eventYear,
              aportes: payload.contributions,
            });
            await markContributionsSynced(c.id);
          } else {
            console.error(`Participant with cedula ${c.cedula} not found on backend. Cannot sync contributions.`);
          }
        } catch (error) {
          console.error(`Error syncing contributions for ${c.cedula}:`, error);
        }
      }

      // 3. Cleanup
      await clearSyncedData();

    } catch (error) {
      console.error('Error in syncData:', error);
    } finally {
      setIsSyncing(false);
    }
  }, [isOffline, isSyncing]);

  const syncDataRef = useRef(syncData);
  useEffect(() => {
    syncDataRef.current = syncData;
  }, [syncData]);

  // Trigger sync automatically when the user successfully logs in after being offline
  useEffect(() => {
    if (token && token !== 'OFFLINE_MODE' && !isOffline) {
      syncDataRef.current();
    }
  }, [token, isOffline]);

  // Trigger sync when app comes to foreground
  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (nextAppState === 'active' && !useNetworkStore.getState().isOffline) {
        const currentToken = useAuthStore.getState().token;
        if (currentToken && currentToken !== 'OFFLINE_MODE') {
          syncDataRef.current();
        }
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    let isMounted = true;
    let intervalId;

    const checkNetwork = async () => {
      try {
        const state = await Network.getNetworkStateAsync();
        if (!isMounted) return;
        
        const offline = !state.isConnected;
        
        if (isMounted) {
          const wasOffline = useNetworkStore.getState().isOffline;
          if (wasOffline !== offline) {
            setIsOffline(offline);
            if (!offline) {
              syncDataRef.current();
            }
          }
        }
      } catch (error) {
        console.error("Error checking network state", error);
      }
    };

    checkNetwork();
    intervalId = setInterval(checkNetwork, 5000);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, []);

  return { isOffline, isSyncing, syncData, isOfflineMode: token === 'OFFLINE_MODE' };
};
