import { create } from 'zustand';
import { MoodType } from '../lib/theme';

interface MoodState {
  activeMood: MoodType;
  setMood: (m: MoodType) => void;
}

export const useMoodStore = create<MoodState>()((set) => ({
  activeMood: 'calm',
  setMood: (m) => set({ activeMood: m }),
}));
