import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable,
  TextInput, Modal, Alert, Switch,
  KeyboardAvoidingView, Platform, StatusBar, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Plus, X, Trash2, ChevronLeft, Sun, Moon, Dumbbell, Brain,
  BookOpen, Droplets, Wind, Zap, Coffee, Flame, Clock, Edit3,
  BellRing, Star, Leaf,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useUserStore } from '../store/useUserStore';
import {
  fetchAllHabits, createHabit, deleteHabit, toggleHabitActive, Habit,
} from '../services/habitService';
import { useThemeStyles } from '../hooks/use-theme-styles';

// ── Icon catalogue ─────────────────────────────────────────────────────────────
const ICONS: { name: string; icon: any; label: string }[] = [
  { name: 'Sun', icon: Sun, label: 'Wake Up' },
  { name: 'Moon', icon: Moon, label: 'Sleep' },
  { name: 'Dumbbell', icon: Dumbbell, label: 'Workout' },
  { name: 'Brain', icon: Brain, label: 'Study' },
  { name: 'BookOpen', icon: BookOpen, label: 'Read' },
  { name: 'Droplets', icon: Droplets, label: 'Hydrate' },
  { name: 'Wind', icon: Wind, label: 'Breathe' },
  { name: 'Zap', icon: Zap, label: 'Energy' },
  { name: 'Coffee', icon: Coffee, label: 'No Coffee' },
  { name: 'Flame', icon: Flame, label: 'Streak' },
  { name: 'Clock', icon: Clock, label: 'On Time' },
  { name: 'Star', icon: Star, label: 'Excellence' },
  { name: 'Leaf', icon: Leaf, label: 'Nature' },
  { name: 'BellRing', icon: BellRing, label: 'Reminder' },
];

// ── Color palette ──────────────────────────────────────────────────────────────
const COLORS = [
  '#81B29A', '#F2CC8F', '#E07A5F', '#3D405B', '#C77DFF',
  '#4ECDC4', '#FF6B6B', '#45B7D1', '#96CEB4', '#FFEAA7',
  '#DDA0DD', '#F0E68C', '#98FB98', '#FFB347',
];

// ── Preset templates ───────────────────────────────────────────────────────────
const PRESETS = [
  { title: 'Wake Up at 5 AM', icon: 'Sun', color: '#F2CC8F', category: 'ROUTINE', schedule_time: '05:00', reward_points: 20 },
  { title: 'Cold Shower', icon: 'Wind', color: '#45B7D1', category: 'BODY', schedule_time: null, reward_points: 25 },
  { title: 'Drink 3L Water', icon: 'Droplets', color: '#4ECDC4', category: 'BODY', schedule_time: null, reward_points: 15 },
  { title: 'Morning Workout', icon: 'Dumbbell', color: '#E07A5F', category: 'BODY', schedule_time: '06:00', reward_points: 30 },
  { title: 'Read 30 Mins', icon: 'BookOpen', color: '#96CEB4', category: 'MIND', schedule_time: '21:00', reward_points: 20 },
  { title: 'No Phone Before 10 AM', icon: 'BellRing', color: '#C77DFF', category: 'MIND', schedule_time: null, reward_points: 20 },
  { title: 'Daily Journaling', icon: 'Edit3', color: '#F2CC8F', category: 'MIND', schedule_time: '22:00', reward_points: 15 },
  { title: 'Deep Work Block', icon: 'Brain', color: '#3D405B', category: 'WORK', schedule_time: '09:00', reward_points: 35 },
  { title: 'Sleep by 10 PM', icon: 'Moon', color: '#6C63FF', category: 'ROUTINE', schedule_time: '22:00', reward_points: 20 },
];

const IconComponent = ({ name, size = 20, color = '#fff' }: { name: string; size?: number; color?: string }) => {
  const found = ICONS.find(i => i.name === name);
  if (!found) return <Star size={size} color={color} strokeWidth={2.5} />;
  const Icon = found.icon;
  return <Icon size={size} color={color} strokeWidth={2.5} />;
};

export default function HabitsScreen() {
  const { tokens, styles, clay } = useThemeStyles(createStyles);
  const { CHR, SAGE, TERR, MUST, BG } = tokens;
  const { clayCard } = clay;

  const router = useRouter();
  const { profile } = useUserStore();

  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showPresets, setShowPresets] = useState(false);

  // Create form state
  const [newTitle, setNewTitle] = useState('');
  const [newCat, setNewCat] = useState<'BODY' | 'MIND' | 'WORK' | 'ROUTINE'>('ROUTINE');
  const [newIcon, setNewIcon] = useState('Sun');
  const [newColor, setNewColor] = useState(COLORS[0]);
  const [newPoints, setNewPoints] = useState('15');
  const [newTime, setNewTime] = useState('');
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    if (!profile?.user_id) return;
    setLoading(true);
    try {
      const data = await fetchAllHabits(profile.user_id);
      setHabits(data);
    } catch (e) {
      console.warn('Failed to load habits:', e);
    } finally {
      setLoading(false);
    }
  }, [profile?.user_id]);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async () => {
    if (!newTitle.trim() || !profile?.user_id) return;
    setCreating(true);
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await createHabit(profile.user_id, {
        title: newTitle.trim(),
        category: newCat,
        icon: newIcon,
        color: newColor,
        reward_points: Math.max(5, Math.min(100, parseInt(newPoints) || 15)),
        schedule_time: newTime.trim() || null,
      });
      setShowCreate(false);
      resetForm();
      load();
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Could not create habit');
    } finally {
      setCreating(false);
    }
  };

  const handlePreset = async (preset: typeof PRESETS[0]) => {
    if (!profile?.user_id) return;
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await createHabit(profile.user_id, preset as any);
      setShowPresets(false);
      load();
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Could not add preset');
    }
  };

  const handleDelete = (habit: Habit) => {
    Alert.alert(
      'Delete Habit',
      `Remove "${habit.title}" from your daily routines?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', style: 'destructive',
          onPress: async () => {
            try {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
              await deleteHabit(habit.habit_id);
              setHabits(prev => prev.filter(h => h.habit_id !== habit.habit_id));
            } catch (e: any) {
              Alert.alert('Error', e?.message);
            }
          },
        },
      ]
    );
  };

  const handleToggle = async (habit: Habit) => {
    try {
      await toggleHabitActive(habit.habit_id, habit.is_active);
      setHabits(prev => prev.map(h =>
        h.habit_id === habit.habit_id ? { ...h, is_active: !h.is_active } : h
      ));
    } catch (e: any) {
      Alert.alert('Error', e?.message);
    }
  };

  const resetForm = () => {
    setNewTitle('');
    setNewCat('ROUTINE');
    setNewIcon('Sun');
    setNewColor(COLORS[0]);
    setNewPoints('15');
    setNewTime('');
  };

  const activeHabits = habits.filter(h => h.is_active);
  const inactiveHabits = habits.filter(h => !h.is_active);

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={BG} />

      {/* ── Header ── */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={10}>
          <ChevronLeft size={24} color={CHR} strokeWidth={2.5} />
        </Pressable>
        <View>
          <Text style={styles.headerTitle}>Daily Routines</Text>
          <Text style={styles.headerSub}>{activeHabits.length} active habits</Text>
        </View>
        <Pressable
          style={[styles.addBtn, { backgroundColor: SAGE }]}
          onPress={() => setShowPresets(true)}
        >
          <Plus size={20} color="#fff" strokeWidth={2.5} />
        </Pressable>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <ActivityIndicator color={SAGE} style={{ marginTop: 60 }} />
        ) : habits.length === 0 ? (
          /* ── Empty state ── */
          <View style={styles.emptyState}>
            <Sun size={56} color={`${CHR}15`} strokeWidth={1.5} />
            <Text style={styles.emptyTitle}>No Routines Yet</Text>
            <Text style={styles.emptySub}>
              Build your daily discipline. Tap the + button to add habits like "Wake up at 5 AM" and watch your score climb.
            </Text>
            <Pressable
              style={[styles.emptyBtn, { backgroundColor: SAGE }]}
              onPress={() => setShowPresets(true)}
            >
              <Zap size={16} color="#fff" strokeWidth={2.5} />
              <Text style={styles.emptyBtnText}>Add First Habit</Text>
            </Pressable>
          </View>
        ) : (
          <>
            {/* ── Active Habits ── */}
            {activeHabits.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>Active</Text>
                {activeHabits.map(habit => (
                  <HabitRow
                    key={habit.habit_id}
                    habit={habit}
                    tokens={tokens}
                    clay={clay}
                    styles={styles}
                    onDelete={handleDelete}
                    onToggle={handleToggle}
                  />
                ))}
              </View>
            )}

            {/* ── Inactive Habits ── */}
            {inactiveHabits.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>Paused</Text>
                {inactiveHabits.map(habit => (
                  <HabitRow
                    key={habit.habit_id}
                    habit={habit}
                    tokens={tokens}
                    clay={clay}
                    styles={styles}
                    onDelete={handleDelete}
                    onToggle={handleToggle}
                  />
                ))}
              </View>
            )}

            {/* ── Add Custom Habit CTA ── */}
            <Pressable
              style={[styles.customBtn, clayCard, { borderWidth: 1.5, borderColor: `${SAGE}60`, borderStyle: 'dashed' }]}
              onPress={() => setShowCreate(true)}
            >
              <Edit3 size={18} color={SAGE} strokeWidth={2.5} />
              <Text style={[styles.customBtnText, { color: SAGE }]}>Create Custom Habit</Text>
            </Pressable>
          </>
        )}
      </ScrollView>

      {/* ── Preset Picker Modal ── */}
      <Modal visible={showPresets} transparent animationType="slide">
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <Pressable style={styles.backdrop} onPress={() => setShowPresets(false)} />
          <View style={[styles.sheet, { backgroundColor: BG, borderTopWidth: 1, borderTopColor: `${CHR}15` }]}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>Quick Add Routine</Text>
              <Pressable onPress={() => setShowPresets(false)}>
                <X size={22} color={`${CHR}50`} strokeWidth={2.5} />
              </Pressable>
            </View>
            <Text style={styles.modalSub}>Tap to instantly add a proven discipline routine</Text>

            <ScrollView showsVerticalScrollIndicator={false} style={{ marginTop: 12 }}>
              {PRESETS.map(preset => (
                <Pressable
                  key={preset.title}
                  style={[styles.presetRow, clayCard]}
                  onPress={() => handlePreset(preset)}
                >
                  <View style={[styles.presetIcon, { backgroundColor: `${preset.color}25` }]}>
                    <IconComponent name={preset.icon} size={22} color={preset.color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.presetTitle}>{preset.title}</Text>
                    {preset.schedule_time && (
                      <Text style={styles.presetTime}>
                        <Clock size={10} color={`${CHR}45`} /> {preset.schedule_time}
                      </Text>
                    )}
                  </View>
                  <View style={[styles.pointsBadge, { backgroundColor: `${SAGE}20` }]}>
                    <Text style={[styles.pointsText, { color: SAGE }]}>+{preset.reward_points}DP</Text>
                  </View>
                </Pressable>
              ))}

              <Pressable
                style={[styles.presetRow, { borderStyle: 'dashed', borderWidth: 2, borderColor: `${CHR}20`, backgroundColor: 'transparent' }]}
                onPress={() => { setShowPresets(false); setTimeout(() => setShowCreate(true), 300); }}
              >
                <View style={[styles.presetIcon, { backgroundColor: `${CHR}10` }]}>
                  <Plus size={22} color={`${CHR}50`} strokeWidth={2} />
                </View>
                <Text style={[styles.presetTitle, { color: `${CHR}60` }]}>Custom Habit...</Text>
              </Pressable>

              <View style={{ height: 40 }} />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── Custom Create Modal ── */}
      <Modal visible={showCreate} transparent animationType="slide">
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <Pressable style={styles.backdrop} onPress={() => setShowCreate(false)} />
          <View style={[styles.sheet, { backgroundColor: BG }]}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>Custom Habit</Text>
              <Pressable onPress={() => setShowCreate(false)}>
                <X size={22} color={`${CHR}50`} strokeWidth={2.5} />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Title */}
              <Text style={styles.fieldLabel}>Habit Name</Text>
              <TextInput
                style={[styles.fieldInput, { color: CHR }]}
                placeholder="e.g. Wake up at 5 AM"
                placeholderTextColor={`${CHR}35`}
                value={newTitle}
                onChangeText={setNewTitle}
              />

              {/* Category */}
              <Text style={styles.fieldLabel}>Category</Text>
              <View style={styles.pillRow}>
                {(['ROUTINE', 'BODY', 'MIND', 'WORK'] as const).map(cat => (
                  <Pressable
                    key={cat}
                    style={[styles.pill, newCat === cat && { backgroundColor: SAGE }]}
                    onPress={() => setNewCat(cat)}
                  >
                    <Text style={[styles.pillText, { color: newCat === cat ? '#fff' : `${CHR}70` }]}>{cat}</Text>
                  </Pressable>
                ))}
              </View>

              {/* Icon Picker */}
              <Text style={styles.fieldLabel}>Icon</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
                {ICONS.map(({ name, icon: Icon, label }) => (
                  <Pressable
                    key={name}
                    style={[styles.iconChip, newIcon === name && { borderColor: newColor, backgroundColor: `${newColor}20` }]}
                    onPress={() => setNewIcon(name)}
                  >
                    <Icon size={20} color={newIcon === name ? newColor : `${CHR}50`} strokeWidth={2.5} />
                    <Text style={[styles.iconChipLabel, { color: newIcon === name ? newColor : `${CHR}40` }]}>{label}</Text>
                  </Pressable>
                ))}
              </ScrollView>

              {/* Color Picker */}
              <Text style={styles.fieldLabel}>Color</Text>
              <View style={styles.colorGrid}>
                {COLORS.map(c => (
                  <Pressable
                    key={c}
                    style={[styles.colorDot, { backgroundColor: c }, newColor === c && styles.colorDotSelected]}
                    onPress={() => setNewColor(c)}
                  />
                ))}
              </View>

              {/* Schedule Time */}
              <Text style={styles.fieldLabel}>Scheduled Time (optional)</Text>
              <TextInput
                style={[styles.fieldInput, { color: CHR }]}
                placeholder="e.g. 05:00 (24h format)"
                placeholderTextColor={`${CHR}35`}
                value={newTime}
                onChangeText={setNewTime}
              />

              {/* Reward Points */}
              <Text style={styles.fieldLabel}>Reward Points (5–100)</Text>
              <TextInput
                style={[styles.fieldInput, { color: CHR }]}
                placeholder="15"
                placeholderTextColor={`${CHR}35`}
                value={newPoints}
                onChangeText={setNewPoints}
                keyboardType="numeric"
              />

              {/* Preview */}
              <View style={[styles.preview, { backgroundColor: `${newColor}15`, borderColor: `${newColor}40` }]}>
                <View style={[styles.previewIcon, { backgroundColor: newColor }]}>
                  <IconComponent name={newIcon} size={24} color="#fff" />
                </View>
                <Text style={[styles.previewTitle, { color: CHR }]}>{newTitle || 'Habit Name'}</Text>
                <View style={[styles.pointsBadge, { backgroundColor: `${newColor}30` }]}>
                  <Text style={[styles.pointsText, { color: newColor }]}>+{newPoints || 15}DP</Text>
                </View>
              </View>

              <Pressable
                style={[styles.createBtn, { backgroundColor: SAGE }, (!newTitle.trim() || creating) && { opacity: 0.4 }]}
                onPress={handleCreate}
                disabled={!newTitle.trim() || creating}
              >
                {creating ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.createBtnText}>Add to Daily Routines</Text>
                )}
              </Pressable>
              <View style={{ height: 40 }} />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

// ── Habit Row Component ────────────────────────────────────────────────────────
function HabitRow({ habit, tokens, clay, styles, onDelete, onToggle }: {
  habit: Habit;
  tokens: any;
  clay: any;
  styles: any;
  onDelete: (h: Habit) => void;
  onToggle: (h: Habit) => void;
}) {
  const { CHR, SAGE } = tokens;
  const { clayCard } = clay;
  return (
    <View style={[styles.habitRow, clayCard, !habit.is_active && { opacity: 0.5 }]}>
      <View style={[styles.habitIcon, { backgroundColor: `${habit.color}25` }]}>
        <IconComponent name={habit.icon} size={20} color={habit.color} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.habitTitle, { color: CHR }]}>{habit.title}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 3 }}>
          <Text style={[styles.habitCat, { color: `${CHR}45` }]}>{habit.category}</Text>
          {habit.schedule_time && (
            <>
              <View style={[styles.dot, { backgroundColor: `${CHR}25` }]} />
              <Text style={[styles.habitCat, { color: `${CHR}45` }]}>{habit.schedule_time}</Text>
            </>
          )}
          <View style={[styles.dot, { backgroundColor: `${CHR}25` }]} />
          <Text style={[styles.habitPts, { color: habit.color }]}>+{habit.reward_points}DP</Text>
        </View>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <Switch
          value={habit.is_active}
          onValueChange={() => onToggle(habit)}
          trackColor={{ false: `${CHR}20`, true: `${SAGE}60` }}
          thumbColor={habit.is_active ? SAGE : `${CHR}40`}
        />
        <Pressable onPress={() => onDelete(habit)} hitSlop={8}>
          <Trash2 size={18} color={`${CHR}30`} strokeWidth={2} />
        </Pressable>
      </View>
    </View>
  );
}

const createStyles = (tokens: any, clay: any) => {
  const { BG, CHR, SAGE, TERR, MUST, EGSHELL, isDark } = tokens;
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: BG },

    header: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16,
    },
    backBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 14, backgroundColor: `${CHR}08` },
    headerTitle: { fontSize: 22, fontWeight: '900', color: CHR, letterSpacing: -0.5 },
    headerSub: { fontSize: 12, color: `${CHR}50`, fontWeight: '600', marginTop: 1 },
    addBtn: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },

    scroll: { paddingHorizontal: 20, paddingBottom: 100 },

    emptyState: { alignItems: 'center', paddingTop: 60, gap: 12, paddingHorizontal: 20 },
    emptyTitle: { fontSize: 22, fontWeight: '900', color: CHR },
    emptySub: { fontSize: 14, color: `${CHR}50`, textAlign: 'center', lineHeight: 21, fontWeight: '500' },
    emptyBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 24, paddingVertical: 14, borderRadius: 16, marginTop: 8 },
    emptyBtnText: { color: '#fff', fontSize: 15, fontWeight: '800' },

    section: { marginBottom: 24 },
    sectionLabel: { fontSize: 10, fontWeight: '900', color: `${CHR}45`, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 12 },

    habitRow: {
      flexDirection: 'row', alignItems: 'center', gap: 14,
      borderRadius: 20, padding: 16, marginBottom: 10,
      backgroundColor: EGSHELL,
    },
    habitIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
    habitTitle: { fontSize: 15, fontWeight: '700' },
    habitCat: { fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
    habitPts: { fontSize: 11, fontWeight: '800' },
    dot: { width: 3, height: 3, borderRadius: 2 },

    customBtn: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
      borderRadius: 20, padding: 18,
      backgroundColor: EGSHELL,
    },
    customBtnText: { fontSize: 15, fontWeight: '700', color: CHR },

    // Modal
    modalOverlay: { flex: 1, justifyContent: 'flex-end' },
    backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(61,64,91,0.4)' },
    sheet: {
      borderTopLeftRadius: 32, borderTopRightRadius: 32,
      paddingHorizontal: 24, paddingTop: 12, paddingBottom: 10,
      maxHeight: '90%',
    },
    modalHandle: { width: 44, height: 5, borderRadius: 3, backgroundColor: `${CHR}20`, alignSelf: 'center', marginBottom: 20 },
    modalHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
    modalTitle: { fontSize: 22, fontWeight: '900', color: CHR },
    modalSub: { fontSize: 13, color: `${CHR}50`, fontWeight: '500', marginBottom: 4 },

    presetRow: {
      flexDirection: 'row', alignItems: 'center', gap: 14,
      borderRadius: 18, padding: 14, marginBottom: 10,
      backgroundColor: EGSHELL,
    },
    presetIcon: { width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
    presetTitle: { fontSize: 15, fontWeight: '700', color: CHR },
    presetTime: { fontSize: 11, color: `${CHR}45`, fontWeight: '600', marginTop: 2 },
    pointsBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 100 },
    pointsText: { fontSize: 11, fontWeight: '900' },

    fieldLabel: { fontSize: 10, fontWeight: '900', color: `${CHR}50`, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8, marginTop: 16 },
    fieldInput: {
      backgroundColor: `${CHR}07`, borderRadius: 14, height: 52,
      paddingHorizontal: 16, fontSize: 15, fontWeight: '600', marginBottom: 4,
    },

    pillRow: { flexDirection: 'row', gap: 8, marginBottom: 4 },
    pill: { flex: 1, paddingVertical: 10, borderRadius: 12, backgroundColor: `${CHR}08`, alignItems: 'center' },
    pillText: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },

    iconChip: {
      alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 10,
      borderRadius: 12, borderWidth: 2, borderColor: 'transparent',
      marginRight: 8, backgroundColor: `${CHR}06`,
    },
    iconChipLabel: { fontSize: 9, fontWeight: '700' },

    colorGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 4 },
    colorDot: { width: 32, height: 32, borderRadius: 16 },
    colorDotSelected: { borderWidth: 3, borderColor: CHR },

    preview: {
      flexDirection: 'row', alignItems: 'center', gap: 14,
      borderRadius: 20, padding: 16, marginTop: 20, marginBottom: 16,
      borderWidth: 1.5,
    },
    previewIcon: { width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
    previewTitle: { flex: 1, fontSize: 15, fontWeight: '700' },

    createBtn: { borderRadius: 16, paddingVertical: 16, alignItems: 'center', marginTop: 4 },
    createBtnText: { color: '#fff', fontSize: 16, fontWeight: '900', letterSpacing: 0.3 },
  });
};
