import { Tabs, Redirect } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { Colors, Fonts, MOOD_CONFIG } from '../../lib/theme';
import { useAuthStore } from '../../store/authStore';
import { useMoodStore } from '../../store/moodStore';
import { useBiometric } from '../../hooks/useBiometric';
import { useEffect } from 'react';

function TabIcon({ label, emoji, focused, color }: {
  label: string; emoji: string; focused: boolean; color: string;
}) {
  return (
    <View style={styles.tabItem}>
      <Text style={[styles.tabEmoji, focused && { transform: [{ scale: 1.12 }] }]}>{emoji}</Text>
      <Text style={[styles.tabLabel, { color: focused ? color : Colors.textGhost }]}>{label}</Text>
    </View>
  );
}

export default function TabsLayout() {
  const { isAuthenticated } = useAuthStore();
  const { activeMood }      = useMoodStore();
  const { locked, authenticate } = useBiometric();
  const insets = useSafeAreaInsets();
  const moodHex = MOOD_CONFIG[activeMood].hex;

  useEffect(() => { if (locked) authenticate(); }, [locked]);

  if (!isAuthenticated) return <Redirect href="/(auth)/login" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          position: 'absolute', bottom: 0, left: 0, right: 0,
          height: 58 + insets.bottom,
          paddingBottom: insets.bottom,
          backgroundColor: 'transparent',
          borderTopWidth: 0, elevation: 0,
        },
        tabBarBackground: () => (
          <BlurView intensity={80} tint="light" style={StyleSheet.absoluteFill} />
        ),
        tabBarActiveTintColor:   moodHex,
        tabBarInactiveTintColor: Colors.textGhost,
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen name="index" options={{
        tabBarIcon: ({ focused, color }) =>
          <TabIcon label="Home" emoji="🏠" focused={focused} color={color} />,
      }} />
      <Tabs.Screen name="calendar" options={{
        tabBarIcon: ({ focused, color }) =>
          <TabIcon label="Calendar" emoji="📅" focused={focused} color={color} />,
      }} />
      <Tabs.Screen name="new-entry" options={{
        tabBarIcon: ({ focused }) => (
          <View style={[styles.writeBtn, { backgroundColor: moodHex }]}>
            <Text style={styles.writeBtnText}>✍</Text>
          </View>
        ),
      }} />
      <Tabs.Screen name="reflection" options={{
        tabBarIcon: ({ focused, color }) =>
          <TabIcon label="Reflect" emoji="✦" focused={focused} color={color} />,
      }} />
      <Tabs.Screen name="profile" options={{
        tabBarIcon: ({ focused, color }) =>
          <TabIcon label="Profile" emoji="👤" focused={focused} color={color} />,
      }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabItem:      { alignItems: 'center', gap: 2, paddingTop: 8 },
  tabEmoji:     { fontSize: 20 },
  tabLabel:     { fontFamily: Fonts.mono, fontSize: 8, letterSpacing: 0.5, textTransform: 'uppercase' },
  writeBtn:     { width: 50, height: 50, borderRadius: 15, alignItems: 'center', justifyContent: 'center', marginBottom: 6,
                  shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 8 },
  writeBtnText: { fontSize: 22 },
});
