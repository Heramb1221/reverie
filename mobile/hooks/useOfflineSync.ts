import { useEffect, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { journalApi } from '../lib/api';

const QUEUE_KEY = 'reverie_offline_queue';

interface QueuedEntry {
  id:        string;
  type:      'create' | 'update' | 'delete';
  payload:   object;
  timestamp: number;
}

export function useOfflineSync() {
  const isSyncing = useRef(false);

  const enqueue = useCallback(async (item: Omit<QueuedEntry, 'id' | 'timestamp'>) => {
    const raw   = await AsyncStorage.getItem(QUEUE_KEY);
    const queue: QueuedEntry[] = raw ? JSON.parse(raw) : [];
    queue.push({ ...item, id: Date.now().toString(), timestamp: Date.now() });
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  }, []);

  const flush = useCallback(async () => {
    if (isSyncing.current) return;
    isSyncing.current = true;

    try {
      const raw = await AsyncStorage.getItem(QUEUE_KEY);
      if (!raw) return;
      const queue: QueuedEntry[] = JSON.parse(raw);
      if (!queue.length) return;

      const remaining: QueuedEntry[] = [];

      for (const item of queue) {
        try {
          if (item.type === 'create') {
            await journalApi.create(item.payload);
          } else if (item.type === 'update') {
            const { id, ...rest } = item.payload as { id: string };
            await journalApi.update(id, rest);
          } else if (item.type === 'delete') {
            const { id } = item.payload as { id: string };
            await journalApi.delete(id);
          }
        } catch {
          // Keep failed items in queue
          remaining.push(item);
        }
      }

      await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(remaining));
    } finally {
      isSyncing.current = false;
    }
  }, []);

  // Flush when network comes back online
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      if (state.isConnected) flush();
    });
    return unsubscribe;
  }, [flush]);

  return { enqueue, flush };
}
