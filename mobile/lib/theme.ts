export const Colors = {
  bgLight: '#FDFBF7',
  bgDark: '#121614',
  textLight: '#1C2421',
  textDark: '#EBF1EE',
  textGhost: '#8A9A93',
  borderLight: '#E2EAE6',
  borderDark: '#232E29',
  surface: '#FDFBF7',
  surfaceElevated: '#FFFFFF',
  surfaceSunken: '#F5F7F6',
  textPrimary: '#1C2421',
  textMuted: '#62756E',
  textSecondary: '#62756E',
  border: '#E2EAE6',
  sageDark: '#4A6257',
};

export const Fonts = {
  display: 'Playfair-Regular',
  displayMedium: 'Playfair-Medium',
  displayBold: 'Playfair-Bold',
  displayItalic: 'Playfair-Italic',
  sans: 'DMSans-Regular',
  sansLight: 'DMSans-Light',
  sansMedium: 'DMSans-Medium',
  mono: 'DMMono-Regular',
};

export const FontSizes = {
  xs: 12,
  sm: 14,
  base: 16,
  md: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
};

export const Space = {
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
};

export const Radius = {
  md: 8,
  lg: 12,
  xl: 14,
  '2xl': 16,
  full: 9999,
};

export const MOOD_CONFIG = {
  Calm: {
    hex: '#7B9E87',
    label: 'Calm',
    atmosphere: 'Foggy forest',
    emoji: '🌲',
  },
  Reflective: {
    hex: '#6B7C6E',
    label: 'Reflective',
    atmosphere: 'Rainy window',
    emoji: '🌧️',
  },
  Hopeful: {
    hex: '#C4956A',
    label: 'Hopeful',
    atmosphere: 'Sunrise light',
    emoji: '🌅',
  },
  Overwhelmed: {
    hex: '#3D6B7A',
    label: 'Overwhelmed',
    atmosphere: 'Misty depths',
    emoji: '🌊',
  },
} as const;

export type MoodType = keyof typeof MOOD_CONFIG;