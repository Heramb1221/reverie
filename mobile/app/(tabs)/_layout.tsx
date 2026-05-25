import { Tabs, Redirect } from 'expo-router';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Fonts, MOOD_CONFIG } from '../../lib/theme';
import { useAuthStore } from '../../store/authStore';
import { useMoodStore } from '../../store/moodStore';
import { useBiometric } from '../../hooks/useBiometric';
import { useEffect } from 'react';
import { BlurView } from 'expo-blur';

// Tab icon component
function TabIcon({ label, emoji, focused, color }: {
  label: string; emoji: string; focused: boolean; color: string;
}) {
  return (
    <View style={[styles.tabItem, focused && styles.tabItemActive]}>
      <Text style={[styles.tabEmoji, focused && { transform: [{ scale: 1.1 }] }]}>{emoji}</Text>
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

  // Prompt biometric unlock
  useEffect(() => {
    if (locked) authenticate();
  }, [locked]);

  if (!isAuthenticated) return <Redirect href="/(auth)/login" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          position:        'absolute',
          bottom:          0,
          left:            0,
          right:           0,
          height:          60 + insets.bottom,
          paddingBottom:   insets.bottom,
          backgroundColor: 'transparent',
          borderTopWidth:  0,
          elevation:       0,
        },
        tabBarBackground: () => (
          <BlurView
            intensity={80}
            tint="light"
            style={StyleSheet.absoluteFill}
          />
        ),
        tabBarActiveTintColor:   moodHex,
        tabBarInactiveTintColor: Colors.textGhost,
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused, color }) => (
            <TabIcon label="Home" emoji="🏠" focused={focused} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: 'Calendar',
          tabBarIcon: ({ focused, color }) => (
            <TabIcon label="Calendar" emoji="📅" focused={focused} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="new-entry"
        options={{
          title: 'Write',
          tabBarIcon: ({ focused, color }) => (
            <View style={[styles.writeBtn, { backgroundColor: moodHex }]}>
              <Text style={styles.writeBtnText}>✍</Text>
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="reflection"
        options={{
          title: 'Reflection',
          tabBarIcon: ({ focused, color }) => (
            <TabIcon label="Reflect" emoji="✦" focused={focused} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused, color }) => (
            <TabIcon label="Profile" emoji="👤" focused={focused} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabItem: {
    alignItems: 'center',
    gap: 2,
    paddingTop: 8,
  },
  tabItemActive: {},
  tabEmoji: { fontSize: 20 },
  tabLabel: {
    fontSize: 9,
    fontFamily: Fonts.mono,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  writeBtn: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  writeBtnText: { fontSize: 22 },
});
