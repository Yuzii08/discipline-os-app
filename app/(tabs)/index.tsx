import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, ScrollView, Pressable, StyleSheet,
  RefreshControl, Platform, Image,
  StatusBar, Animated, Modal, TextInput, KeyboardAvoidingView, Alert,
} from 'react-native';
import Reanimated, { useAnimatedStyle, useSharedValue, withTiming, Easing, withRepeat, SharedValue } from 'react-native-reanimated';
import { MissionItem } from '../../components/MissionItem';

import { useUserStore } from '../../store/useUserStore';
import { useMissionStore } from '../../store/useMissionStore';
import { fetchTodayMissions } from '../../services/missionService';
import { supabase } from '../../services/supabase';
import { useRouter } from 'expo-router';
import { GlobalDrawerContext } from './_layout';
import { useFocusEffect } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import {
  Dumbbell, Brain, Briefcase, ChevronRight, Zap,
  Target, CheckCircle, Timer, Flame, Plus, X, Sparkles, Shield,
} from 'lucide-react-native';

import { useAppTheme } from '../../hooks/use-app-theme';
import { Colors } from '../../constants/theme';
import { useColorScheme } from '../../hooks/use-color-scheme';
import { Shadow } from 'react-native-shadow-2';


const getThemeTokens = (theme: any) => {
  const isDark = theme.bg?.primary === Colors.dark.bg.primary;
  const BG = theme.bg.primary;
  const CHR = isDark ? '#F9F7F2' : '#3D405B';
  const SAGE = theme.accent;
  const TERR = theme.danger;
  const MUST = theme.work;
  const EGSHELL = isDark ? theme.bg.surface : '#F9F7F2';
  return { BG, CHR, SAGE, TERR, MUST, EGSHELL, isDark, theme };
};

const getClayStyles = (tokens: any) => {
  const { isDark, EGSHELL, TERR, SAGE } = tokens;
  return {
    clayCard: {
      backgroundColor: EGSHELL,
      shadowColor: isDark ? '#000' : '#B8B2A5',
      shadowOffset: { width: 8, height: 8 },
      shadowOpacity: isDark ? 0.6 : 0.4,
      shadowRadius: 16,
      elevation: 8,
      borderWidth: 1,
      borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(230,225,215,0.5)',
    },
    clayRaised: {
      backgroundColor: EGSHELL,
      shadowColor: isDark ? '#000' : '#B8B2A5',
      shadowOffset: { width: 4, height: 4 },
      shadowOpacity: isDark ? 0.5 : 0.3,
      shadowRadius: 10,
      elevation: 5,
    },
    clayInset: {
      backgroundColor: TERR,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.12,
      shadowRadius: 4,
      elevation: 0,
    },
    clayStamp: {
      backgroundColor: SAGE,
      shadowColor: `${SAGE}90`,
      shadowOffset: { width: 6, height: 6 },
      shadowOpacity: 0.5,
      shadowRadius: 12,
      elevation: 8,
    }
  };
};

// ── Daily motivation quotes ───────────────────────────────────────────────────
const QUOTES = [
  { text: "Discipline is the bridge between goals and accomplishment.", author: "Jim Rohn" },
  { text: "We are what we repeatedly do. Excellence is not an act, but a habit.", author: "Aristotle" },
  { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
  { text: "Success is the sum of small efforts repeated day in and day out.", author: "Robert Collier" },
  { text: "Don't wish it were easier. Wish you were better.", author: "Jim Rohn" },
  { text: "A man who controls himself can control the world.", author: "Stoic Proverb" },
  { text: "Suffer the pain of discipline or suffer the pain of regret.", author: "Jim Rohn" },
];

// ── Mission button tile ───────────────────────────────────────────────────────
const getMissionsArray = (tokens: any) => [
  { key: 'BODY', icon: Dumbbell, iconColor: tokens.MUST, iconBg: `${tokens.MUST}25` },
  { key: 'MIND', icon: Brain,    iconColor: '#fff', iconBg: 'rgba(255,255,255,0.2)', inset: true },
  { key: 'WORK', icon: Briefcase,iconColor: tokens.SAGE,   iconBg: `${tokens.SAGE}25` },
];

// ── Daily Audit task cards (static from Stitch) ───────────────────────────────
const AUDIT_TASKS = [
  { id: 'a1', title: 'Deep Work Session',    time: '9:00 AM – 11:30 AM', pts: 25,  done: true  },
  { id: 'a2', title: 'Mindfulness Meditation', time: 'Next: 2:00 PM',    pts: null, done: false },
];

const FragmentItem = React.memo(({ index, shatterValue, forgeBg, terrColor }: {
  index: number;
  shatterValue: SharedValue<number>;
  forgeBg: string;
  terrColor: string;
}) => {
  const angle = (index / 12) * Math.PI * 2;
  const dist = 120 + ((index * 37) % 60);
  
  const fragmentStyle = useAnimatedStyle(() => {
    return {
      opacity: withTiming(shatterValue.value > 0 ? (1 - shatterValue.value) : 0, { duration: 100 }),
      transform: [
        { translateX: shatterValue.value * Math.cos(angle) * dist },
        { translateY: shatterValue.value * Math.sin(angle) * dist },
        { rotate: `${shatterValue.value * 720}deg` },
        { scale: 1 - shatterValue.value },
      ],
    };
  });

  return (
    <Reanimated.View
      style={[
        {
          position: 'absolute', width: 18, height: 18,
          backgroundColor: index % 2 === 0 ? forgeBg : terrColor,
          borderRadius: 4, zIndex: 50,
        },
        fragmentStyle,
      ]}
    />
  );
});
FragmentItem.displayName = 'FragmentItem';


export default function ForgeDashboardScreen() {
  const appTheme = useAppTheme();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const colorScheme = useColorScheme();
  const tokens = React.useMemo(() => getThemeTokens(appTheme), [appTheme]);
  const clay = React.useMemo(() => getClayStyles(tokens), [tokens]);
  const MISSIONS = React.useMemo(() => getMissionsArray(tokens), [tokens]);
  const styles = React.useMemo(() => createStyles(tokens), [tokens]);
  const { BG, CHR, SAGE, TERR, MUST, EGSHELL, isDark } = tokens;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { clayCard, clayRaised, clayInset, clayStamp } = clay;
  const { openDrawer } = React.useContext(GlobalDrawerContext);

  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [activeKey, setActiveKey]   = useState<string | null>('MIND');
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle]     = useState('');
  const [newCat, setNewCat]         = useState<'BODY'|'MIND'|'WORK'>('BODY');
  const [newType, setNewType]       = useState<'TASK'|'TIME'>('TASK');
  const [newDuration, setNewDuration] = useState('30');
   
    const [creating, setCreating]     = useState(false);
  const quoteOfDay = QUOTES[new Date().getDay() % QUOTES.length];

  // ── Deterministic point formula ───────────────────────────────────────────
  // Same formula for ALL users. Editing is disabled.
  // Base: category weight x type multiplier x duration factor
  const calcPoints = (cat: 'BODY'|'MIND'|'WORK', type: 'TASK'|'TIME', durationMins: number): number => {
    const catBase: Record<string, number> = { BODY: 15, MIND: 20, WORK: 18 };
    const typeMulti = type === 'TIME' ? 1.0 : 1.2; // Snap (photo) is harder = +20%
    const durFactor = type === 'TIME' ? Math.min(3.0, Math.max(0.5, durationMins / 30)) : 1.0;
    return Math.round(catBase[cat] * typeMulti * durFactor);
  };

  const computedPts = calcPoints(
    newCat,
    newType,
    newType === 'TIME' ? Number(newDuration) || 30 : 30
  );


  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const int = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(int);
  }, []);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { profile, disciplineScore, currentStreak, deductPoints } = useUserStore();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { todayMissions, setTodayMissions } = useMissionStore();

  const loadMissions = async () => {
    if (!profile) return;
    setRefreshing(true);
    try {
      // Check if user needs Genesis Onboarding
      const { count, error: countErr } = await supabase
        .from('missions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', profile.user_id);
        
      if (!countErr && count === 0) {
        router.replace('/genesis');
        return;
      }

      const today = new Date().toLocaleDateString('en-CA');
      await fetchTodayMissions(profile.user_id, today);
    } catch (e) {
      console.warn('Mission fetch failed', e);
    } finally {
      setRefreshing(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      loadMissions();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [profile])
  );

  const handleCreateMission = async () => {
    if (!newTitle.trim() || !profile) return;
    setCreating(true);
    try {
      // Points are always computed by the deterministic formula — never user input
      const lockedPts = calcPoints(
        newCat,
        newType,
        newType === 'TIME' ? Number(newDuration) || 30 : 30
      );

      const { data: mission, error: mErr } = await supabase.from('missions').insert({
        user_id: profile.user_id,
        category: newCat,
        difficulty: 'EASY',
        mission_type: newType,
        expected_duration_mins: newType === 'TIME' ? Number(newDuration) : null,
        title: newTitle.trim(),
        base_reward_points: lockedPts,
        
        is_recurring: false,
      } as any).select().single();
      if (mErr) throw mErr;
      const m = mission as any;

      const today = new Date().toLocaleDateString('en-CA');
      await supabase.from('mission_completions').insert({
        mission_id: m.mission_id,
        user_id: profile.user_id,
        target_date: today,
        status: 'PENDING',
      } as any);
      setShowCreate(false);
      setNewTitle('');
      loadMissions();
    } catch (e: any) {
      Alert.alert('Could not create mission', e?.message || String(e));
    } finally {
      setCreating(false);
    }
  };

  const maxScore       = 5000;
  const consistencyIdx = Math.min(100, Math.round((disciplineScore / maxScore) * 100));
  const focusPts       = disciplineScore > 0 ? Math.round(disciplineScore * 0.028) : 140;
  const targetsMet     = todayMissions.length > 0
    ? `${todayMissions.filter(m => m.status === 'COMPLETED').length}/${todayMissions.length}`
    : '8/10';

  // ── AAR availability: all missions resolved (none PENDING) ────────────────
  const allMissionsDone = todayMissions.length > 0 &&
    todayMissions.every(m => m.status === 'COMPLETED' || m.status === 'FAILED');

  const handleMissionPress = (key: string) => {
    setActiveKey(prev => (prev === key ? null : key));
  };

  const handleTaskPress = async (completion: any) => {
    const mission = completion.missions as any;
    


    router.push({
      pathname: '/snap',
      params: {
        completionId: completion.completion_id,
        title: mission?.title || 'Protocol',
        points: mission?.base_reward_points || 0,
        expected_duration_mins: mission?.expected_duration_mins || 0,
        isFinish: (completion.started_at != null && completion.ended_at == null && completion.status === 'PENDING') ? 'true' : 'false',
      },
    });
  };

  // ── FORGE ANIMATION LOGIC ──
  const forgeScale = useSharedValue(1);
  const forgeRotate = useSharedValue(0);

  useEffect(() => {
    if (currentStreak >= 8) {
       // Glowing Obsidian: fast spin + pulse
       forgeScale.value = withRepeat(withTiming(1.07, { duration: 900, easing: Easing.inOut(Easing.ease) }), -1, true);
       forgeRotate.value = withRepeat(withTiming(360, { duration: 6000, easing: Easing.linear }), -1, false);
    } else if (currentStreak >= 3) {
       // Chiseled Core: medium spin
       forgeScale.value = withRepeat(withTiming(1.03, { duration: 1800, easing: Easing.inOut(Easing.ease) }), -1, true);
       forgeRotate.value = withRepeat(withTiming(360, { duration: 12000, easing: Easing.linear }), -1, false);
    } else {
       // Raw Stone: slow lazy spin
       forgeScale.value = withRepeat(withTiming(1.01, { duration: 2500, easing: Easing.inOut(Easing.ease) }), -1, true);
       forgeRotate.value = withRepeat(withTiming(360, { duration: 20000, easing: Easing.linear }), -1, false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStreak]);

  // ── Shatter Animation Logic ──────────────────────────────────────────
  const lastStreakRef = useRef(currentStreak);
  const shatterValue = useSharedValue(0);

  useEffect(() => {
    if (lastStreakRef.current > 0 && currentStreak === 0) {
      // Trigger Shatter
      shatterValue.value = 0;
      shatterValue.value = withTiming(1, { duration: 1000, easing: Easing.out(Easing.quad) });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
    lastStreakRef.current = currentStreak;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStreak]);

  const renderFragments = () => {
    return Array.from({ length: 12 }).map((_, i) => (
      <FragmentItem
        key={`frag-${i}`}
        index={i}
        shatterValue={shatterValue}
        forgeBg={forgeBg}
        terrColor={TERR}
      />
    ));
  };

  const forgeStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: forgeScale.value },
      { rotateZ: `${forgeRotate.value}deg` }
    ]
  }));


  let forgeBg = '#A8A3A4'; // Raw Stone
  let forgeRadius = 16;
  let fgColor = '#fff';
  let innerBg = 'rgba(255,255,255,0.2)';
  let forgeTitle = 'Raw Stone';

  if (currentStreak >= 8) {
     forgeBg = CHR;
     forgeRadius = 60; // Perfect circle
     fgColor = MUST;
     innerBg = 'rgba(255,255,255,0.05)';
     forgeTitle = 'Glowing Obsidian';
  } else if (currentStreak >= 3) {
     forgeBg = SAGE;
     forgeRadius = 30; // Chiseled
     fgColor = '#fff';
     forgeTitle = 'Chiseled Core';
  }

  const floatAnim1 = useRef(new Animated.Value(0)).current;
  const floatAnim2 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim1, { toValue: 1, duration: 8000, useNativeDriver: true }),
        Animated.timing(floatAnim1, { toValue: 0, duration: 8000, useNativeDriver: true }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim2, { toValue: 1, duration: 11000, useNativeDriver: true }),
        Animated.timing(floatAnim2, { toValue: 0, duration: 11000, useNativeDriver: true }),
      ])
    ).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const translateY1 = floatAnim1.interpolate({ inputRange: [0, 1], outputRange: [0, -40] });
  const rotate1     = floatAnim1.interpolate({ inputRange: [0, 1], outputRange: ['12deg', '25deg'] });
  
  const translateY2 = floatAnim2.interpolate({ inputRange: [0, 1], outputRange: [0, 30] });
  const rotate2     = floatAnim2.interpolate({ inputRange: [0, 1], outputRange: ['-45deg', '-20deg'] });

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={BG} />

      {/* ── 4D Background Layer / Decorative Elements ── */}
      {/* Top right floating pill */}
      <Animated.View style={[styles.floatingProps1, { transform: [{ translateY: translateY1 }, { rotate: rotate1 }] }]}>
        <View style={[styles.clayPill, styles.propBlurSmall]} />
      </Animated.View>

      {/* Center left floating mustard stamp */}
      <Animated.View style={[styles.floatingProps2, { transform: [{ translateY: translateY2 }, { rotate: rotate2 }] }]}>
        <View style={[styles.claySquare, styles.propBlurMedium]} />
      </Animated.View>

      {/* Top Left soft glow sphere */}
      <View style={styles.blobTopLeft} />

      {/* Bottom Right soft glow sphere */}
      <View style={styles.blobBottomRight} />

      {/* ── Header ─────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Pressable onPress={openDrawer} hitSlop={10}>
            <Text style={styles.menuIcon}>☰</Text>
          </Pressable>
          <Text style={styles.brandName}>Cadence</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
          <Pressable onPress={() => router.push('/(tabs)/profile')} style={styles.avatarCircle}>
            {(profile as any)?.avatar_url ? (
              <Image
                source={{ uri: (profile as any).avatar_url }}
                style={styles.avatarImg}
              />
            ) : (
              <Text style={styles.avatarLetter}>{(profile?.username || 'U')[0].toUpperCase()}</Text>
            )}
          </Pressable>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadMissions} tintColor={SAGE} />}
      >

        {/* ── MOTIVATION QUOTE ───────────────────────────────────────── */}
        <View style={[styles.quoteCard, { backgroundColor: `${CHR}08` }]}>
          <Sparkles size={14} color={MUST} strokeWidth={2.5} style={{ marginBottom: 6 }} />
          <Text style={styles.quoteText}>&quot;{quoteOfDay.text}&quot;</Text>
          <Text style={styles.quoteAuthor}>— {quoteOfDay.author}</Text>
        </View>

        {/* ── THE FORGE (Dynamic Consistency Stamp) ──────────────────────── */}
        <View style={styles.stampSection}>
          <View style={{ width: 120, height: 120, alignItems: 'center', justifyContent: 'center' }}>
            {renderFragments()}
            <Reanimated.View style={[
              { 
                position: 'absolute', width: 120, height: 120, backgroundColor: forgeBg, 
                borderRadius: forgeRadius, shadowColor: forgeBg, shadowOffset: {width:0, height:8},
                shadowOpacity: 0.6, shadowRadius: 16, elevation: 10
              },
              forgeStyle,
              useAnimatedStyle(() => ({
                opacity: (currentStreak === 0 && shatterValue.value > 0) ? withTiming(0) : 1,
                transform: [{ scale: (currentStreak === 0 && shatterValue.value > 0) ? withTiming(0) : 1 }]
              }))
            ]} />
            <View style={{ width: 92, height: 92, borderRadius: forgeRadius === 60 ? 46 : forgeRadius - 8, backgroundColor: innerBg, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'rgba(255,255,255,0.2)' }}>
              <Text style={[styles.stampPct, { color: fgColor }]}>{consistencyIdx}%</Text>
              <Text style={[styles.stampLabel, { color: fgColor, opacity: 0.8 }]}>Consistency</Text>
            </View>
          </View>
          <View style={styles.stampMeta}>
            <Text style={styles.stampSub}>{forgeTitle}</Text>
            <View style={styles.streakRow}>
              <Flame size={14} color={TERR} strokeWidth={2.5} />
              <Text style={styles.streakText}>{currentStreak} Day Streak</Text>
            </View>
          </View>
        </View>

        {/* ── STATS GRID (2-col) ─────────────────────────────────────── */}
        <View style={styles.statsGrid}>
          <Shadow distance={6} startColor={isDark ? '#00000040' : '#B8B2A540'} offset={[2, 4]} containerStyle={{ flex: 1 }} style={{ width: '100%', borderRadius: 32 }}>
            <View style={[styles.statCard, { flex: undefined, backgroundColor: EGSHELL, borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(230,225,215,0.5)' }]}>
              <Zap size={22} color={TERR} strokeWidth={2} />
              <Text style={styles.statNum}>{focusPts}</Text>
              <Text style={styles.statLbl}>Focus Points</Text>
            </View>
          </Shadow>
          <Shadow distance={6} startColor={isDark ? '#00000040' : '#B8B2A540'} offset={[2, 4]} containerStyle={{ flex: 1 }} style={{ width: '100%', borderRadius: 32 }}>
            <View style={[styles.statCard, { flex: undefined, backgroundColor: EGSHELL, borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(230,225,215,0.5)' }]}>
              <Target size={22} color={SAGE} strokeWidth={2} />
              <Text style={styles.statNum}>{targetsMet}</Text>
              <Text style={styles.statLbl}>Targets Met</Text>
            </View>
          </Shadow>
        </View>



        {/* ── MISSION TRAY ───────────────────────────────────────────── */}
        <Text style={styles.sectionLabel}>Mission Tray</Text>
        <View style={styles.missionTray}>
          {MISSIONS.map(({ key, icon: Icon, iconColor, iconBg }) => {
            const isActive = activeKey === key;
            const applied  = isActive ? clayInset : clayRaised;
            // Filter missions for this category
            const categoryMissions = todayMissions.filter(
              m => (m.missions as any)?.category === key
            );
            return (
              <View key={key}>
                {/* Category button */}
                <Pressable
                  style={[styles.missionBtn, applied]}
                  onPress={() => handleMissionPress(key)}
                >
                  <View style={styles.missionLeft}>
                    <View style={[styles.missionIconBox, { backgroundColor: isActive ? 'rgba(255,255,255,0.2)' : iconBg }]}>
                      <Icon size={20} color={isActive ? '#fff' : iconColor} strokeWidth={2.5} />
                    </View>
                    <Text style={[styles.missionLabel, isActive && { color: '#fff' }]}>{key}</Text>
                  </View>
                  {isActive ? (
                    <View style={styles.activeRow}>
                      <Text style={styles.activeText}>{categoryMissions.length} Tasks</Text>
                      <View style={styles.activeDot} />
                    </View>
                  ) : (
                    <ChevronRight size={18} color={`${CHR}30`} strokeWidth={2.5} />
                  )}
                </Pressable>

                {/* Expanded task list */}
                {isActive && (
                  <View style={styles.taskList}>
                    {categoryMissions.length === 0 ? (
                      <Shadow distance={8} startColor={isDark ? '#00000040' : '#B8B2A540'} offset={[2, 4]} style={{ width: '100%', borderRadius: 32 }} containerStyle={{ marginBottom: 12, width: '100%' }}>
                        <View style={[styles.taskRow, { backgroundColor: EGSHELL, borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(230,225,215,0.5)', marginBottom: 0 }]}>
                          <View style={[styles.auditIconBox, { backgroundColor: `${CHR}08` }]}>
                            <CheckCircle size={20} color={`${CHR}25`} strokeWidth={2} />
                          </View>
                          <Text style={[styles.auditTitle, { color: `${CHR}50` }]}>No tasks for {key} today</Text>
                        </View>
                      </Shadow>
                    ) : (
                      categoryMissions.map(m => {
                        const done = m.status === 'COMPLETED' || m.status === 'FAILED';
                        return (
                          <MissionItem key={m.completion_id} completion={m} now={now} onPress={() => !done && handleTaskPress(m)} tokens={tokens} clay={clay} styles={styles} />
                        );
                      })
                    )}
                  </View>
                )}
              </View>
            );
          })}
        </View>

        {/* ── AFTER ACTION REPORT CTA ────────────────────────────────── */}
        {allMissionsDone && (
          <Pressable
            style={[styles.aarCta, { backgroundColor: isDark ? 'rgba(232,92,92,0.12)' : 'rgba(232,92,92,0.08)', borderColor: '#E85C5C' }]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
              router.push('/aar');
            }}
          >
            <View style={[styles.aarIconBox]}>
              <Shield size={22} color="#E85C5C" strokeWidth={2} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.aarCtaTitle}>Day Complete — Request Debrief</Text>
              <Text style={styles.aarCtaSub}>Vanguard Commander is standing by</Text>
            </View>
            <ChevronRight size={18} color="#E85C5C" strokeWidth={2.5} />
          </Pressable>
        )}

        {/* ── DAILY AUDIT TASK CARDS ─────────────────────────────────── */}
        <View style={styles.auditHeader}>
          <Text style={styles.sectionLabel}>Daily Audit</Text>
        </View>

        {AUDIT_TASKS.map(task => (
           <Shadow key={task.id} distance={8} startColor={isDark ? '#00000040' : '#B8B2A540'} offset={[2, 4]} style={{ width: '100%', borderRadius: 24 }} containerStyle={{ marginBottom: 12, width: '100%' }}>
            <View style={[styles.auditCard, !task.done && styles.auditCardPending, { backgroundColor: EGSHELL, borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(230,225,215,0.5)', marginBottom: 0 }]}>
              <View style={[styles.auditIconBox, task.done ? clayStamp : {}]}>
                {task.done
                  ? <CheckCircle size={20} color="#fff" strokeWidth={2.5} />
                  : <Timer size={20} color={`${CHR}35`} strokeWidth={2} />
                }
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.auditTitle}>{task.title}</Text>
                <Text style={styles.auditTime}>{task.time}</Text>
              </View>
              {task.pts != null && (
                <Text style={styles.auditPts}>+{task.pts} pts</Text>
              )}
            </View>
          </Shadow>
        ))}

      </ScrollView>

      {/* ── FAB: Create Mission ────────────────────────────────────────── */}
      <Pressable style={styles.fab} onPress={() => setShowCreate(true)}>
        <Plus size={26} color="#fff" strokeWidth={2.5} />
      </Pressable>

      {/* ── Create Mission Modal ───────────────────────────────────────── */}
      <Modal visible={showCreate} transparent animationType="slide">
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <Pressable style={styles.modalBackdrop} onPress={() => setShowCreate(false)} />
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New Mission</Text>
              <Pressable onPress={() => setShowCreate(false)}>
                <X size={20} color={`${CHR}50`} strokeWidth={2.5} />
              </Pressable>
            </View>

            {/* Title */}
            <Text style={styles.fieldLabel}>Mission Title</Text>
            <TextInput
              style={styles.fieldInput}
              placeholder="e.g. Morning Run, Read 30 Pages..."
              placeholderTextColor={`${CHR}35`}
              value={newTitle}
              onChangeText={setNewTitle}
            />

            {/* Category */}
            <Text style={styles.fieldLabel}>Category</Text>
            <View style={styles.catRow}>
              {(['BODY','MIND','WORK'] as const).map(cat => (
                <Pressable
                  key={cat}
                  style={[styles.catPill, newCat === cat && styles.catPillActive]}
                  onPress={() => setNewCat(cat)}
                >
                  <Text style={[styles.catText, newCat === cat && { color: '#fff' }]}>{cat}</Text>
                </Pressable>
              ))}
            </View>

            {/* Mission Type */}
            <Text style={styles.fieldLabel}>Verification Method</Text>
            <View style={styles.catRow}>
              {(['TASK','TIME'] as const).map(type => (
                <Pressable
                  key={type}
                  style={[styles.catPill, newType === type && styles.catPillActive]}
                  onPress={() => setNewType(type)}
                >
                  <Text style={[styles.catText, newType === type && { color: '#fff' }]}>{type === 'TIME' ? 'Timer' : 'Photo Snap'}</Text>
                </Pressable>
              ))}
            </View>

            {newType === 'TIME' && (
              <>
                <Text style={styles.fieldLabel}>Task Duration (mins)</Text>
                <TextInput
                  style={styles.fieldInput}
                  placeholder="30"
                  placeholderTextColor={`${CHR}35`}
                  value={newDuration}
                  onChangeText={setNewDuration}
                  keyboardType="numeric"
                />
              </>
            )}


            {/* Points preview — read only, computed from formula */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, paddingHorizontal: 4 }}>
              <View>
                <Text style={styles.fieldLabel}>Reward Points</Text>
                <Text style={{ fontSize: 10, color: `${CHR}40`, fontWeight: '600', marginTop: -4 }}>Auto-calculated · Equal for all</Text>
              </View>
              <View style={[styles.ptsBadge, { backgroundColor: `${SAGE}15`, borderColor: `${SAGE}40` }]}>
                <Text style={[styles.ptsBadgeText, { color: SAGE }]}>+{computedPts} pts</Text>
              </View>
            </View>

            <Pressable
              style={[styles.createBtn, (!newTitle.trim() || creating) && { opacity: 0.4 }]}
              onPress={handleCreateMission}
              disabled={!newTitle.trim() || creating}
            >
              <Text style={styles.createBtnText}>{creating ? 'Creating...' : 'Add to Today'}</Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

// ── StyleSheet ─────────────────────────────────────────────────────────────────
const createStyles = (tokens: any) => {
  const { BG, MUST, TERR, EGSHELL, CHR, SAGE } = tokens;
  
  return StyleSheet.create({
  root: { flex: 1, backgroundColor: BG, position: 'relative' },

  // Background decorative blobs
  blobTopLeft: {
    position: 'absolute', top: -40, left: -40,
    width: 250, height: 250, borderRadius: 125,
    backgroundColor: MUST, opacity: 0.2, // Boosted opacity & size
  },
  blobBottomRight: {
    position: 'absolute', bottom: -50, right: -50,
    width: 300, height: 300, borderRadius: 150,
    backgroundColor: TERR, opacity: 0.15, // Boosted opacity & size
  },

  // 4D Floating Props
  floatingProps1: {
    position: 'absolute', top: '35%', right: -15,
    transform: [{ rotate: '12deg' }],
    zIndex: 0, opacity: 0.9,
  },
  floatingProps2: {
    position: 'absolute', bottom: '28%', left: -10,
    transform: [{ rotate: '-45deg' }],
    zIndex: 0, opacity: 0.8,
  },
  clayPill: {
    width: 80, height: 160, borderRadius: 40,
    backgroundColor: EGSHELL,
    shadowColor: '#A0998B', shadowOffset: { width: 6, height: 12 },
    shadowOpacity: 0.7, shadowRadius: 16, elevation: 12,
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.8)',
  },
  claySquare: {
    width: 90, height: 90, borderRadius: 28,
    backgroundColor: MUST,
    shadowColor: `${MUST}95`, shadowOffset: { width: 6, height: 10 },
    shadowOpacity: 0.8, shadowRadius: 16, elevation: 12,
    borderWidth: 2, borderColor: '#FFDC99',
  },
  propBlurSmall:  { opacity: 0.85 }, 
  propBlurMedium: { opacity: 0.75 },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 56, paddingBottom: 4, zIndex: 10,
  },
  headerLeft:   { flexDirection: 'row', alignItems: 'center', gap: 10 },
  menuIcon:     { fontSize: 20, color: `${CHR}70` },
  brandName:    { fontSize: 20, fontWeight: '800', color: CHR, letterSpacing: -0.3 },
  avatarCircle: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: `${SAGE}30`, alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImg:    { width: 40, height: 40, borderRadius: 20 },
  avatarLetter: { fontSize: 16, fontWeight: '900', color: SAGE },

  scroll: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 130, zIndex: 2 },

  // Consistency Stamp
  stampSection: { alignItems: 'center', gap: 12, marginBottom: 28 },
  stampOuter: {
    width: 120, height: 120, borderRadius: 60,
    alignItems: 'center', justifyContent: 'center',
  },
  stampInner: {
    width: 92, height: 92, borderRadius: 46,
    backgroundColor: SAGE, alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: 'rgba(129,178,154,0.35)',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4,
  },
  stampPct:     { fontSize: 28, fontWeight: '800', color: '#fff', letterSpacing: -1 },
  stampLabel:   { fontSize: 9,  fontWeight: '800', color: 'rgba(255,255,255,0.8)', letterSpacing: 2, textTransform: 'uppercase' },
  stampMeta:    { alignItems: 'center', gap: 4 },
  stampSub:     { fontSize: 13, color: `${CHR}60`, fontWeight: '500' },
  streakRow:    { flexDirection: 'row', alignItems: 'center', gap: 5 },
  streakText:   { fontSize: 14, fontWeight: '800', color: CHR },

  // Stats grid
  statsGrid: { flexDirection: 'row', gap: 14, marginBottom: 28 },
  statCard:  { flex: 1, borderRadius: 20, padding: 18, gap: 6 },
  statNum:   { fontSize: 26, fontWeight: '900', color: CHR },
  statLbl:   { fontSize: 10, fontWeight: '800', color: `${CHR}50`, letterSpacing: 1.5, textTransform: 'uppercase' },

  // Section labels
  sectionLabel: { fontSize: 10, fontWeight: '900', color: `${CHR}45`, letterSpacing: 3, textTransform: 'uppercase', marginBottom: 12 },

  // Mission tray
  winterArcCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 16, borderRadius: 20, marginBottom: 28,
    borderLeftWidth: 4, borderLeftColor: TERR,
  },
  winterArcTitle: { fontSize: 16, fontWeight: '900', color: CHR },
  winterArcSub: { fontSize: 11, fontWeight: '600', color: `${CHR}60`, marginTop: 3, letterSpacing: 0.5 },
  
  missionTray: { gap: 10, marginBottom: 28 },
  taskList: { marginTop: 8, gap: 8, paddingLeft: 12 },
  taskRow: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    borderRadius: 16, padding: 14,
  },
  missionBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    height: 64, borderRadius: 20, paddingHorizontal: 20,
  },
  missionLeft:   { flexDirection: 'row', alignItems: 'center', gap: 14 },
  missionIconBox:{ width: 34, height: 34, borderRadius: 100, alignItems: 'center', justifyContent: 'center' },
  missionLabel:  { fontSize: 15, fontWeight: '900', color: CHR, letterSpacing: 0.5 },
  activeRow:     { flexDirection: 'row', alignItems: 'center', gap: 6 },
  activeText:    { fontSize: 11, fontWeight: '900', color: 'rgba(255,255,255,0.85)', textTransform: 'uppercase', letterSpacing: 1 },
  activeDot:     { width: 7, height: 7, borderRadius: 4, backgroundColor: '#fff', opacity: 0.9 },

  // Daily Audit cards
  auditHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  viewAll:     { fontSize: 12, fontWeight: '800', color: TERR, textDecorationLine: 'underline' },

  auditCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    borderRadius: 18, padding: 16, marginBottom: 12,
  },
  auditCardPending: { borderLeftWidth: 4, borderLeftColor: TERR },
  auditIconBox: {
    width: 42, height: 42, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: `${SAGE}30`,
  },
  auditTitle: { fontSize: 14, fontWeight: '800', color: CHR, marginBottom: 3 },
  auditTime:  { fontSize: 11, color: `${CHR}50`, fontWeight: '500' },
  auditPts:   { fontSize: 14, fontWeight: '900', color: SAGE },

  // TaskRow Additions
  clayVesselSmall: {
    width: 14, height: 32, borderRadius: 6,
    backgroundColor: 'rgba(0,0,0,0.06)', overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  claySandSmall: { width: '100%' },
  timerTextSmall: { fontSize: 10, fontWeight: '900', color: CHR, fontVariant: ['tabular-nums'] },

  // Quote card
  quoteCard: {
    borderRadius: 16, padding: 16, marginBottom: 20,
    alignItems: 'center', gap: 4,
  },
  quoteText:   { fontSize: 13, color: CHR, fontWeight: '600', textAlign: 'center', fontStyle: 'italic', lineHeight: 20 },
  quoteAuthor: { fontSize: 11, color: `${CHR}45`, fontWeight: '700', letterSpacing: 0.5 },

  // FAB
  fab: {
    position: 'absolute', bottom: 100, right: 24,
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: TERR, alignItems: 'center', justifyContent: 'center',
    shadowColor: TERR, shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4, shadowRadius: 16, elevation: 12,
  },

  // Create Mission Modal
  modalOverlay:  { flex: 1, justifyContent: 'flex-end' },
  modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(61,64,91,0.35)' },
  modalSheet: {
    backgroundColor: '#F9F7F2',
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: 24, paddingBottom: 40,
    shadowColor: '#000', shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12, shadowRadius: 20, elevation: 16,
  },
  modalHandle: { width: 44, height: 5, borderRadius: 3, backgroundColor: `${CHR}20`, alignSelf: 'center', marginBottom: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle:  { fontSize: 18, fontWeight: '900', color: CHR },

  // Form fields
  fieldLabel: { fontSize: 11, fontWeight: '800', color: `${CHR}50`, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 8 },
  fieldInput: {
    backgroundColor: `${CHR}07`, borderRadius: 14, padding: 14,
    fontSize: 15, color: CHR, fontWeight: '600', marginBottom: 18,
  },

  // Category selector
  catRow:       { flexDirection: 'row', gap: 10, marginBottom: 18 },
  catPill:      { flex: 1, paddingVertical: 10, borderRadius: 12, backgroundColor: `${CHR}08`, alignItems: 'center' },
  catPillActive:{ backgroundColor: CHR },
  catText:      { fontSize: 12, fontWeight: '900', color: CHR, letterSpacing: 1 },

  // Create button
  createBtn:     { backgroundColor: TERR, borderRadius: 16, paddingVertical: 16, alignItems: 'center', marginTop: 4 },
  createBtnText: { color: '#fff', fontSize: 16, fontWeight: '900', letterSpacing: 0.5 },

  // After Action Report CTA
  aarCta: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    borderRadius: 20, padding: 18, marginBottom: 20,
    borderWidth: 1.5,
    shadowColor: '#E85C5C', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25, shadowRadius: 16, elevation: 8,
  },
  aarIconBox: {
    width: 44, height: 44, borderRadius: 14,
    backgroundColor: 'rgba(232,92,92,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  aarCtaTitle: { fontSize: 15, fontWeight: '900', color: CHR },
  aarCtaSub:   { fontSize: 11, color: `${CHR}50`, fontWeight: '600', marginTop: 2 },

  // Points badge (read-only, create modal)
  ptsBadge: {
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 12, borderWidth: 1.5,
  },
  ptsBadgeText: { fontSize: 16, fontWeight: '900' },
  });
};
