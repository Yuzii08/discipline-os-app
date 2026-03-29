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

const { width } = Dimensions.get('window');
const SLIDER_WIDTH = width - 80; // Padding 40 on each side

const BG = '#F9F7F2';
const CHR = '#3D405B';
const SAGE = '#81B29A';
const TERR = '#E07A5F';
const MUST = '#F2CC8F';

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
  onChange 
}: { 
  label: string, color: string, icon: any, value: number, onChange: (val: number) => void 
}) => {
  const progressX = useSharedValue((value / 100) * SLIDER_WIDTH);
  const startX = useSharedValue(0);

  useEffect(() => {
    progressX.value = withTiming((value / 100) * SLIDER_WIDTH, { duration: 200 });
  }, [value]);

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
        <Text style={[styles.sliderValue, { color }]}>{value}%</Text>
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
  onSelect 
}: { 
  label: string, selected: boolean, onSelect: () => void 
}) => {
  return (
    <Pressable
      style={[
        styles.choiceChip,
        selected ? styles.choiceChipSelected : clayInner
      ]}
      onPress={onSelect}
    >
      <View style={styles.choiceChipRow}>
        {selected ? (
          <CheckCircle2 size={20} color={SAGE} strokeWidth={2.5} />
        ) : (
          <Circle size={20} color={`${CHR}40`} strokeWidth={2.5} />
        )}
        <Text style={[styles.choiceChipText, selected && { color: CHR, fontWeight: '800' }]}>
          {label}
        </Text>
      </View>
    </Pressable>
  );
};



export default function GenesisOnboardingScreen() {
  const router = useRouter();
  const store = useOnboardingStore();
  const { profile } = useUserStore();

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

    try {
      const compiledGoals = `Primary focus: ${store.mcqAnswers.q1}. Discipline Level: ${store.mcqAnswers.q2}. Biggest Obstacle: ${store.mcqAnswers.q3}.`;


      const { data, error } = await supabase.functions.invoke('generate-initial-protocol', {
        body: {
          goals: compiledGoals,
          allocation: store.allocation,
          userContext: {
            name: profile?.username || 'Sambhav Raj',
            age: '16 (JEE Aspirant)',
            interests: 'Software Dev, Gaming (BGMI/Valorant), Desi Hip Hop.'
          }
        }
      });

      if (error) throw error;
      
      if (data?.missions) {
        store.setGeneratedMissions(data.missions);
      }
    } catch (err) {
      console.error("Genesis generation failed:", err);
      // Fallback missions if failing
      store.setGeneratedMissions([
        { category: "BODY", title: "100 Pushups & Stretching", duration: 30 },
        { category: "MIND", title: "Solve 15 JEE Physics PYQs", duration: 60 },
        { category: "WORK", title: "Build one core Cadence feature", duration: 45 }
      ]);
    } finally {
      store.setIsGenerating(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
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
      
      await supabase.from('missions').insert(inserts as any);
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
  }, [store.isGenerating]);

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
            <Text style={styles.title}>Project Genesis</Text>
            <Text style={styles.subtitle}>Define your current reality. What are your core ambitions right now?</Text>
            <View style={styles.mcqSection}>
              <Text style={styles.mcqLabel}>1. PRIMARY OBJECTIVE</Text>
              <ChoiceChip label="Acing exams (JEE/NEET/Boards)" selected={store.mcqAnswers.q1 === 'Acing exams'} onSelect={() => store.setMcqAnswer('q1', 'Acing exams')} />
              <ChoiceChip label="Building a startup / Coding" selected={store.mcqAnswers.q1 === 'Building a startup'} onSelect={() => store.setMcqAnswer('q1', 'Building a startup')} />
              <ChoiceChip label="Physical transformation" selected={store.mcqAnswers.q1 === 'Physical transformation'} onSelect={() => store.setMcqAnswer('q1', 'Physical transformation')} />
              
              <Text style={[styles.mcqLabel, { marginTop: 24 }]}>2. DISCIPLINE LEVEL</Text>
              <ChoiceChip label="Civilian (Struggling to build habits)" selected={store.mcqAnswers.q2 === 'Civilian'} onSelect={() => store.setMcqAnswer('q2', 'Civilian')} />
              <ChoiceChip label="Recruit (Can do 3-4 days, then fail)" selected={store.mcqAnswers.q2 === 'Recruit'} onSelect={() => store.setMcqAnswer('q2', 'Recruit')} />
              <ChoiceChip label="Vanguard (Consistent, want elite levels)" selected={store.mcqAnswers.q2 === 'Vanguard'} onSelect={() => store.setMcqAnswer('q2', 'Vanguard')} />

              <Text style={[styles.mcqLabel, { marginTop: 24 }]}>3. BIGGEST ENEMY</Text>
              <ChoiceChip label="Doomscrolling & Distractions" selected={store.mcqAnswers.q3 === 'Doomscrolling'} onSelect={() => store.setMcqAnswer('q3', 'Doomscrolling')} />
              <ChoiceChip label="Lack of energy / Burnout" selected={store.mcqAnswers.q3 === 'Burnout'} onSelect={() => store.setMcqAnswer('q3', 'Burnout')} />
              <ChoiceChip label="Overthinking / Analysis Paralysis" selected={store.mcqAnswers.q3 === 'Overthinking'} onSelect={() => store.setMcqAnswer('q3', 'Overthinking')} />
              <ChoiceChip label="Inconsistency" selected={store.mcqAnswers.q3 === 'Inconsistency'} onSelect={() => store.setMcqAnswer('q3', 'Inconsistency')} />
            </View>

            <Pressable 
              style={[styles.primaryBtn, (!store.mcqAnswers.q1 || !store.mcqAnswers.q2 || !store.mcqAnswers.q3) && { opacity: 0.5 }]} 
              onPress={handleNextGoal}
            >
              <Text style={styles.primaryBtnText}>Establish Vector</Text>
              <ArrowRight size={20} color={BG} strokeWidth={2.5} />
            </Pressable>
          </View>
        )}

        {store.step === 2 && (
          <View style={styles.stepContainer}>
            <View style={[styles.iconWrap, clayLifted]}>
              <Brain size={32} color={CHR} strokeWidth={2} />
            </View>
            <Text style={styles.title}>Energy Allocation</Text>
            <Text style={styles.subtitle}>Distribute your discipline across your three pillars.</Text>

            <View style={styles.slidersList}>
              <ClaySlider 
                label="BODY" color={MUST} icon={Dumbbell} 
                value={store.allocation.body} 
                onChange={(v) => store.setAllocation('body', v)} 
              />
              <ClaySlider 
                label="MIND" color={SAGE} icon={Brain} 
                value={store.allocation.mind} 
                onChange={(v) => store.setAllocation('mind', v)} 
              />
              <ClaySlider 
                label="WORK" color={TERR} icon={Briefcase} 
                value={store.allocation.work} 
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

  primaryBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, 
    width: '100%', height: 64, borderRadius: 24,
    ...clayLifted, shadowColor: '#000', backgroundColor: CHR,
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
