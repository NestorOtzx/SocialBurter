import { useEffect, useState, useCallback } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { 
  getPendingParticipants, 
  getPendingContributions, 
  markParticipantSynced, 
  markContributionsSynced, 
  clearSyncedData 
} from '../services/localDb';
import { api, API_BASE_URL } from '../services/api';

export const useNetworkSync = () => {
  const [isOffline, setIsOffline] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Sync function
  const syncData = useCallback(async () => {
    if (isSyncing || isOffline) return;
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

  useEffect(() => {
    // Check initial status
    NetInfo.fetch().then(state => {
      setIsOffline(!state.isConnected);
    });

    // Subscribe to changes
    const unsubscribe = NetInfo.addEventListener(state => {
      const offline = !state.isConnected;
      setIsOffline(offline);
      
      // If we just came online, trigger sync
      if (!offline) {
        syncData();
      }
    });

    return () => unsubscribe();
  }, [syncData]);

  return { isOffline, isSyncing, syncData };
};
