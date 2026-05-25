import { Dimensions } from 'react-native';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

// ── COLOURS ──
export const Colors = {
  // Surfaces
  surface:         '#F4F2EE',
  surfaceElevated: '#FFFFFF',
  surfaceSunken:   '#EAE8E3',
  surfaceDark:     '#0F1210',
  surfaceDarkEl:   '#161A16',

  // Text
  textPrimary:   '#1C1C1A',
  textSecondary: '#3A3A36',
  textMuted:     '#7A7A74',
  textGhost:     '#B0AEA8',

  // Text dark
  textPrimaryDark:   '#F0EDE8',
  textSecondaryDark: '#C8C5C0',
  textMutedDark:     '#7A7A74',

  // Brand
  sage:      '#7B9E87',
  sageLight: '#A8C2B0',
  sageDark:  '#4A6B55',
  warm:      '#C4956A',
  teal:      '#3D6B7A',

  // Borders
  border:     'rgba(0,0,0,0.07)',
  borderDark: 'rgba(255,255,255,0.07)',

  // Mood
  mood: {
    calm: {
      bg:     'rgba(123,158,135,0.10)',
      text:   '#4A6B55',
      border: 'rgba(123,158,135,0.30)',
      hex:    '#7B9E87',
    },
    reflective: {
      bg:     'rgba(107,124,110,0.10)',
      text:   '#445548',
      border: 'rgba(107,124,110,0.30)',
      hex:    '#6B7C6E',
    },
    hopeful: {
      bg:     'rgba(196,149,106,0.10)',
      text:   '#7A5A35',
      border: 'rgba(196,149,106,0.30)',
      hex:    '#C4956A',
    },
    overwhelmed: {
      bg:     'rgba(61,107,122,0.10)',
      text:   '#2D4B5A',
      border: 'rgba(61,107,122,0.30)',
      hex:    '#3D6B7A',
    },
  },
} as const;

// ── TYPOGRAPHY ──
export const Fonts = {
  display: 'serif',
  displayMedium: 'serif',
  displayItalic: 'serif',

  sans: 'System',
  sansMedium: 'System',
  sansLight: 'System',

  mono: 'monospace',
  monoRegular: 'monospace',
} as const;

export const FontSizes = {
  xs:   10,
  sm:   12,
  base: 14,
  md:   16,
  lg:   18,
  xl:   22,
  '2xl': 28,
  '3xl': 36,
} as const;

// ── SPACING ──
export const Space = {
  1: 4,  2: 8,  3: 12, 4: 16,
  5: 20, 6: 24, 8: 32, 10: 40,
  12: 48, 16: 64,
} as const;

// ── RADIUS ──
export const Radius = {
  sm: 8, md: 12, lg: 16,
  xl: 20, '2xl': 24, full: 9999,
} as const;

// ── SCREEN ──
export const Screen = { W: SCREEN_W, H: SCREEN_H } as const;

// ── MOOD CONFIG ──
export type MoodType = 'calm' | 'reflective' | 'hopeful' | 'overwhelmed';

export const MOOD_CONFIG: Record<MoodType, {
  label: string; emoji: string; description: string;
  hex: string; bg: string; text: string; border: string;
}> = {
  calm:        { label: 'Calm',        emoji: '🌿', description: 'Still and peaceful',  ...Colors.mood.calm },
  reflective:  { label: 'Reflective',  emoji: '🌧',  description: 'Turning inward',      ...Colors.mood.reflective },
  hopeful:     { label: 'Hopeful',     emoji: '🌅', description: 'Light ahead',          ...Colors.mood.hopeful },
  overwhelmed: { label: 'Overwhelmed', emoji: '🌊', description: 'A lot at once',        ...Colors.mood.overwhelmed },
};
