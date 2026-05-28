import { useEffect, useState, useCallback } from 'react';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';

const LOCK_KEY = 'biometric_lock_enabled';

export function useBiometric() {
  const [supported, setSupported] = useState(false);
  const [enrolled,  setEnrolled]  = useState(false);
  const [enabled,   setEnabled]   = useState(false);
  const [locked,    setLocked]    = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const hw  = await LocalAuthentication.hasHardwareAsync();
      const enr = await LocalAuthentication.isEnrolledAsync();
      const raw = await SecureStore.getItemAsync(LOCK_KEY);
      if (!mounted) return;
      setSupported(hw);
      setEnrolled(enr);
      setEnabled(raw === 'true');
      if (raw === 'true' && hw && enr) setLocked(true);
    })();
    return () => { mounted = false; };
  }, []);

  const authenticate = useCallback(async (): Promise<boolean> => {
    if (!supported || !enrolled) return true;
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage:         'Unlock Reverie',
      fallbackLabel:         'Use passcode',
      cancelLabel:           'Cancel',
      disableDeviceFallback: false,
    });
    if (result.success) setLocked(false);
    return result.success;
  }, [supported, enrolled]);

  const toggleBiometric = useCallback(async (value: boolean): Promise<void> => {
    if (value) {
      const ok = await authenticate();
      if (!ok) return;
    }
    await SecureStore.setItemAsync(LOCK_KEY, String(value));
    setEnabled(value);
  }, [authenticate]);

  return { supported, enrolled, enabled, locked, authenticate, toggleBiometric };
}
