import { Platform } from 'react-native';

export const colors = {
  primary: '#2596be',
  secondaryBlue: '#3B82F6',
  orange: '#F97316',
  text: '#333333',
  mutedText: '#666666',
  lightText: '#888888',
  border: '#E0E0E0',
  background: '#FFFFFF',
  surface: '#F8FAFC',
  success: '#16A34A',
  warningBackground: '#FFF3CD',
  warningText: '#856404',
  chipBackground: '#F1F5F9',
  blueLight: '#E0F2FE',
  shadow: '#0F172A',
  error: '#DC2626',
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
