import { Dimensions, ViewStyle } from 'react-native';

const { width, height } = Dimensions.get('window');

// 3D Tactile / Neumorphic / Claymorphic Aesthetic
// Soft, deep colors, large border radii, distinct directional lighting using borders and shadows.

const lightTheme = {
  bg: {
    primary: '#F9F7F2',
    surface: '#FDFCF9',
    card:    '#F9F7F2',
    card2:   '#F0EFE9', 
  },
  accent:      '#3D405B', 
  accentDim:   'rgba(61, 64, 91, 0.1)',
  accentBorder:'#6B9FFF',
  body:    '#E07A5F',
  mind:    '#81B29A',
  work:    '#F2CC8F',
  danger:  '#E07A5F', 
  success: '#81B29A',
  secondary: '#81B29A', // Sage explicitly appended
  text: {
    primary:   '#3D405B',
    secondary: '#8F93A3',
    tertiary:  '#A3A7BA', 
    accent:    '#3D405B',
  },
  borderLight: 'rgba(255, 255, 255, 0.8)', 
  borderDark:  'rgba(61, 64, 91, 0.15)', 
  border:      'rgba(61, 64, 91, 0.1)', 
} as const;

const darkTheme = {
  bg: {
    primary: '#1A1A1E', // Deep charcoal-purple
    surface: '#25252B', // Slightly lighter elevated
    card:    '#212126', // Card background
    card2:   '#2A2A30', 
  },
  accent:      '#81B29A', // Sage becomes the dark mode primary contrast
  accentDim:   'rgba(129, 178, 154, 0.15)',
  accentBorder:'#6B9FFF',
  body:    '#E07A5F', // Muted terracotta
  mind:    '#81B29A', 
  work:    '#F2CC8F', 
  danger:  '#E07A5F', 
  success: '#81B29A',
  secondary: '#E07A5F', // Terracotta explicitly appended
  text: {
    primary:   '#F9F7F2', // Off-white for readability
    secondary: '#A3A7BA',
    tertiary:  '#6D7185', 
    accent:    '#81B29A',
  },
  borderLight: 'rgba(255, 255, 255, 0.05)', 
  borderDark:  'rgba(0, 0, 0, 0.4)', 
  border:      'rgba(255, 255, 255, 0.08)', 
} as const;

export const Colors = {
  light: lightTheme,
  dark: darkTheme,
  ...lightTheme // Flat fallbacks for un-migrated components to prevent TS errors
};

// ── Spacing
export const Spacing = {
  xs: 6,
  sm: 12,
  md: 20,
  lg: 28,
  xl: 40,
  xxl: 60,
} as const;

// ── Typography System
const Inter = 'System'; 

export const Typography = {
  h1: {
    fontFamily: Inter,
    fontSize: 40,
    fontWeight: '900' as const,
    letterSpacing: -0.5,
  },
  h2: {
    fontFamily: Inter,
    fontSize: 26,
    fontWeight: '800' as const,
    letterSpacing: -0.2,
  },
  h3: {
    fontFamily: Inter,
    fontSize: 18,
    fontWeight: '700' as const,
  },
  bodyBold: {
    fontFamily: Inter,
    fontSize: 15,
    fontWeight: '700' as const,
  },
  body: {
    fontFamily: Inter,
    fontSize: 15,
    fontWeight: '500' as const,
    lineHeight: 22,
  },
  caption: {
    fontFamily: Inter,
    fontSize: 13,
    fontWeight: '700' as const,
    color: Colors.light.text.secondary,
  },
  label: {
    fontFamily: Inter,
    fontSize: 11,
    fontWeight: '800' as const,
    letterSpacing: 1,
    textTransform: 'uppercase' as const,
  },
  tabLabel: {
    fontFamily: Inter,
    fontSize: 10,
    fontWeight: '700' as const,
  },
};

// ── Shared Border Radii (Massive, blobby, clay-like)
export const Radius = {
  sm: 16,
  md: 24,
  lg: 32,
  xl: 40,
  full: 9999,
};

// ── 3D Elevation Styles (Reusable Drop Shadows)
export const Elevation = {
  soft: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 8,
  } as ViewStyle,
  floating: {
    shadowColor: '#3D405B',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.15,
    shadowRadius: 32,
    elevation: 16,
  } as ViewStyle,
};

// ── Legacy 3D block style (to be replaced by NativeWind classes, kept for build compatibility during refactor)
export const create3DCardStyle = (): ViewStyle => ({
  backgroundColor: Colors.light.bg.surface,
  borderRadius: Radius.lg,
});

export const CategoryConfig = {
  BODY: { color: Colors.light.body, label: 'BODY', dim: 'rgba(255, 79, 121, 0.15)' },
  MIND: { color: Colors.light.mind, label: 'MIND', dim: 'rgba(0, 212, 255, 0.15)' },
  WORK: { color: Colors.light.work, label: 'WORK', dim: 'rgba(255, 200, 0, 0.15)' },
};
