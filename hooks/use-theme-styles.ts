import React from 'react';
import { useAppTheme } from './use-app-theme';
import { Colors } from '../constants/theme';

export function useThemeStyles(createStyles?: (tokens: any, clay?: any) => any) {
  const theme = useAppTheme();
  
  const tokens = React.useMemo(() => {
    const isDark = theme.bg?.primary === Colors.dark.bg.primary;
    return {
      BG: theme.bg.primary,
      CHR: isDark ? '#F9F7F2' : '#3D405B',
      SAGE: theme.accent,
      TERR: theme.danger,
      MUST: theme.work,
      EGSHELL: isDark ? theme.bg.surface : '#F9F7F2',
      isDark,
      theme
    };
  }, [theme]);

  const clay = React.useMemo(() => {
    const { isDark, EGSHELL, TERR, SAGE } = tokens;
    return {
      clayCard: {
        backgroundColor: EGSHELL,
        shadowColor: isDark ? '#000' : '#B8ACA0',
        shadowOffset: { width: 6, height: 8 },
        shadowOpacity: isDark ? 0.6 : 0.28,
        shadowRadius: 16,
        elevation: 6,
        borderWidth: 1,
        borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(230,225,215,0.4)',
      }
    };
  }, [tokens]);

  const styles = React.useMemo(() => {
    if (!createStyles) return {};
    return createStyles(tokens, clay);
  }, [tokens, clay, createStyles]);

  return { tokens, styles, clay };
}
