import { useEffect, useState, useCallback } from 'react';
import { Platform } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import { storage } from '../lib/storage';

const LOCK_KEY = 'biometric_lock_enabled';

export function useBiometric() {
  const [supported, setSupported] =
    useState(false);

  const [enrolled, setEnrolled] =
    useState(false);

  const [enabled, setEnabled] =
    useState(false);

  const [locked, setLocked] =
    useState(false);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        // Web does not support biometrics
        if (Platform.OS === 'web') {
          if (!mounted) return;

          setSupported(false);
          setEnrolled(false);
          setEnabled(false);
          setLocked(false);

          return;
        }

        const hw =
          await LocalAuthentication.hasHardwareAsync();

        const enr =
          await LocalAuthentication.isEnrolledAsync();

        const raw =
          await storage.getItem(LOCK_KEY);

        if (!mounted) return;

        setSupported(hw);
        setEnrolled(enr);
        setEnabled(raw === 'true');

        if (
          raw === 'true' &&
          hw &&
          enr
        ) {
          setLocked(true);
        }
      } catch (error) {
        console.log(
          'BIOMETRIC INIT ERROR:',
          error
        );
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const authenticate =
    useCallback(async (): Promise<boolean> => {
      try {
        // Skip biometrics on web
        if (Platform.OS === 'web') {
          return true;
        }

        if (!supported || !enrolled) {
          return true;
        }

        const result =
          await LocalAuthentication.authenticateAsync({
            promptMessage:
              'Unlock Reverie',

            fallbackLabel:
              'Use passcode',

            cancelLabel:
              'Cancel',

            disableDeviceFallback: false,
          });

        if (result.success) {
          setLocked(false);
        }

        return result.success;
      } catch (error) {
        console.log(
          'BIOMETRIC AUTH ERROR:',
          error
        );

        return false;
      }
    }, [supported, enrolled]);

  const toggleBiometric =
    useCallback(
      async (
        value: boolean
      ): Promise<void> => {
        try {
          // Disable entirely on web
          if (Platform.OS === 'web') {
            return;
          }

          if (value) {
            const ok =
              await authenticate();

            if (!ok) return;
          }

          await storage.setItem(
            LOCK_KEY,
            String(value)
          );

          setEnabled(value);
        } catch (error) {
          console.log(
            'TOGGLE BIOMETRIC ERROR:',
            error
          );
        }
      },
      [authenticate]
    );

  return {
    supported,
    enrolled,
    enabled,
    locked,
    authenticate,
    toggleBiometric,
  };
}