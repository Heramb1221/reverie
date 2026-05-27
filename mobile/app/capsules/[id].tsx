import { useLocalSearchParams, useRouter } from 'expo-router';
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { useEffect, useState } from 'react';
import { capsuleApi } from '../../lib/api';
import { Colors, Fonts, MOOD_CONFIG, MoodType } from '../../lib/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { formatDistanceToNow } from 'date-fns';

export default function CapsuleDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [capsule, setCapsule] = useState<any>(null);

  useEffect(() => {
    if (id) {
      capsuleApi.get(id)
        .then(res => {
          setCapsule(res.data.data.capsule);
          setLoading(false);
        })
        .catch(() => {
          setLoading(false);
        });
    }
  }, [id]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="small" color={Colors.textGhost} />
      </View>
    );
  }

  if (!capsule) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Memory capsule not found</Text>
      </View>
    );
  }

  const moodColor = MOOD_CONFIG[capsule.mood as MoodType]?.hex || Colors.textGhost;
  const isLocked = capsule.isLocked;

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>
        <View style={[styles.statusBadge, { backgroundColor: isLocked ? Colors.borderDark : moodColor }]}>
          <Text style={[styles.statusText, { color: isLocked ? Colors.textGhost : '#FFF' }]}>
            {isLocked ? '🔒 Locked' : '🔓 Opened'}
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollBody}>
        <Text style={styles.title}>{capsule.title}</Text>
        
        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>Unlock Date:</Text>
          <Text style={styles.metaValue}>{new Date(capsule.unlockDate).toLocaleDateString()}</Text>
        </View>

        {isLocked ? (
          <View style={styles.lockedContainer}>
            <Text style={styles.lockIcon}>⏳</Text>
            <Text style={styles.lockedTitle}>This memory capsule is sealed</Text>
            <Text style={styles.lockedSubtitle}>
              Unlocks in {formatDistanceToNow(new Date(capsule.unlockDate))}
            </Text>
          </View>
        ) : (
          <View style={styles.unlockedContent}>
            <Text style={styles.content}>{capsule.content}</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: Colors.bgLight 
  },
  center: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: Colors.bgLight 
  },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 24, 
    paddingVertical: 16 
  },
  backBtn: { 
    paddingVertical: 4 
  },
  backText: { 
    fontFamily: Fonts.mono, 
    fontSize: 14, 
    color: Colors.textGhost 
  },
  statusBadge: { 
    paddingHorizontal: 12, 
    paddingVertical: 4, 
    borderRadius: 12 
  },
  statusText: { 
    fontFamily: Fonts.mono, 
    fontSize: 11, 
    textTransform: 'uppercase' 
  },
  scrollBody: { 
    paddingHorizontal: 24, 
    paddingTop: 16 
  },
  title: { 
    fontFamily: Fonts.displayBold, 
    fontSize: 28, 
    color: Colors.textLight, 
    marginBottom: 16 
  },
  metaRow: { 
    flexDirection: 'row', 
    gap: 8, 
    marginBottom: 32, 
    borderBottomWidth: 1, 
    borderBottomColor: Colors.borderLight, 
    paddingBottom: 16 
  },
  metaLabel: { 
    fontFamily: Fonts.mono, 
    fontSize: 12, 
    color: Colors.textGhost 
  },
  metaValue: { 
    fontFamily: Fonts.mono, 
    fontSize: 12, 
    color: Colors.textLight 
  },
  lockedContainer: { 
    alignItems: 'center', 
    justifyContent: 'center', 
    paddingVertical: 64, 
    backgroundColor: '#F4F7F5', 
    borderRadius: 24, 
    borderWidth: 1, 
    borderColor: Colors.borderLight, 
    borderStyle: 'dashed' 
  },
  lockIcon: { 
    fontSize: 48, 
    marginBottom: 16 
  },
  lockedTitle: { 
    fontFamily: Fonts.displayBold, 
    fontSize: 20, 
    color: Colors.textLight, 
    marginBottom: 8 
  },
  lockedSubtitle: { 
    fontFamily: Fonts.sans,
    fontSize: 14, 
    color: Colors.textGhost 
  },
  unlockedContent: { 
    paddingTop: 8 
  },
  content: { 
    fontFamily: Fonts.sans,
    fontSize: 16, 
    color: Colors.textLight, 
    lineHeight: 26 
  },
  errorText: { 
    fontFamily: Fonts.sans,
    fontSize: 16, 
    color: Colors.textGhost 
  }
});