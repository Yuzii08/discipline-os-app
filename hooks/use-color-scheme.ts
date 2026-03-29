import { useColorScheme as useNativeColorScheme } from 'react-native';
import { useThemeStore } from '@/store/useThemeStore';

export function useColorScheme(): 'light' | 'dark' {
  const nativeTheme = useNativeColorScheme();
  const themePreference = useThemeStore((state) => state.theme);

  if (themePreference === 'system') {
    return nativeTheme ?? 'dark';
  }
  
  return themePreference;
}
