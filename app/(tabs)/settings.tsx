import React, { useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable,
  Switch, Alert,
} from 'react-native';
import {
  Bell, Shield, Moon, LogOut, ChevronRight, User,
  Palette, Database, HelpCircle, Star,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../services/supabase';
import * as WebBrowser from 'expo-web-browser';
import { useSettingsStore } from '../../store/useSettingsStore';
import { useThemeStore } from '../../store/useThemeStore';
import { useAppTheme } from '../../hooks/use-app-theme';
import { Colors } from '../../constants/theme';

const createStyles = (theme: typeof Colors.light | typeof Colors.dark) => {
  const isDark = theme.bg.primary === Colors.dark.bg.primary;
  
  // Base constants
  const CHR = isDark ? '#F9F7F2' : '#3D405B';
  const SAGE = theme.accent;
  const CLAY_COLOR = theme.bg.primary;
  
  const clay = {
    shadowColor: isDark ? '#000000' : '#B8ACA0',
    shadowOffset: { width: 6, height: 8 },
    shadowOpacity: isDark ? 0.6 : 0.3,
    shadowRadius: 16,
    elevation: 6,
  };

  return StyleSheet.create({
    root:   { flex: 1, backgroundColor: CLAY_COLOR },
    scroll: { paddingHorizontal: 20, paddingTop: 56, paddingBottom: 120 },

    header:      { marginBottom: 24 },
    headerTitle: { fontSize: 28, fontWeight: '900', color: CHR, letterSpacing: -0.5 },
    headerSub:   { fontSize: 12, color: `${CHR}50`, fontWeight: '600', marginTop: 2 },

    profileCard: {
      flexDirection: 'row', alignItems: 'center', gap: 14,
      backgroundColor: CLAY_COLOR, borderRadius: 24,
      padding: 18, marginBottom: 24,
      borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.5)',
      ...clay
    },
    profileAvatar: {
      width: 56, height: 56, borderRadius: 18,
      backgroundColor: `${SAGE}20`, alignItems: 'center', justifyContent: 'center',
    },
    profileName: { fontSize: 16, fontWeight: '900', color: CHR },
    profileSub:  { fontSize: 12, color: `${CHR}50`, fontWeight: '600', marginTop: 2 },

    sectionLabel: {
      fontSize: 10, fontWeight: '900', color: `${CHR}50`,
      letterSpacing: 2.5, textTransform: 'uppercase', marginBottom: 10,
    },

    settingGroup: {
      backgroundColor: CLAY_COLOR, borderRadius: 24,
      borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.5)',
      marginBottom: 20, overflow: 'hidden',
      ...clay
    },
    settingRow: {
      flexDirection: 'row', alignItems: 'center', gap: 14,
      paddingHorizontal: 16, paddingVertical: 16,
    },
    settingIconBox: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    settingLabel:   { fontSize: 15, fontWeight: '700', color: CHR },
    settingSub:     { fontSize: 11, color: `${CHR}50`, fontWeight: '500', marginTop: 2 },
    divider:        { height: 1, backgroundColor: `${CHR}08`, marginHorizontal: 16 },

    version: { textAlign: 'center', fontSize: 11, color: `${CHR}30`, fontWeight: '600', marginTop: 8 },
  });
};

const SettingItem = ({ icon: Icon, label, sub, toggle, danger, value, onToggle, onPress, theme, styles }: any) => {
  const isDark = theme.bg.primary === Colors.dark.bg.primary;
  const CHR = isDark ? '#F9F7F2' : '#3D405B';
  const SAGE = theme.accent;
  const TERRACOTTA = theme.danger;

  return (
    <Pressable style={styles.settingRow} onPress={onPress}>
      <View style={[styles.settingIconBox, { backgroundColor: danger ? `${TERRACOTTA}15` : `${SAGE}15` }]}>
        <Icon size={18} color={danger ? TERRACOTTA : SAGE} strokeWidth={2.5} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.settingLabel, danger && { color: TERRACOTTA }]}>{label}</Text>
        {sub ? <Text style={styles.settingSub}>{sub}</Text> : null}
      </View>
      {toggle
        ? <Switch
            value={value}
            onValueChange={onToggle}
            trackColor={{ false: `${CHR}20`, true: `${SAGE}80` }}
            thumbColor={value ? SAGE : '#fff'}
          />
        : <ChevronRight size={16} color={`${CHR}30`} strokeWidth={2.5} />
      }
    </Pressable>
  );
};

export default function SettingsScreen() {
  const { notifs, setNotifs, dataSync, setDataSync } = useSettingsStore();
  const { theme: themeMode, setTheme } = useThemeStore();
  const theme = useAppTheme();
  const router = useRouter();

  const styles = useMemo(() => createStyles(theme), [theme]);

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'You will lose your active session and must re-authenticate.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out', style: 'destructive',
        onPress: () => supabase.auth.signOut()
      },
    ]);
  };

  const isDarkMode = themeMode === 'dark' || 
    (themeMode === 'system' && theme.bg.primary === Colors.dark.bg.primary);

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ── HEADER ─────────────────────────────────────────────────────── */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Settings</Text>
          <Text style={styles.headerSub}>Customise your experience</Text>
        </View>

        {/* ── PROFILE CARD ───────────────────────────────────────────────── */}
        <Pressable 
          style={styles.profileCard}
          onPress={() => router.push('/edit-profile')}
        >
          <View style={styles.profileAvatar}>
            <User size={28} color={theme.accent} strokeWidth={2} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.profileName}>Your Profile</Text>
            <Text style={styles.profileSub}>View performance domains</Text>
          </View>
          <ChevronRight size={18} color={isDarkMode ? 'rgba(249, 247, 242, 0.4)' : 'rgba(61, 64, 91, 0.4)'} strokeWidth={2.5} />
        </Pressable>

        {/* ── PREFERENCES ────────────────────────────────────────────────── */}
        <Text style={styles.sectionLabel}>Preferences</Text>
        <View style={styles.settingGroup}>
          <SettingItem
            icon={Bell} label="Notifications" sub="Daily audit reminders"
            toggle value={notifs} onToggle={setNotifs}
            theme={theme} styles={styles}
          />
          <View style={styles.divider} />
          <SettingItem
            icon={Moon} label="Dark Mode" sub="High-contrast environment"
            toggle value={isDarkMode} onToggle={(v: boolean) => {
               setTheme(v ? 'dark' : 'light');
            }}
            theme={theme} styles={styles}
          />
          <View style={styles.divider} />
          <SettingItem
            icon={Palette} label="App Theme" sub="System sync available"
            onPress={() => {
              Alert.alert(
                'Theme Mode', 
                'Select your theme behaviour',
                [
                  { text: 'Light', onPress: () => setTheme('light') },
                  { text: 'Dark', onPress: () => setTheme('dark') },
                  { text: 'System Match', onPress: () => setTheme('system') },
                  { text: 'Cancel', style: 'cancel' }
                ]
              );
            }}
            theme={theme} styles={styles}
          />
        </View>

        {/* ── DATA & PRIVACY ─────────────────────────────────────────────── */}
        <Text style={styles.sectionLabel}>Data & Privacy</Text>
        <View style={styles.settingGroup}>
          <SettingItem
            icon={Database} label="Sync Data" sub="Supabase cloud sync"
            toggle value={dataSync} onToggle={setDataSync}
            theme={theme} styles={styles}
          />
          <View style={styles.divider} />
          <SettingItem
            icon={Shield} label="Privacy Policy"
            onPress={() => WebBrowser.openBrowserAsync('https://discipline-os.com/privacy')}
            theme={theme} styles={styles}
          />
        </View>

        {/* ── SUPPORT ────────────────────────────────────────────────────── */}
        <Text style={styles.sectionLabel}>Support</Text>
        <View style={styles.settingGroup}>
          <SettingItem
            icon={HelpCircle} label="Help & FAQ"
            onPress={() => WebBrowser.openBrowserAsync('https://discipline-os.com/help')}
            theme={theme} styles={styles}
          />
          <View style={styles.divider} />
          <SettingItem
            icon={Star} label="Rate Cadence"
            onPress={() => Alert.alert('Thank you!', 'Rating on App Store coming soon 🙏')}
            theme={theme} styles={styles}
          />
        </View>

        {/* ── SIGN OUT ───────────────────────────────────────────────────── */}
        <View style={styles.settingGroup}>
          <SettingItem
            icon={LogOut} label="Sign Out"
            danger onPress={handleSignOut}
            theme={theme} styles={styles}
          />
        </View>

        {/* ── VERSION ────────────────────────────────────────────────────── */}
        <Text style={styles.version}>Cadence v1.0.0</Text>

      </ScrollView>
    </View>
  );
}
