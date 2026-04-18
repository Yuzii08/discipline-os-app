import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, KeyboardAvoidingView, Platform, ScrollView, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { useOnboardingStore } from '../store/useOnboardingStore';
import { useUserStore } from '../store/useUserStore';
import { supabase } from '../services/supabase';
import { ArrowRight, Brain, Briefcase, Dumbbell, Sparkles, CheckCircle2, Circle } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Animated, { useAnimatedStyle, useSharedValue, withTiming, withRepeat, Easing, runOnJS } from 'react-native-reanimated';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import { Shadow } from 'react-native-shadow-2';

// ── CLIENT-SIDE FALLBACK: generates missions locally if AI is unreachable ──
function buildFallbackMissions(
  objective: string,
  disciplineLevel: string,
  enemy: string,
  allocation: { body: number; mind: number; work: number }
): any[] {
  const isPhysical = /physical|fitness|gym|workout/i.test(objective);
  const isStudy = /exam|jee|neet|study|board/i.test(objective);
  const total = 300;
  const bodyMins = Math.round((allocation.body / 100) * total) || (isPhysical ? 90 : 60);
  const mindMins = Math.round((allocation.mind / 100) * total) || (isStudy ? 120 : 90);
  const workMins = total - bodyMins - mindMins;
  const enemyTask = enemy.toLowerCase().includes('scroll') || enemy.toLowerCase().includes('phone')
    ? 'Phone Lockdown — Device in Another Room'
    : enemy.toLowerCase().includes('burn') || enemy.toLowerCase().includes('energy')
    ? 'Recharge Protocol — 20-min Power Nap + Hydration'
    : enemy.toLowerCase().includes('think') || enemy.toLowerCase().includes('paralysis')
    ? '2-Minute Decision Drill — Just Start'
    : 'Distraction Counter-Strike — Focus Mode On';

  return [
    {
      category: 'BODY',
      title: isPhysical ? 'Resistance Block — No Excuses' : 'Morning Activation Protocol',
      duration: bodyMins,
      logic: 'Physical foundation. Primes the nervous system for deep focus.',
    },
    {
      category: 'MIND',
      title: isStudy ? 'Active Recall Deep Session' : 'Strategic Learning Block',
      duration: mindMins,
      logic: 'Core skill acquisition aligned with the primary objective.',
    },
    {
      category: 'WORK',
      title: 'High-Leverage Execution Sprint',
      duration: workMins,
      logic: 'Direct output toward the primary goal. No distractions tolerated.',
    },
    {
      category: 'MIND',
      title: enemyTask,
      duration: 0,
      logic: `Neutralises your biggest enemy (${enemy}) before it strikes.`,
    },
  ];
}

const { width } = Dimensions.get('window');
const SLIDER_WIDTH = width - 80; // Padding 40 on each side

const BG = '#F9F7F2';
const CHR = '#3D405B';
const SAGE = '#81B29A';
const TERR = '#E07A5F';
const MUST = '#F2CC8F';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const clayInner = {
  backgroundColor: '#F3EFE6',
  shadowColor: '#FFFFFF',
  shadowOffset: { width: -4, height: -4 },
  shadowOpacity: 0.8,
  shadowRadius: 8,
  elevation: -5,
  borderWidth: 1,
  borderColor: 'rgba(215, 205, 195, 0.5)',
};

const clayLifted = {
  backgroundColor: BG,
  shadowColor: '#B8B2A5',
  shadowOffset: { width: 6, height: 8 },
  shadowOpacity: 0.4,
  shadowRadius: 16,
  elevation: 8,
  borderWidth: 1,
  borderColor: 'rgba(255,255,255,0.7)',
};

// ── CUSTOM CLAY SLIDER COMPONENT ──
const ClaySlider = ({ 
  label, 
  color, 
  icon: Icon, 
  value,
  mins,
  onChange 
}: { 
  label: string, color: string, icon: any, value: number, mins: number, onChange: (val: number) => void 
}) => {
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
      let newX = startX.value + event.translationX;
      if (newX < 0) newX = 0;
      if (newX > SLIDER_WIDTH) newX = SLIDER_WIDTH;
      progressX.value = newX;
      const pct = Math.round((newX / SLIDER_WIDTH) * 100);
      runOnJS(onChange)(pct);
    })
    .onEnd(() => {
      runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Medium);
    });

  const fillStyle = useAnimatedStyle(() => ({
    width: progressX.value,
    backgroundColor: color,
  }));

  const knobStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: progressX.value - 16 }] // center knob
  }));

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
          <Animated.View style={[styles.sliderKnob, knobStyle, clayLifted]} />
        </GestureDetector>
      </View>
    </View>
  );
};

// ── CHOICE CHIP COMPONENT (MCQ) ──
const ChoiceChip = ({ 
  label, 
  selected, 
  onSelect,
  children
}: { 
  label: string, selected: boolean, onSelect: () => void, children?: React.ReactNode 
}) => {
  return (
    <Shadow 
      distance={selected ? 4 : 2} 
      startColor={selected ? `${SAGE}40` : `#B8B2A520`} 
      offset={selected ? [0, 4] : [2, 2]} 
      style={{ width: '100%', borderRadius: 16, marginBottom: 10 }}
    >
      <View
        style={[
          styles.choiceChip,
          selected ? styles.choiceChipSelected : { backgroundColor: '#F3EFE6', borderWidth: 1, borderColor: 'rgba(215, 205, 195, 0.5)' },
          { marginBottom: 0, flexDirection: 'column', alignItems: 'stretch' }
        ]}
      >
        <Pressable onPress={onSelect} style={styles.choiceChipRow}>
          {selected ? (
            <CheckCircle2 size={20} color={SAGE} strokeWidth={2.5} />
          ) : (
            <Circle size={20} color={`${CHR}40`} strokeWidth={2.5} />
          )}
          <Text style={[styles.choiceChipText, selected && { color: CHR, fontWeight: '800' }]}>
            {label}
          </Text>
        </Pressable>
        {selected && children && (
          <View style={{ marginTop: 16, width: '100%' }}>
            {children}
          </View>
        )}
      </View>
    </Shadow>
  );
};



export default function GenesisOnboardingScreen() {
  const router = useRouter();
  const store = useOnboardingStore();
  const { profile } = useUserStore();
  const [genError, setGenError] = React.useState<string | null>(null);
  
  const [customObjective, setCustomObjective] = React.useState("");
  const [customEnemy, setCustomEnemy] = React.useState("");

  const handleNextGoal = () => {
    const { q1, q2, q3 } = store.mcqAnswers;
    if (!q1 || !q2 || !q3) {
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

    const combinedObjective = customObjective.trim()
      ? `${store.mcqAnswers.q1}: [${customObjective.trim()}]`
      : store.mcqAnswers.q1;
    const combinedEnemy = customEnemy.trim()
      ? `${store.mcqAnswers.q3}: [${customEnemy.trim()}]`
      : store.mcqAnswers.q3;

    let missions: any[] | null = null;

    // ── Try the AI edge function ──
    try {
      const { data, error } = await supabase.functions.invoke('generate-initial-protocol', {
        body: {
          primaryObjective: store.mcqAnswers.q1,
          userAims: customObjective.trim() || 'General Improvement',
          disciplineLevel: store.mcqAnswers.q2,
          biggestEnemy: combinedEnemy,
          allocation: store.allocation,
          userContext: { name: profile?.username || 'Operator', interests: 'Elite Performance' },
        },
      });

      if (error) console.warn('[Genesis] Edge function error (non-fatal):', error);

      if (data?.missions && Array.isArray(data.missions) && data.missions.length > 0) {
        missions = data.missions;
      }
    } catch (err) {
      console.warn('[Genesis] Network/invoke failed (non-fatal):', err);
    }

    // ── Always fall back to local builder if AI gave nothing ──
    if (!missions || missions.length === 0) {
      console.log('[Genesis] Using client-side fallback missions.');
      missions = buildFallbackMissions(
        combinedObjective,
        store.mcqAnswers.q2 || 'Recruit',
        combinedEnemy,
        store.allocation
      );
    }

    store.setGeneratedMissions(missions);
    store.setIsGenerating(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleAcceptProtocol = async () => {
    if (!profile) {
      router.replace('/(tabs)');
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    // Save generated missions to Supabase
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
      
      const { data: missionData, error: missionErr } = await supabase.from('missions').insert(inserts as any).select();
      
      if (!missionErr && missionData) {
        // Automatically append to today's dashboard
        const todayStr = new Date().toISOString().split('T')[0];
        const completions = missionData.map((m) => ({
           mission_id: m.mission_id,
           user_id: profile.user_id,
           target_date: todayStr,
           status: 'PENDING',
           points_earned: 0
        }));
        await supabase.from('mission_completions').insert(completions);
      }

    } catch (err) {
      console.error("Saving missions failed:", err);
    }

    store.reset();
    router.replace('/(tabs)');
  };

  // ── 3D Master Architect (Zen Stone) Animation ──
  const rotateVal = useSharedValue(0);
  const floatVal = useSharedValue(0);

  useEffect(() => {
    if (store.isGenerating) {
      rotateVal.value = withRepeat(withTiming(360, { duration: 4000, easing: Easing.linear }), -1, false);
      floatVal.value = withRepeat(withTiming(-20, { duration: 1500, easing: Easing.inOut(Easing.ease) }), -1, true);
    }
  }, [store.isGenerating, rotateVal, floatVal]);

  const architectStyle = useAnimatedStyle(() => ({
    transform: [
      { rotateZ: `${rotateVal.value}deg` },
      { translateY: floatVal.value }
    ]
  }));

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {/* Dynamic Background Noise/Filter Placeholder (We use simple color) */}
      <View style={StyleSheet.absoluteFillObject} pointerEvents="none" />

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {store.step === 1 && (
          <View style={styles.stepContainer}>
            <View style={[styles.iconWrap, clayLifted]}>
              <Sparkles size={32} color={CHR} strokeWidth={2} />
            </View>
            <Text style={styles.title}>Set Your Vector</Text>
            <Text style={styles.subtitle}>Answer honestly. Your protocol is only as good as this input.</Text>
            <View style={styles.mcqSection}>

              <Text style={styles.mcqLabel}>1. WHAT ARE YOU WORKING ON?</Text>
              <ChoiceChip label="Exam prep — JEE / NEET / UPSC / Boards" selected={store.mcqAnswers.q1 === 'Exam prep'} onSelect={() => store.setMcqAnswer('q1', 'Exam prep')}>
                <TextInput style={styles.customInput} placeholder="Which exam + weak subjects? (e.g., JEE 2026, weak in Maths)" placeholderTextColor={`${CHR}60`} value={customObjective} onChangeText={setCustomObjective} />
              </ChoiceChip>
              <ChoiceChip label="Coding / Building something — app, project, freelancing" selected={store.mcqAnswers.q1 === 'Coding'} onSelect={() => store.setMcqAnswer('q1', 'Coding')}>
                <TextInput style={styles.customInput} placeholder="What are you building? (e.g., React Native app, Python bot)" placeholderTextColor={`${CHR}60`} value={customObjective} onChangeText={setCustomObjective} />
              </ChoiceChip>
              <ChoiceChip label="Physical fitness — gym, running, weight loss, sport" selected={store.mcqAnswers.q1 === 'Fitness'} onSelect={() => store.setMcqAnswer('q1', 'Fitness')}>
                <TextInput style={styles.customInput} placeholder="Your target? (e.g., lose 8kg, run 5km, build muscle)" placeholderTextColor={`${CHR}60`} value={customObjective} onChangeText={setCustomObjective} />
              </ChoiceChip>
              <ChoiceChip label="Learning a new skill — language, music, design, writing" selected={store.mcqAnswers.q1 === 'Skill'} onSelect={() => store.setMcqAnswer('q1', 'Skill')}>
                <TextInput style={styles.customInput} placeholder="What skill + current level? (e.g., Spanish, beginner)" placeholderTextColor={`${CHR}60`} value={customObjective} onChangeText={setCustomObjective} />
              </ChoiceChip>
              <ChoiceChip label="Career / Business — startup, content creation, job prep" selected={store.mcqAnswers.q1 === 'Career'} onSelect={() => store.setMcqAnswer('q1', 'Career')}>
                <TextInput style={styles.customInput} placeholder="What's the goal? (e.g., land a dev job, grow YouTube)" placeholderTextColor={`${CHR}60`} value={customObjective} onChangeText={setCustomObjective} />
              </ChoiceChip>

              <Text style={[styles.mcqLabel, { marginTop: 24 }]}>2. HOW CONSISTENT HAVE YOU BEEN LATELY?</Text>
              <ChoiceChip label="Barely — I keep breaking my own plans" selected={store.mcqAnswers.q2 === 'Barely consistent'} onSelect={() => store.setMcqAnswer('q2', 'Barely consistent')} />
              <ChoiceChip label="Okay-ish — 2 to 3 days a week, then I fall off" selected={store.mcqAnswers.q2 === 'Somewhat consistent'} onSelect={() => store.setMcqAnswer('q2', 'Somewhat consistent')} />
              <ChoiceChip label="Decent — I show up most days but could be sharper" selected={store.mcqAnswers.q2 === 'Mostly consistent'} onSelect={() => store.setMcqAnswer('q2', 'Mostly consistent')} />
              <ChoiceChip label="Very consistent — I want to push to the next level" selected={store.mcqAnswers.q2 === 'Very consistent'} onSelect={() => store.setMcqAnswer('q2', 'Very consistent')} />

              <Text style={[styles.mcqLabel, { marginTop: 24 }]}>3. WHAT KILLS YOUR FOCUS MOST?</Text>
              <ChoiceChip label="Phone / social media — Instagram, YouTube, reels" selected={store.mcqAnswers.q3 === 'Phone distraction'} onSelect={() => store.setMcqAnswer('q3', 'Phone distraction')}>
                <TextInput style={styles.customInput} placeholder="Which app is worst? (e.g., Instagram, YouTube Shorts)" placeholderTextColor={`${CHR}60`} value={customEnemy} onChangeText={setCustomEnemy} />
              </ChoiceChip>
              <ChoiceChip label="I never start — I procrastinate until it's too late" selected={store.mcqAnswers.q3 === 'Procrastination'} onSelect={() => store.setMcqAnswer('q3', 'Procrastination')}>
                <TextInput style={styles.customInput} placeholder="What triggers it? (e.g., open phone first thing, fear of failing)" placeholderTextColor={`${CHR}60`} value={customEnemy} onChangeText={setCustomEnemy} />
              </ChoiceChip>
              <ChoiceChip label="Low energy — I'm tired, unmotivated, or sleep-deprived" selected={store.mcqAnswers.q3 === 'Low energy'} onSelect={() => store.setMcqAnswer('q3', 'Low energy')}>
                <TextInput style={styles.customInput} placeholder="Root cause? (e.g., sleeping at 2am, skipping meals)" placeholderTextColor={`${CHR}60`} value={customEnemy} onChangeText={setCustomEnemy} />
              </ChoiceChip>
              <ChoiceChip label="No clear plan — I sit down and don't know what to do" selected={store.mcqAnswers.q3 === 'No plan'} onSelect={() => store.setMcqAnswer('q3', 'No plan')}>
                <TextInput style={styles.customInput} placeholder="Describe it (e.g., too many subjects, don't prioritize)" placeholderTextColor={`${CHR}60`} value={customEnemy} onChangeText={setCustomEnemy} />
              </ChoiceChip>
              <ChoiceChip label="I lose momentum — I start well but drift after day 2" selected={store.mcqAnswers.q3 === 'Losing momentum'} onSelect={() => store.setMcqAnswer('q3', 'Losing momentum')}>
                <TextInput style={styles.customInput} placeholder="When does it happen? (e.g., after a bad day, weekends)" placeholderTextColor={`${CHR}60`} value={customEnemy} onChangeText={setCustomEnemy} />
              </ChoiceChip>

            </View>

            <Shadow distance={8} startColor={'rgba(0,0,0,0.2)'} offset={[0, 6]} style={{width:'100%', borderRadius:24}}>
              <Pressable 
                style={[styles.primaryBtn, { borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }, (!store.mcqAnswers.q1 || !store.mcqAnswers.q2 || !store.mcqAnswers.q3) && { opacity: 0.5 }]} 
                onPress={handleNextGoal}
              >
                <Text style={styles.primaryBtnText}>Set Energy Split</Text>
                <ArrowRight size={20} color={BG} strokeWidth={2.5} />

              </Pressable>
            </Shadow>
          </View>
        )}

        {store.step === 2 && (
          <View style={styles.stepContainer}>
            <View style={[styles.iconWrap, clayLifted]}>
              <Brain size={32} color={CHR} strokeWidth={2} />
            </View>
            <Text style={styles.title}>Energy Allocation</Text>
            <Text style={styles.subtitle}>Drag sliders to set how you split your 5-hour protocol.</Text>

            {/* Live total badge */}
            {(() => {
              const total = store.allocation.body + store.allocation.mind + store.allocation.work;
              const ok = total === 100;
              return (
                <View style={[styles.totalBadge, { backgroundColor: ok ? `${SAGE}15` : `${TERR}15`, borderColor: ok ? SAGE : TERR }]}>
                  <Text style={[styles.totalBadgeText, { color: ok ? SAGE : TERR }]}>
                    {ok ? '✓ Allocation locked at 100%' : `⚠ Total: ${total}% — Auto-balancing`}
                  </Text>
                </View>
              );
            })()}

            <View style={styles.slidersList}>
              <ClaySlider 
                label="BODY" color={MUST} icon={Dumbbell} 
                value={store.allocation.body}
                mins={Math.round((store.allocation.body / 100) * 300)}
                onChange={(v) => store.setAllocation('body', v)} 
              />
              <ClaySlider 
                label="MIND" color={SAGE} icon={Brain} 
                value={store.allocation.mind}
                mins={Math.round((store.allocation.mind / 100) * 300)}
                onChange={(v) => store.setAllocation('mind', v)} 
              />
              <ClaySlider 
                label="WORK" color={TERR} icon={Briefcase} 
                value={store.allocation.work}
                mins={Math.round((store.allocation.work / 100) * 300)}
                onChange={(v) => store.setAllocation('work', v)} 
              />
            </View>

            <Pressable style={styles.primaryBtn} onPress={handleGenerate}>
              <Text style={styles.primaryBtnText}>Invoke Architect</Text>
              <Sparkles size={18} color={BG} strokeWidth={2.5} />
            </Pressable>
          </View>
        )}

        {store.step === 3 && (
          <View style={[styles.stepContainer, { marginTop: 40 }]}>
            {store.isGenerating ? (
              <View style={styles.generatingState}>
                <Animated.View style={[styles.architectStone, clayLifted, architectStyle]}>
                  <View style={styles.architectInner} />
                </Animated.View>
                <Text style={styles.generatingTitle}>The Architect is Thinking...</Text>
                <Text style={styles.generatingSub}>Formulating your immutable protocol.</Text>
              </View>
            ) : genError ? (
              <View style={styles.revealState}>
                <View style={[styles.iconWrap, clayLifted, { backgroundColor: `${TERR}15` }]}>
                  <Sparkles size={32} color={TERR} strokeWidth={2} />
                </View>
                <Text style={[styles.title, { color: TERR }]}>Connection Lost</Text>
                <Text style={styles.subtitle}>The Architect couldn&apos;t reach the server. Check your connection and try again.</Text>
                <Pressable style={[styles.primaryBtn, { backgroundColor: TERR, marginTop: 24 }]} onPress={handleGenerate}>
                  <Text style={styles.primaryBtnText}>Retry</Text>
                  <Sparkles size={20} color={BG} strokeWidth={2.5} />
                </Pressable>
                <Pressable style={{ marginTop: 16, padding: 12 }} onPress={() => store.setStep(2)}>
                  <Text style={{ color: `${CHR}50`, fontSize: 13, fontWeight: '600' }}>← Go Back</Text>
                </Pressable>
              </View>
            ) : (
              <View style={styles.revealState}>
                <Text style={styles.title}>Your Protocol</Text>
                <Text style={styles.subtitle}>These are your daily minimums. Non-negotiable.</Text>
                
                <View style={styles.missionsTray}>
                  {store.generatedMissions.map((m: any, idx: number) => {
                    const isBody = m.category === 'BODY';
                    const isMind = m.category === 'MIND';
                    const Color = isBody ? MUST : isMind ? SAGE : TERR;
                    const Icon = isBody ? Dumbbell : isMind ? Brain : Briefcase;
                    
                    return (
                      <View key={idx} style={[styles.missionCard, clayLifted]}>
                         <View style={[styles.missionIcon, { backgroundColor: `${Color}25` }]}>
                            <Icon size={22} color={Color} strokeWidth={2.5} />
                         </View>
                         <View style={{ flex: 1 }}>
                           <Text style={styles.missionCategory}>{m.category}</Text>
                           <Text style={styles.missionTitle}>{m.title}</Text>
                         </View>
                         <View style={styles.durationBadge}>
                           <Text style={styles.durationText}>{m.duration}m</Text>
                         </View>
                      </View>
                    );
                  })}
                </View>

                <Pressable style={styles.primaryBtn} onPress={handleAcceptProtocol}>
                  <Text style={styles.primaryBtnText}>Accept Protocol</Text>
                  <ArrowRight size={20} color={BG} strokeWidth={2.5} />
                </Pressable>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG },
  scroll: { flexGrow: 1, paddingHorizontal: 32, paddingVertical: 60, justifyContent: 'center' },
  
  stepContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', width: '100%' },
  
  iconWrap: {
    width: 80, height: 80, borderRadius: 28, 
    alignItems: 'center', justifyContent: 'center', marginBottom: 24,
  },
  
  title: { fontSize: 32, fontWeight: '900', color: CHR, letterSpacing: -1, marginBottom: 12, textAlign: 'center' },
  subtitle: { fontSize: 14, color: `${CHR}70`, fontWeight: '600', textAlign: 'center', marginBottom: 40, paddingHorizontal: 20, lineHeight: 22 },
  
  mcqSection: { width: '100%', marginBottom: 40 },
  mcqLabel: { fontSize: 11, fontWeight: '900', color: `${CHR}60`, letterSpacing: 1.5, marginBottom: 12 },
  choiceChip: { width: '100%', padding: 16, borderRadius: 16, marginBottom: 10, borderWidth: 1, borderColor: 'transparent' },
  choiceChipSelected: {
    backgroundColor: BG,
    borderColor: SAGE,
    borderWidth: 2,
    shadowColor: SAGE,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  choiceChipRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  choiceChipText: { fontSize: 15, fontWeight: '600', color: `${CHR}80` },
  customInput: {
    backgroundColor: 'rgba(61,64,91,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(61,64,91,0.1)',
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: CHR,
    fontWeight: '600'
  },

  primaryBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, 
    width: '100%', height: 64, borderRadius: 24,
    backgroundColor: CHR,
  },
  primaryBtnText: { color: BG, fontSize: 16, fontWeight: '900', letterSpacing: 0.5 },

  // Sliders
  slidersList: { width: '100%', gap: 32, marginBottom: 50 },
  sliderContainer: { width: '100%' },
  sliderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sliderLabel: { fontSize: 14, fontWeight: '900', color: CHR, letterSpacing: 1.5, textTransform: 'uppercase' },
  sliderValue: { fontSize: 16, fontWeight: '900' },
  sliderTrackWrap: { width: '100%', height: 40, justifyContent: 'center', position: 'relative' },
  sliderTrackBg: { 
    position: 'absolute', width: '100%', height: 16, borderRadius: 8, 
    backgroundColor: 'rgba(61,64,91,0.06)',
    borderWidth: 1, borderColor: 'rgba(0,0,0,0.02)',
  },
  sliderTrackFill: { 
    position: 'absolute', height: 16, borderRadius: 8, 
  },
  sliderKnob: { 
    position: 'absolute', width: 32, height: 32, borderRadius: 16, 
    backgroundColor: BG, left: 0,
  },
  sliderMins: { fontSize: 12, fontWeight: '600', color: `${CHR}40` },

  // Total badge
  totalBadge: {
    borderRadius: 12, paddingHorizontal: 16, paddingVertical: 8,
    borderWidth: 1.5, marginBottom: 28, alignSelf: 'stretch', alignItems: 'center',
  },
  totalBadgeText: { fontSize: 12, fontWeight: '800', letterSpacing: 0.5 },

  // Generating
  generatingState: { alignItems: 'center', paddingVertical: 40 },
  architectStone: {
    width: 120, height: 120, borderRadius: 40, backgroundColor: SAGE,
    alignItems: 'center', justifyContent: 'center', marginBottom: 40,
  },
  architectInner: {
    width: 60, height: 60, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.4)',
  },
  generatingTitle: { fontSize: 22, fontWeight: '900', color: CHR, marginBottom: 8 },
  generatingSub: { fontSize: 14, color: `${CHR}60`, fontWeight: '600' },

  // Reveal
  revealState: { width: '100%', alignItems: 'center' },
  missionsTray: { width: '100%', gap: 16, marginBottom: 40 },
  missionCard: {
    flexDirection: 'row', alignItems: 'center', width: '100%', padding: 16, borderRadius: 24, gap: 16,
  },
  missionIcon: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  missionCategory: { fontSize: 10, fontWeight: '900', color: `${CHR}40`, letterSpacing: 1.5 },
  missionTitle: { fontSize: 15, fontWeight: '800', color: CHR, marginTop: 4 },
  durationBadge: {
    backgroundColor: `${CHR}08`, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10,
  },
  durationText: { fontSize: 12, fontWeight: '800', color: CHR },
});
