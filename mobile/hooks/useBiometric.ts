import { useState, useEffect, useCallback } from 'react';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';

const BIOMETRIC_STORE_KEY = 'reverie_biometric_enabled';

export function useBiometric() {
  const [supported, setSupported] = useState(false);
  const [enrolled, setEnrolled] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [checking, setChecking] = useState(true);

  // Checks device hardware capabilities
  useEffect(() => {
    async function checkHardwareSupport() {
      try {
        const hasHardware = await LocalAuthentication.hasHardwareAsync();
        const isEnrolled = await LocalAuthentication.isEnrolledAsync();
        
        setSupported(hasHardware);
        setEnrolled(isEnrolled);

        if (hasHardware && isEnrolled) {
          const storedValue = await SecureStore.getItemAsync(BIOMETRIC_STORE_KEY);
          setEnabled(storedValue === 'true');
        }
      } catch (error) {
        console.warn('Biometric hardware check failed:', error);
      } finally {
        setChecking(false);
      }
    }

    checkHardwareSupport();
  }, []);

  const toggleBiometric = useCallback(async (shouldEnable: boolean) => {
    if (!supported || !enrolled) {
      throw new Error('Biometric authentication is not supported or enrolled on this device.');
    }

    if (shouldEnable) {
      // Prompt user to verify identity before locking system configuration keys
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Confirm identity to enable biometric security lock',
        fallbackLabel: 'Use passcode',
        disableDeviceFallback: false,
      });

      if (!result.success) {
        throw new Error('Authentication challenge failed.');
      }
    }

    if (shouldEnable) {
      await SecureStore.setItemAsync(BIOMETRIC_STORE_KEY, 'true');
    } else {
      await SecureStore.deleteItemAsync(BIOMETRIC_STORE_KEY);
    }
    
    setEnabled(shouldEnable);
    return true;
  }, [supported, enrolled]);

  const authenticateGate = useCallback(async (): Promise<boolean> => {
    if (!supported || !enrolled || !enabled) {
      return true; // Pass through if security parameters aren't configured
    }

    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Unlock your Reverie Repository',
        fallbackLabel: 'Use passcode',
      });
      return result.success;
    } catch {
      return false;
    }
  }, [supported, enrolled, enabled]);

  return {
    supported,
    enrolled,
    enabled,
    checking,
    toggleBiometric,
    authenticateGate,
  };
}