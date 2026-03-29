import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export function useThemeColor(
  props: { light?: string; dark?: string },
  colorName: string
) {
  const theme = useColorScheme() ?? 'dark';
  const colorFromProps = props[theme];

  if (colorFromProps) {
    return colorFromProps;
  } else {
    const themeColors = Colors[theme];
    if (colorName === 'text') return themeColors.text.primary;
    if (colorName === 'background') return themeColors.bg.primary;
    if (colorName === 'tint') return themeColors.accent;
    if (colorName === 'icon') return themeColors.text.secondary;
    if (colorName === 'tabIconDefault') return themeColors.text.tertiary;
    if (colorName === 'tabIconSelected') return themeColors.accent;
    
    return (themeColors as any)[colorName] as string;
  }
}
