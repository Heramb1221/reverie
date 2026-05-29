import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import * as SplashScreen from 'expo-splash-screen';
import {
  useFonts,
  PlayfairDisplay_400Regular,
  PlayfairDisplay_500Medium,
  PlayfairDisplay_400Regular_Italic,
} from '@expo-google-fonts/playfair-display';
import {
  DMSans_400Regular,
  DMSans_500Medium,
} from '@expo-google-fonts/dm-sans';
import {
  DMMono_300Light,
  DMMono_400Regular,
} from '@expo-google-fonts/dm-mono';
import { useAuthStore } from '../store/authStore';

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime:            1000 * 60 * 2,
      retry:                1,
      refetchOnWindowFocus: false,
    },
  },
});

export default function RootLayout() {
  const { hydrate, hydrated } = useAuthStore();

  const [fontsLoaded] = useFonts({
    PlayfairDisplay_400Regular,
    PlayfairDisplay_500Medium,
    PlayfairDisplay_400Regular_Italic,
    DMSans_400Regular,
    DMSans_500Medium,
    DMMono_300Light,
    DMMono_400Regular,
  });

  useEffect(() => { hydrate(); }, []);

  useEffect(() => {
    if (fontsLoaded && hydrated) SplashScreen.hideAsync();
  }, [fontsLoaded, hydrated]);

  if (!fontsLoaded || !hydrated) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="journal/[id]"  options={{ animation: 'slide_from_bottom' }} />
            <Stack.Screen name="journal/new"   options={{ animation: 'slide_from_bottom' }} />
            <Stack.Screen name="capsules/[id]" />
            <Stack.Screen name="search"        options={{ animation: 'slide_from_bottom' }} />
            <Stack.Screen name="settings"      options={{ animation: 'slide_from_bottom' }} />
          </Stack>
          <StatusBar style="auto" />
          <Toast />
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
