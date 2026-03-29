import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, ScrollView, Pressable, StyleSheet,
  RefreshControl, Platform,
  StatusBar, Animated, Modal, TextInput, KeyboardAvoidingView, Alert,
} from 'react-native';
import Reanimated, { useAnimatedStyle, useSharedValue, withTiming, withSequence, Easing, withRepeat } from 'react-native-reanimated';

import { useUserStore } from '../../store/useUserStore';
import { useMissionStore } from '../../store/useMissionStore';
import { fetchTodayMissions } from '../../services/missionService';
import { supabase } from '../../services/supabase';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import {
  Dumbbell, Brain, Briefcase, ChevronRight, Zap,
  Target, CheckCircle, Timer, Flame, Plus, X, Sparkles, Trophy, UserPlus,
} from 'lucide-react-native';

import { useAppTheme } from '../../hooks/use-app-theme';
import { Colors } from '../../constants/theme';
import { useColorScheme } from '../../hooks/use-color-scheme';


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

// ── TaskRow Component (Extracted for Hooks) ───────────────────────────────────
function TaskRow({ completion, now, onPress, tokens, clay, styles }: any) {
  const { SAGE, TERR } = tokens;
  const { clayCard } = clay;
  const mission = completion.missions as any;
  const done = completion.status === 'COMPLETED';
  const failed = completion.status === 'FAILED';
  // All tasks go through snap protocol now unless they are TIME based
  const isTask = mission?.mission_type !== 'TIME';
  const hasStarted = completion.started_at != null && completion.ended_at == null && completion.status === 'PENDING';
  const isActiveTask = hasStarted && (mission?.expected_duration_mins ?? 0) > 0;

  const resetStreak = useUserStore(s => s.resetStreak);

  const shakeX = useSharedValue(0);
  
  let inGrace = false;
  let timerDisplay = '';
  let fillPct = 0;
  let forceSubmitFail = false;

  if (isActiveTask) {
    const targetTimeMs = new Date(completion.started_at).getTime() + (mission?.expected_duration_mins || 0) * 60000;
    const remainingMs = targetTimeMs - now;
    const remainingSecs = Math.ceil(remainingMs / 1000);

    if (remainingSecs >= 0) {
      const mins = Math.floor(remainingSecs / 60);
      const secs = remainingSecs % 60;
      timerDisplay = `${mins}:${secs.toString().padStart(2, '0')}`;
      fillPct = Math.min(100, Math.max(0, (remainingSecs / ((mission?.expected_duration_mins || 1) * 60)) * 100));
    } else {
      inGrace = true;
      const graceRemainingSecs = (10 * 60) + remainingSecs;
      if (graceRemainingSecs <= 0) {
         timerDisplay = '-00:00';
         fillPct = 0;
         forceSubmitFail = true;
      } else {
         const mins = Math.floor(graceRemainingSecs / 60);
         const secs = Math.abs(graceRemainingSecs % 60);
         timerDisplay = `-${mins}:${secs.toString().padStart(2, '0')}`;
         fillPct = Math.min(100, Math.max(0, (graceRemainingSecs / 600) * 100));
      }
    }
  }

  useEffect(() => {
    if (inGrace) {
      shakeX.value = withRepeat(withSequence(
        withTiming(-3, { duration: 50, easing: Easing.linear }),
        withTiming(3, { duration: 50, easing: Easing.linear })
      ), -1, true);
    } else {
      shakeX.value = 0;
    }
  }, [inGrace]);

  // Handle auto-fail trigger for judge
  useEffect(() => {
    if (forceSubmitFail && isActiveTask) {
      const runGraceFail = async () => {
         try {
           const { data } = await supabase.from('mission_completions').select('start_image_url').eq('completion_id', completion.completion_id).single();
           if ((data as any)?.start_image_url) {
              const res = await supabase.functions.invoke('trigger-ai-feedback', {
                 body: { image_1: data?.start_image_url, image_2: null, missionName: mission?.title }
              });
              if (res.data?.verified && res.data?.score_multiplier > 0) {
                 await supabase.from('mission_completions').update({ status: 'COMPLETED', is_grace_period: true, points_earned: Math.round((mission?.base_reward_points || 0) * res.data.score_multiplier) }).eq('completion_id', completion.completion_id);
                 return;
              }
           }
         } catch (e) {
            console.error(e);
         }
         // Lapsed Audit: Reset Streak to 0 if fake or failed
         resetStreak();
         // @ts-ignore
         await supabase.from('mission_completions').update({ status: 'FAILED', is_grace_period: true } as any).eq('completion_id', completion.completion_id);
      };
      runGraceFail();
    }
  }, [forceSubmitFail, isActiveTask]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeX.value }]
  }));

  const cardBaseStyle = [styles.taskRow, clayCard, !done && !failed && styles.auditCardPending];
  const isLocked = isActiveTask && !inGrace && fillPct < 100;

  if (inGrace) {
     cardBaseStyle.push({ shadowColor: TERR, shadowOpacity: 0.8, borderColor: TERR, borderWidth: 1 } as any);
  } else if (isLocked) {
     // Recessed clay state for physical lock
     cardBaseStyle.push({ shadowOffset: { width: 1, height: 1 }, shadowRadius: 2, shadowOpacity: 0.1, backgroundColor: '#EBE6DC', borderColor: 'transparent' } as any);
  }

  return (
    <Reanimated.View style={animatedStyle}>
      <Pressable
        style={cardBaseStyle}
        onPress={onPress}
        disabled={done || failed || isLocked}
      >
        <View style={[styles.auditIconBox, { backgroundColor: done ? `${SAGE}25` : (failed ? `${TERR}25` : (inGrace ? `${TERR}30` : `${TERR}15`)) }]}>
          {done ? <CheckCircle size={20} color={SAGE} strokeWidth={2.5} /> :
           failed ? <X size={20} color={TERR} strokeWidth={2.5} /> :
           <Timer size={20} color={TERR} strokeWidth={2} />}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.auditTitle}>{mission?.title || 'Protocol'}</Text>
          <Text style={styles.auditTime}>
            {done ? 'Verified ✓' : failed ? 'Failed ✗' : (hasStarted ? (inGrace ? 'GRACE PERIOD' : (isLocked ? 'Locked (In Progress)' : `Tap to Finish ${isTask ? 'Snap' : 'Timer'}`)) : `Tap to Start ${isTask ? 'Snap' : 'Timer'}`)}
          </Text>
        </View>

        {isActiveTask ? (
          <View style={{ alignItems: 'center', gap: 4 }}>
             <View style={[styles.clayVesselSmall, inGrace && { borderColor: TERR, borderWidth: 1, backgroundColor: `${TERR}20` }]}>
               <Reanimated.View style={[styles.claySandSmall, { height: `${fillPct}%`, backgroundColor: inGrace ? TERR : SAGE }]} />
             </View>
             <Text style={[styles.timerTextSmall, inGrace && { color: TERR }]}>{timerDisplay}</Text>
          </View>
        ) : (
          mission?.base_reward_points > 0 && (
             <Text style={[styles.auditPts, done && { color: SAGE }]}>+{mission.base_reward_points} pts</Text>
          )
        )}
      </Pressable>
    </Reanimated.View>
  );
}

export default function ForgeDashboardScreen() {
  const appTheme = useAppTheme();
  const colorScheme = useColorScheme();
  const tokens = React.useMemo(() => getThemeTokens(appTheme), [appTheme]);
  const clay = React.useMemo(() => getClayStyles(tokens), [tokens]);
  const MISSIONS = React.useMemo(() => getMissionsArray(tokens), [tokens]);
  const styles = React.useMemo(() => createStyles(tokens), [tokens]);
  const { BG, CHR, SAGE, TERR, MUST, EGSHELL, isDark } = tokens;
  const { clayCard, clayRaised, clayInset, clayStamp } = clay;

  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [activeKey, setActiveKey]   = useState<string | null>('MIND');
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle]     = useState('');
  const [newCat, setNewCat]         = useState<'BODY'|'MIND'|'WORK'>('BODY');
  const [newType, setNewType]       = useState<'TASK'|'TIME'>('TASK');
  const [newDuration, setNewDuration] = useState('30');
  const [newPts, setNewPts]         = useState('20');
  const [newWager, setNewWager]     = useState<number>(0);
  const [creating, setCreating]     = useState(false);
  const [estimating, setEstimating] = useState(false);
  const [aiReasoning, setAiReasoning] = useState<string | null>(null);
  const quoteOfDay = QUOTES[new Date().getDay() % QUOTES.length];

  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const int = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(int);
  }, []);

  const { profile, disciplineScore, currentStreak, deductPoints } = useUserStore();
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
    }, [profile])
  );

  const handleCreateMission = async () => {
    if (!newTitle.trim() || !profile) return;
    setCreating(true);
    try {
      const { data: mission, error: mErr } = await supabase.from('missions').insert({
        user_id: profile.user_id,
        category: newCat,
        difficulty: 'EASY',
        mission_type: newType, // differentiate between TASK and TIME
        expected_duration_mins: newType === 'TIME' ? Number(newDuration) : null,
        title: newTitle.trim(),
        base_reward_points: Number(newPts) || 20,
        wager_amount: newWager,
        is_recurring: false,
      } as any).select().single();
      if (mErr) throw mErr;
      const m = mission as any;

      if (newWager > 0) {
        deductPoints(newWager);
        const { data: pData } = await supabase.from('users').select('discipline_score').eq('user_id', profile.user_id).single();
        if (pData) {
           await (supabase.from('users').update({ discipline_score: Math.max(0, (pData as any).discipline_score - newWager) } as any).eq('user_id', profile.user_id) as any);
        }
      }

      // Create today's completion record
      const today = new Date().toLocaleDateString('en-CA');
      await supabase.from('mission_completions').insert({
        mission_id: m.mission_id,
        user_id: profile.user_id,
        target_date: today,
        status: 'PENDING',
      } as any);
      setShowCreate(false);
      setNewTitle('');
      setNewPts('20');
      setNewWager(0);
      loadMissions();
    } catch (e: any) {
      Alert.alert('Could not create mission', e?.message || String(e));
    } finally {
      setCreating(false);
    }
  };

  const handleTitleBlur = async () => {
    if (!newTitle.trim() || newTitle.length < 4 || !profile) return;
    setEstimating(true);
    setAiReasoning(null);
    try {
      const { data, error } = await supabase.functions.invoke('estimate-mission-points', {
        body: { title: newTitle.trim(), category: newCat, type: newType }
      });
      if (error) throw error;
      if (data?.points) {
        setNewPts(String(data.points));
        setAiReasoning(data.reasoning || null);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    } catch (e) {
      console.warn("AI Estimation error", e);
    } finally {
      setEstimating(false);
    }
  };

  const maxScore       = 5000;
  const consistencyIdx = Math.min(100, Math.round((disciplineScore / maxScore) * 100));
  const focusPts       = disciplineScore > 0 ? Math.round(disciplineScore * 0.028) : 140;
  const targetsMet     = todayMissions.length > 0
    ? `${todayMissions.filter(m => m.status === 'COMPLETED').length}/${todayMissions.length}`
    : '8/10';

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
  }, [currentStreak]);

  const renderFragments = () => {
    return Array.from({ length: 12 }).map((_, i) => {
      const angle = (i / 12) * Math.PI * 2;
      const dist = 120 + Math.random() * 60;
      
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
          key={`frag-${i}`}
          style={[
            {
              position: 'absolute', width: 18, height: 18,
              backgroundColor: i % 2 === 0 ? forgeBg : TERR,
              borderRadius: 4, zIndex: 50,
            },
            fragmentStyle,
          ]}
        />
      );
    });
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
          <Text style={styles.menuIcon}>☰</Text>
          <Text style={styles.brandName}>Cadence</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
          <Pressable onPress={() => router.push('/(tabs)/community')}>
            <UserPlus size={20} color={CHR} strokeWidth={2.5} />
          </Pressable>
          <Pressable onPress={() => router.push('/leaderboard')}>
            <Trophy size={22} color={CHR} strokeWidth={2.5} />
          </Pressable>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarLetter}>{(profile?.username || 'U')[0].toUpperCase()}</Text>
          </View>
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
          <View style={[styles.statCard, clayCard]}>
            <Zap size={22} color={TERR} strokeWidth={2} />
            <Text style={styles.statNum}>{focusPts}</Text>
            <Text style={styles.statLbl}>Focus Points</Text>
          </View>
          <View style={[styles.statCard, clayCard]}>
            <Target size={22} color={SAGE} strokeWidth={2} />
            <Text style={styles.statNum}>{targetsMet}</Text>
            <Text style={styles.statLbl}>Targets Met</Text>
          </View>
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
                      <View style={[styles.taskRow, clayCard]}>
                        <View style={[styles.auditIconBox, { backgroundColor: `${CHR}08` }]}>
                          <CheckCircle size={20} color={`${CHR}25`} strokeWidth={2} />
                        </View>
                        <Text style={[styles.auditTitle, { color: `${CHR}50` }]}>No tasks for {key} today</Text>
                      </View>
                    ) : (
                      categoryMissions.map(m => {
                        const done = m.status === 'COMPLETED' || m.status === 'FAILED';
                        return (
                          <TaskRow key={m.completion_id} completion={m} now={now} onPress={() => !done && handleTaskPress(m)} />
                        );
                      })
                    )}
                  </View>
                )}
              </View>
            );
          })}
        </View>

        {/* ── DAILY AUDIT TASK CARDS ─────────────────────────────────── */}
        <View style={styles.auditHeader}>
          <Text style={styles.sectionLabel}>Daily Audit</Text>
        </View>

        {AUDIT_TASKS.map(task => (
          <View key={task.id} style={[styles.auditCard, clayCard, !task.done && styles.auditCardPending]}>
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
              onBlur={handleTitleBlur}
            />
            {estimating && (
              <Text style={{ fontSize: 10, fontWeight: '700', color: SAGE, marginTop: -8, marginBottom: 12, marginLeft: 4 }}>
                ✨ AI Estimating rewards...
              </Text>
            )}
            {aiReasoning && !estimating && (
              <Text style={{ fontSize: 10, fontWeight: '600', color: `${CHR}50`, marginTop: -8, marginBottom: 12, marginLeft: 4, fontStyle: 'italic' }}>
                Judge's Note: {aiReasoning}
              </Text>
            )}

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

            {/* Wager */}
            <Text style={styles.fieldLabel}>Doomsday Wager</Text>
            <View style={styles.catRow}>
              {([0, 50, 100, 200] as const).map(wager => (
                <Pressable
                  key={wager}
                  style={[styles.catPill, newWager === wager && styles.catPillActive]}
                  onPress={() => setNewWager(wager)}
                >
                  <Text style={[styles.catText, newWager === wager && { color: '#fff' }]}>{wager === 0 ? 'None' : `${wager} pts`}</Text>
                </Pressable>
              ))}
            </View>

            {/* Points */}
            <Text style={styles.fieldLabel}>Reward Points</Text>
            <TextInput
              style={styles.fieldInput}
              placeholder="20"
              placeholderTextColor={`${CHR}35`}
              value={newPts}
              onChangeText={setNewPts}
              keyboardType="numeric"
            />

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
  },
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
  });
};
