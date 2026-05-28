import { useEffect, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Network from 'expo-network';
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
    try {
      const raw   = await AsyncStorage.getItem(QUEUE_KEY);
      const queue: QueuedEntry[] = raw ? (JSON.parse(raw) as QueuedEntry[]) : [];
      queue.push({ ...item, id: Date.now().toString(), timestamp: Date.now() });
      await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
    } catch (e) {
      console.warn('[OfflineSync] enqueue error:', e);
    }
  }, []);

  const flush = useCallback(async () => {
    if (isSyncing.current) return;
    isSyncing.current = true;
    try {
      const raw = await AsyncStorage.getItem(QUEUE_KEY);
      if (!raw) return;
      const queue = JSON.parse(raw) as QueuedEntry[];
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
          remaining.push(item);
        }
      }
      await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(remaining));
    } finally {
      isSyncing.current = false;
    }
  }, []);

  // Poll network state using expo-network (replaces @react-native-community/netinfo)
  useEffect(() => {
    let mounted = true;
    const checkAndFlush = async () => {
      if (!mounted) return;
      const state = await Network.getNetworkStateAsync();
      if (state.isConnected && state.isInternetReachable) {
        await flush();
      }
    };
    // Check on mount and every 30s
    checkAndFlush();
    const interval = setInterval(checkAndFlush, 30000);
    return () => { mounted = false; clearInterval(interval); };
  }, [flush]);

  return { enqueue, flush };
}
