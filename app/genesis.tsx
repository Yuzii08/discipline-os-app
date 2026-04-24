import React, { useEffect } from 'react';
import {
  View, Text, StyleSheet, TextInput, Pressable,
  KeyboardAvoidingView, Platform, ScrollView, Dimensions
} from 'react-native';
import { useRouter } from 'expo-router';
import { useOnboardingStore } from '../store/useOnboardingStore';
import { useUserStore } from '../store/useUserStore';
import { supabase } from '../services/supabase';
import {
  ArrowRight, Brain, Briefcase, Dumbbell, Sparkles,
  BookOpen, TrendingUp, CheckCircle2, Circle
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Animated, {
  useAnimatedStyle, useSharedValue, withTiming,
  runOnJS
} from 'react-native-reanimated';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import { Shadow } from 'react-native-shadow-2';
import { useThemeStyles } from '../hooks/use-theme-styles';

// ─────────────────────────────────────────────
//  QUESTION CONFIG — Edit here to change questions
//  Values are what get sent to the AI prompt
// ─────────────────────────────────────────────

const Q1_OPTIONS = [
  {
    id: 'exam',
    label: 'Exam preparation',
    sublabel: 'JEE / NEET / UPSC / Boards / Any exam',
    placeholder: 'Which exam? What are your weakest topics?',
    // AI receives: "Exam preparation — [their input]"
  },
  {
    id: 'coding',
    label: 'Coding or building something',
    sublabel: 'App, project, freelance, open source',
    placeholder: 'What are you building? Where are you stuck?',
  },
  {
    id: 'fitness',
    label: 'Physical fitness',
    sublabel: 'Gym, running, weight loss, sport, health',
    placeholder: 'What is your specific target or goal?',
  },
  {
    id: 'skill',
    label: 'Learning a new skill',
    sublabel: 'Language, music, design, writing, anything',
    placeholder: 'What skill? What is your current level?',
  },
  {
    id: 'career',
    label: 'Career or business',
    sublabel: 'Startup, content creation, job prep, growth',
    placeholder: 'What is the specific outcome you are chasing?',
  },
];

const Q2_OPTIONS = [
  {
    id: 'starting_out',
    label: 'Just starting out',
    sublabel: 'I have not built the habit yet',
    // AI gets this exact string — calibrates to beginner, short tasks
    aiValue: 'complete beginner with no established routine — needs short, low-friction tasks to build momentum',
  },
  {
    id: 'barely',
    label: 'Barely showing up',
    sublabel: 'I try but keep breaking my own plans',
    aiValue: 'inconsistent beginner who starts but falls off — needs quick wins and habit anchors',
  },
  {
    id: 'okayish',
    label: 'Getting there',
    sublabel: '2 to 3 days a week, then I fall off',
    aiValue: 'intermediate who is inconsistent — needs a balance of short wins and one bigger challenge block',
  },
  {
    id: 'decent',
    label: 'Fairly consistent',
    sublabel: 'I show up most days but could be sharper',
    aiValue: 'intermediate with decent consistency — ready to be pushed slightly harder with realistic volume',
  },
  {
    id: 'locked_in',
    label: 'Locked in',
    sublabel: 'I want to operate at the highest level',
    aiValue: 'advanced and highly consistent — wants elite intensity, full 90-min deep work blocks, no hand-holding',
  },
];

const Q3_OPTIONS = [
  {
    id: 'phone',
    label: 'Phone and social media',
    sublabel: 'I get pulled into reels, scrolling, chats',
    placeholder: 'Which app or habit is the worst offender?',
    aiValue: 'phone and social media addiction',
  },
  {
    id: 'procrastination',
    label: 'I never start',
    sublabel: 'I delay until it is too late, then feel guilty',
    placeholder: 'What does the delay look like? What triggers it?',
    aiValue: 'chronic procrastination and task avoidance',
  },
  {
    id: 'energy',
    label: 'Low energy or motivation',
    sublabel: 'I feel tired, drained, or just unmotivated',
    placeholder: 'What is the root cause? Sleep, stress, burnout?',
    aiValue: 'low energy and lack of motivation',
  },
  {
    id: 'no_plan',
    label: 'No clear plan',
    sublabel: 'I sit down and do not know what to actually do',
    placeholder: 'Describe what that moment of confusion looks like',
    aiValue: 'lack of clarity and no structured plan',
  },
  {
    id: 'momentum',
    label: 'I lose steam halfway',
    sublabel: 'I start strong but drift after day 2 or 3',
    placeholder: 'When exactly does it fall apart?',
    aiValue: 'loss of momentum and consistency after initial effort',
  },
  {
    id: 'environment',
    label: 'My environment kills focus',
    sublabel: 'Noise, family, bad workspace, interruptions',
    placeholder: 'What specifically disrupts you most?',
    aiValue: 'disruptive environment and external interruptions',
  },
];

// ─────────────────────────────────────────────
//  FALLBACK MISSION BUILDER (offline / AI fail)
// ─────────────────────────────────────────────
function buildFallbackMissions(
  objective: string,
  disciplineLevel: string,
  enemy: string,
  allocation: { body: number; mind: number; work: number }
): any[] {
  const total = 300;
  const bodyMins = Math.round((allocation.body / 100) * total) || 60;
  const mindMins = Math.round((allocation.mind / 100) * total) || 90;
  const workMins = total - bodyMins - mindMins;

  return [
    {
      category: 'BODY',
      title: 'Physical Activation Block',
      duration: bodyMins,
      logic: 'Physical foundation. Primes the nervous system for deep focus.',
    },
    {
      category: 'MIND',
      title: 'Deep Focus Sprint — Core Skill',
      duration: mindMins,
      logic: 'Core skill acquisition aligned with the primary objective.',
    },
    {
      category: 'WORK',
      title: 'High-Leverage Execution Sprint',
      duration: workMins,
      logic: 'Direct output toward the primary goal.',
    },
    {
      category: 'MIND',
      title: `Counter-Strike: Neutralize ${enemy}`,
      duration: 0,
      logic: `Neutralises the biggest focus killer before it strikes.`,
    },
  ];
}

// ─────────────────────────────────────────────
//  SLIDER DIMENSIONS
// ─────────────────────────────────────────────
const { width } = Dimensions.get('window');
const SLIDER_WIDTH = width - 80;

// ─────────────────────────────────────────────
//  CLAY SLIDER
// ─────────────────────────────────────────────
const ClaySlider = ({ label, color, icon: Icon, value, mins, onChange }: any) => {
  const { styles, clay } = useThemeStyles(createStyles);
  const progressX = useSharedValue((value / 100) * SLIDER_WIDTH);
  const startX = useSharedValue(0);

  useEffect(() => {
    progressX.value = withTiming((value / 100) * SLIDER_WIDTH, { duration: 200 });
  }, [value, progressX]);

  const panGesture = Gesture.Pan()
    .onStart(() => {
      startX.value = progressX.value;
      runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Light);
    })
    .onUpdate((event) => {
      let newX = Math.max(0, Math.min(SLIDER_WIDTH, startX.value + event.translationX));
      progressX.value = newX;
      runOnJS(onChange)(Math.round((newX / SLIDER_WIDTH) * 100));
    })
    .onEnd(() => {
      runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Medium);
    });

  const fillStyle = useAnimatedStyle(() => ({ width: progressX.value, backgroundColor: color }));
  const knobStyle = useAnimatedStyle(() => ({ transform: [{ translateX: progressX.value - 16 }] }));

  return (
    <View style={styles.sliderContainer}>
      <View style={styles.sliderHeader}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Icon size={18} color={color} strokeWidth={2.5} />
          <Text style={styles.sliderLabel}>{label}</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
          <Text style={[styles.sliderValue, { color }]}>{value}%</Text>
          <Text style={styles.sliderMins}>{mins}min</Text>
        </View>
      </View>
      <View style={styles.sliderTrackWrap}>
        <View style={styles.sliderTrackBg} />
        <Animated.View style={[styles.sliderTrackFill, fillStyle]} />
        <GestureDetector gesture={panGesture}>
          <Animated.View style={[styles.sliderKnob, knobStyle, clay.clayCard]} />
        </GestureDetector>
      </View>
    </View>
  );
};

// ─────────────────────────────────────────────
//  CHOICE CHIP — now shows sublabel
// ─────────────────────────────────────────────
const ChoiceChip = ({ label, sublabel, selected, onSelect, children }: any) => {
  const { styles, tokens } = useThemeStyles(createStyles);
  const { SAGE, CHR, BG, isDark } = tokens;

  return (
    <Shadow
      distance={selected ? 4 : 2}
      startColor={selected ? `${SAGE}40` : `#B8B2A520`}
      offset={selected ? [0, 4] : [2, 2]}
      style={{ width: '100%', borderRadius: 16, marginBottom: 10 }}
    >
      <View style={[
        styles.choiceChip,
        selected
          ? styles.choiceChipSelected
          : { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#F3EFE6', borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(215,205,195,0.5)' },
        { marginBottom: 0, flexDirection: 'column', alignItems: 'stretch' }
      ]}>
        <Pressable onPress={onSelect} style={styles.choiceChipRow}>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              {selected
                ? <CheckCircle2 size={20} color={SAGE} strokeWidth={2.5} />
                : <Circle size={20} color={`${CHR}40`} strokeWidth={2.5} />
              }
              <View style={{ flex: 1 }}>
                <Text style={[styles.choiceChipText, selected && { color: CHR, fontWeight: '800' }]}>
                  {label}
                </Text>
                {sublabel ? (
                  <Text style={styles.choiceChipSublabel}>{sublabel}</Text>
                ) : null}
              </View>
            </View>
          </View>
        </Pressable>
        {selected && children && (
          <View style={{ marginTop: 14, width: '100%' }}>{children}</View>
        )}
      </View>
    </Shadow>
  );
};

// ─────────────────────────────────────────────
//  MAIN SCREEN
// ─────────────────────────────────────────────
export default function GenesisOnboardingScreen() {
  const { tokens, styles, clay } = useThemeStyles(createStyles);
  const { BG, CHR, SAGE, TERR, MUST } = tokens;
  const router = useRouter();
  const store = useOnboardingStore();
  const { profile } = useUserStore();
  const [genError, setGenError] = React.useState<string | null>(null);

  // Per-question custom inputs — no more shared state bug
  const [q1Detail, setQ1Detail] = React.useState('');
  const [q3Detail, setQ3Detail] = React.useState('');

  const selectedQ1 = Q1_OPTIONS.find(o => o.id === store.mcqAnswers.q1);
  const selectedQ2 = Q2_OPTIONS.find(o => o.id === store.mcqAnswers.q2);
  const selectedQ3 = Q3_OPTIONS.find(o => o.id === store.mcqAnswers.q3);

  const handleNextGoal = () => {
    if (!store.mcqAnswers.q1 || !store.mcqAnswers.q2 || !store.mcqAnswers.q3) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    store.setStep(2);
  };

  const handleGenerate = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    store.setStep(3);
    store.setIsGenerating(true);
    setGenError(null);

    // ── Build clean, AI-optimized strings ──
    const primaryObjective = selectedQ1?.label ?? store.mcqAnswers.q1;
    const userAims = q1Detail.trim()
      ? `${primaryObjective} — specifically: ${q1Detail.trim()}`
      : primaryObjective;
    const disciplineLevel = selectedQ2?.aiValue ?? store.mcqAnswers.q2;
    const biggestEnemy = selectedQ3?.aiValue ?? store.mcqAnswers.q3;
    const enemyDetail = q3Detail.trim()
      ? `${biggestEnemy} — specifically: ${q3Detail.trim()}`
      : biggestEnemy;

    let missions: any[] | null = null;

    try {
      console.log('[Genesis] Invoking AI Edge Function...');
      
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      
      console.log('[Genesis] Has Auth Token:', !!token);

      const res = await supabase.functions.invoke('generate-initial-protocol', {
        body: {
          primaryObjective,
          userAims,
          disciplineLevel,
          biggestEnemy,
          enemyDetail,
          allocation: store.allocation,
        },
        headers: token ? { Authorization: `Bearer ${token}` } : undefined
      });

      console.log('[Genesis] Invoke Response Data:', res.data);
      if (res.error) {
         console.error('[Genesis] Invoke Response Error:', res.error);
      }

      if (res.data?.missions && Array.isArray(res.data.missions) && res.data.missions.length > 0) {
        missions = res.data.missions;
      }
    } catch (err) {
      console.error('[Genesis] AI invoke hard catch failed:', err);
    }

    if (!missions || missions.length === 0) {
      missions = buildFallbackMissions(userAims, disciplineLevel, biggestEnemy, store.allocation);
    }

    store.setGeneratedMissions(missions);
    store.setIsGenerating(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleAcceptProtocol = async () => {
    if (!profile) { router.replace('/(tabs)'); return; }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    try {
      const inserts = store.generatedMissions.map((m: any) => ({
        user_id: profile.user_id,
        category: m.category,
        difficulty: 'MEDIUM',
        mission_type: 'TASK',
        title: m.title,
        expected_duration_mins: m.duration || 30,
        base_reward_points: 30,
        is_recurring: true,
      }));

      const { data: missionData, error: missionErr } = await supabase
        .from('missions')
        .insert(inserts as any)
        .select();

      if (!missionErr && missionData) {
        const todayStr = new Date().toISOString().split('T')[0];
        const completions = missionData.map((m) => ({
          mission_id: m.mission_id,
          user_id: profile.user_id,
          target_date: todayStr,
          status: 'PENDING',
        }));
        await supabase.from('mission_completions').insert(completions);
      }
    } catch (err) {
      console.error('Saving missions failed:', err);
    }

    store.reset();
    router.replace('/(tabs)');
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

        {/* ══════════════ STEP 1: QUESTIONS ══════════════ */}
        {store.step === 1 && (
          <View style={styles.stepContainer}>
            <View style={[styles.iconWrap, clay.clayCard]}>
              <Sparkles size={32} color={CHR} strokeWidth={2} />
            </View>
            <Text style={styles.title}>Set Your Vector</Text>
            <Text style={styles.subtitle}>
              Answer honestly. Your protocol is only as good as this input.
            </Text>

            <View style={styles.mcqSection}>

              {/* ── Q1: WHAT ARE YOU WORKING ON ── */}
              <Text style={styles.mcqLabel}>1. WHAT ARE YOU WORKING ON?</Text>
              {Q1_OPTIONS.map((opt) => (
                <ChoiceChip
                  key={opt.id}
                  label={opt.label}
                  sublabel={opt.sublabel}
                  selected={store.mcqAnswers.q1 === opt.id}
                  onSelect={() => {
                    store.setMcqAnswer('q1', opt.id);
                    setQ1Detail(''); // reset detail when switching
                  }}
                >
                  <TextInput
                    style={styles.customInput}
                    placeholder={opt.placeholder}
                    placeholderTextColor={`${CHR}50`}
                    value={q1Detail}
                    onChangeText={setQ1Detail}
                    multiline
                  />
                </ChoiceChip>
              ))}

              {/* ── Q2: CONSISTENCY LEVEL ── */}
              <Text style={[styles.mcqLabel, { marginTop: 28 }]}>
                2. HOW CONSISTENT HAVE YOU BEEN LATELY?
              </Text>
              {Q2_OPTIONS.map((opt) => (
                <ChoiceChip
                  key={opt.id}
                  label={opt.label}
                  sublabel={opt.sublabel}
                  selected={store.mcqAnswers.q2 === opt.id}
                  onSelect={() => store.setMcqAnswer('q2', opt.id)}
                />
              ))}

              {/* ── Q3: BIGGEST FOCUS KILLER ── */}
              <Text style={[styles.mcqLabel, { marginTop: 28 }]}>
                3. WHAT KILLS YOUR FOCUS MOST?
              </Text>
              {Q3_OPTIONS.map((opt) => (
                <ChoiceChip
                  key={opt.id}
                  label={opt.label}
                  sublabel={opt.sublabel}
                  selected={store.mcqAnswers.q3 === opt.id}
                  onSelect={() => {
                    store.setMcqAnswer('q3', opt.id);
                    setQ3Detail(''); // reset detail when switching
                  }}
                >
                  <TextInput
                    style={styles.customInput}
                    placeholder={opt.placeholder}
                    placeholderTextColor={`${CHR}50`}
                    value={q3Detail}
                    onChangeText={setQ3Detail}
                    multiline
                  />
                </ChoiceChip>
              ))}
            </View>

            <Pressable
              style={[
                styles.primaryBtn,
                (!store.mcqAnswers.q1 || !store.mcqAnswers.q2 || !store.mcqAnswers.q3) && { opacity: 0.4 }
              ]}
              onPress={handleNextGoal}
            >
              <Text style={styles.primaryBtnText}>Set Energy Split</Text>
              <ArrowRight size={20} color={BG} strokeWidth={2.5} />
            </Pressable>
          </View>
        )}

        {/* ══════════════ STEP 2: SLIDERS ══════════════ */}
        {store.step === 2 && (
          <View style={styles.stepContainer}>
            <View style={[styles.iconWrap, clay.clayCard]}>
              <Brain size={32} color={SAGE} strokeWidth={2} />
            </View>
            <Text style={styles.title}>Split Your Energy</Text>
            <Text style={styles.subtitle}>
              You have 300 minutes. Allocate them across your three pillars.
            </Text>

            <View style={{ width: '100%', gap: 24, marginBottom: 40 }}>
              <ClaySlider
                label="BODY"
                color={TERR}
                icon={Dumbbell}
                value={store.allocation.body}
                mins={Math.round((store.allocation.body / 100) * 300)}
                onChange={(v: number) => store.setAllocation('body', v)}
              />
              <ClaySlider
                label="MIND"
                color={SAGE}
                icon={Brain}
                value={store.allocation.mind}
                mins={Math.round((store.allocation.mind / 100) * 300)}
                onChange={(v: number) => store.setAllocation('mind', v)}
              />
              <ClaySlider
                label="WORK"
                color={MUST}
                icon={Briefcase}
                value={store.allocation.work}
                mins={Math.round((store.allocation.work / 100) * 300)}
                onChange={(v: number) => store.setAllocation('work', v)}
              />
            </View>

            <Pressable style={styles.primaryBtn} onPress={handleGenerate}>
              <Text style={styles.primaryBtnText}>Build My Protocol</Text>
              <Sparkles size={20} color={BG} strokeWidth={2.5} />
            </Pressable>
          </View>
        )}

        {/* ══════════════ STEP 3: GENERATION / REVEAL ══════════════ */}
        {store.step === 3 && (
          <View style={styles.stepContainer}>
            {store.isGenerating ? (
              <>
                <View style={[styles.iconWrap, clay.clayCard]}>
                  <Sparkles size={32} color={MUST} strokeWidth={2} />
                </View>
                <Text style={styles.title}>Building Your Protocol</Text>
                <Text style={styles.subtitle}>
                  The Performance Coach is analysing your vector...
                </Text>
              </>
            ) : (
              <>
                <View style={[styles.iconWrap, clay.clayCard]}>
                  <CheckCircle2 size={32} color={SAGE} strokeWidth={2} />
                </View>
                <Text style={styles.title}>Protocol Ready</Text>
                <Text style={styles.subtitle}>
                  Your personalised missions have been generated.
                </Text>

                <View style={{ width: '100%', gap: 12, marginBottom: 40 }}>
                  {store.generatedMissions.map((m: any, i: number) => (
                    <View key={i} style={[styles.missionCard, clay.clayCard]}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                        <Text style={[styles.missionCategory, {
                          color: m.category === 'BODY' ? TERR : m.category === 'MIND' ? SAGE : MUST
                        }]}>
                          {m.category}
                        </Text>
                        {m.duration > 0 && (
                          <Text style={styles.missionDuration}>{m.duration} min</Text>
                        )}
                      </View>
                      <Text style={styles.missionTitle}>{m.title}</Text>
                      {m.logic ? (
                        <Text style={styles.missionLogic}>{m.logic}</Text>
                      ) : null}
                    </View>
                  ))}
                </View>

                <Pressable style={styles.primaryBtn} onPress={handleAcceptProtocol}>
                  <Text style={styles.primaryBtnText}>Accept Protocol</Text>
                  <ArrowRight size={20} color={BG} strokeWidth={2.5} />
                </Pressable>
              </>
            )}
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ─────────────────────────────────────────────
//  STYLES
// ─────────────────────────────────────────────
const createStyles = (tokens: any) => {
  const { BG, CHR, SAGE, TERR, MUST } = tokens;
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: BG },
    scroll: { flexGrow: 1, paddingHorizontal: 32, paddingVertical: 60 },
    stepContainer: { flex: 1, alignItems: 'center' },
    iconWrap: { width: 80, height: 80, borderRadius: 28, alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
    title: { fontSize: 32, fontWeight: '900', color: CHR, textAlign: 'center', marginBottom: 8 },
    subtitle: { fontSize: 14, color: `${CHR}70`, textAlign: 'center', marginBottom: 40, lineHeight: 20 },
    mcqSection: { width: '100%', marginBottom: 40 },
    mcqLabel: { fontSize: 11, fontWeight: '900', color: `${CHR}60`, letterSpacing: 1.5, marginBottom: 12 },

    // Choice chip
    choiceChip: { width: '100%', padding: 16, borderRadius: 16, marginBottom: 10 },
    choiceChipSelected: { backgroundColor: BG, borderColor: SAGE, borderWidth: 2 },
    choiceChipRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
    choiceChipText: { fontSize: 15, fontWeight: '600', color: `${CHR}80` },
    choiceChipSublabel: { fontSize: 12, color: `${CHR}50`, marginTop: 2 },

    // Input
    customInput: {
      backgroundColor: 'rgba(61,64,91,0.05)',
      borderRadius: 12,
      padding: 12,
      color: CHR,
      fontSize: 14,
      lineHeight: 20,
      minHeight: 44,
    },

    // Sliders
    sliderContainer: { width: '100%' },
    sliderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    sliderLabel: { fontSize: 13, fontWeight: '800', color: CHR, letterSpacing: 1 },
    sliderValue: { fontSize: 18, fontWeight: '900' },
    sliderMins: { fontSize: 12, color: `${CHR}50` },
    sliderTrackWrap: { height: 32, justifyContent: 'center', position: 'relative' },
    sliderTrackBg: { position: 'absolute', left: 0, right: 0, height: 8, borderRadius: 4, backgroundColor: `${CHR}12` },
    sliderTrackFill: { position: 'absolute', left: 0, height: 8, borderRadius: 4 },
    sliderKnob: { position: 'absolute', width: 32, height: 32, borderRadius: 16 },

    // Mission cards
    missionCard: { width: '100%', padding: 16, borderRadius: 16 },
    missionCategory: { fontSize: 10, fontWeight: '900', letterSpacing: 1.5 },
    missionDuration: { fontSize: 12, color: `${CHR}50`, fontWeight: '700' },
    missionTitle: { fontSize: 15, fontWeight: '700', color: CHR, marginTop: 2, lineHeight: 20 },
    missionLogic: { fontSize: 12, color: `${CHR}55`, marginTop: 6, lineHeight: 17 },

    // Button
    primaryBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, width: '100%', height: 64, borderRadius: 24, backgroundColor: CHR },
    primaryBtnText: { color: BG, fontSize: 16, fontWeight: '900' },
  });
};
