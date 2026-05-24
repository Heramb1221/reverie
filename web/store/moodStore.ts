import { create } from 'zustand';

export type MoodType = 'calm' | 'reflective' | 'hopeful' | 'overwhelmed';

export interface MoodConfig {
  label: string;
  color: string;
  colorHex: string;
  gradient: string;
  description: string;
  atmosphere: string;
  overlayLight: string;
  overlayDark: string;
}

export const MOOD_CONFIG: Record<MoodType, MoodConfig> = {
  calm: {
    label: 'Calm',
    color: 'sage',
    colorHex: '#7B9E87',
    gradient: 'linear-gradient(135deg, rgba(123,158,135,0.15) 0%, rgba(74,107,85,0.05) 100%)',
    description: 'Still and peaceful',
    atmosphere: 'Foggy forest',
    overlayLight: 'rgba(244,248,245,0.85)',
    overlayDark:  'rgba(10,16,12,0.88)',
  },
  reflective: {
    label: 'Reflective',
    color: 'stone',
    colorHex: '#6B7C6E',
    gradient: 'linear-gradient(135deg, rgba(107,124,110,0.15) 0%, rgba(50,65,55,0.05) 100%)',
    description: 'Turning inward',
    atmosphere: 'Rainy window',
    overlayLight: 'rgba(242,244,242,0.85)',
    overlayDark:  'rgba(10,13,11,0.88)',
  },
  hopeful: {
    label: 'Hopeful',
    color: 'warm',
    colorHex: '#C4956A',
    gradient: 'linear-gradient(135deg, rgba(196,149,106,0.15) 0%, rgba(150,100,60,0.05) 100%)',
    description: 'Light ahead',
    atmosphere: 'Warm sunrise',
    overlayLight: 'rgba(250,247,242,0.85)',
    overlayDark:  'rgba(16,13,10,0.88)',
  },
  overwhelmed: {
    label: 'Overwhelmed',
    color: 'teal',
    colorHex: '#3D6B7A',
    gradient: 'linear-gradient(135deg, rgba(61,107,122,0.15) 0%, rgba(30,70,85,0.05) 100%)',
    description: 'A lot at once',
    atmosphere: 'Misty depths',
    overlayLight: 'rgba(240,244,246,0.85)',
    overlayDark:  'rgba(8,12,15,0.88)',
  },
};

interface MoodState {
  activeMood: MoodType;
  isTransitioning: boolean;
  setMood: (mood: MoodType) => void;
  setTransitioning: (v: boolean) => void;
}

export const useMoodStore = create<MoodState>()((set) => ({
  activeMood: 'calm',
  isTransitioning: false,
  setMood: (mood) => set({ activeMood: mood }),
  setTransitioning: (v) => set({ isTransitioning: v }),
}));
