import { Platform } from 'react-native';

export const colors = {
  primary: '#2D6A4F',
  primaryLight: '#40916C',
  primarySurface: '#D8F3DC',
  accent: '#D9730D',
  accentLight: '#F4A261',
  text: '#1A2E1F',
  mutedText: '#5A7060',
  lightText: '#8FA693',
  border: '#D6E4DA',
  background: '#FFFFFF',
  surface: '#F9F5EF',
  surfaceWarm: '#FEF9F0',
  success: '#2D6A4F',
  warningBackground: '#FEF3E2',
  warningText: '#92400E',
  chipBackground: '#D8F3DC',
  shadow: '#0A1F10',
  error: '#C0392B',
  // Ranking podio
  gold: '#F4A261',
  silver: '#95D5B2',
  bronze: '#D4A373',
  // Compatibilidad
  secondaryBlue: '#40916C',
  orange: '#D9730D',
  blueLight: '#D8F3DC',
};

export const fonts = {
  regular: Platform.select({ ios: 'Inter_400Regular', android: 'Inter_400Regular', default: 'Inter_400Regular' }),
  medium: Platform.select({ ios: 'Inter_500Medium', android: 'Inter_500Medium', default: 'Inter_500Medium' }),
  semibold: Platform.select({ ios: 'Inter_600SemiBold', android: 'Inter_600SemiBold', default: 'Inter_600SemiBold' }),
  bold: Platform.select({ ios: 'Inter_700Bold', android: 'Inter_700Bold', default: 'Inter_700Bold' }),
};

export const spacing = {
  xs: 6,
  sm: 10,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
};

export const shadow = {
  shadowColor: colors.shadow,
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.08,
  shadowRadius: 10,
  elevation: 3,
};
