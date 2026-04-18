import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable,
  StatusBar, Animated, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../services/supabase';
import { useUserStore } from '../store/useUserStore';
import { LinearGradient } from 'expo-linear-gradient';
import { Shield, Target, Brain, Dumbbell, Briefcase, ChevronRight, AlertTriangle } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

// ── Typewriter hook ───────────────────────────────────────────────────────────
function useTypewriter(text: string, speed = 18) {
  const [displayed, setDisplayed] = useState('');
  useEffect(() => {
    setDisplayed('');
    if (!text) return;
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) clearInterval(interval);
    }, speed);
    return () => clearInterval(interval);
  }, [text, speed]);
  return displayed;
}

// ── Category icon map ─────────────────────────────────────────────────────────
const CAT_ICONS: Record<string, any> = {
  BODY: Dumbbell,
  MIND: Brain,
  WORK: Briefcase,
};

const CAT_COLORS: Record<string, string> = {
  BODY: '#E8A838',
  MIND: '#7C9EF8',
  WORK: '#5EC48C',
};

// ── Main Screen ───────────────────────────────────────────────────────────────
export default function AARScreen() {
  const router = useRouter();
  useUserStore();

  const [loading, setLoading] = useState(true);
  const [aar, setAAR] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Scan-line animation
  const scanY = useRef(new Animated.Value(0)).current;
  const blinkOpacity = useRef(new Animated.Value(1)).current;
  const headerOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(scanY, { toValue: 1, duration: 3200, useNativeDriver: true }),
        Animated.timing(scanY, { toValue: 0, duration: 0, useNativeDriver: true }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(blinkOpacity, { toValue: 0, duration: 600, useNativeDriver: true }),
        Animated.timing(blinkOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
      ])
    ).start();
  }, [scanY, blinkOpacity]);

  const fetchAAR = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fnErr } = await supabase.functions.invoke('generate-aar', {
        body: { target_date: new Date().toLocaleDateString('en-CA') },
      });
      if (fnErr) throw fnErr;
      if (data?.error) throw new Error(data.error);
      setAAR(data);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      // Fade in header
      Animated.timing(headerOpacity, { toValue: 1, duration: 1000, useNativeDriver: true }).start();
    } catch (e: any) {
      setError(e?.message || 'Debrief failed. Try again.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setLoading(false);
    }
  }, [headerOpacity]);

  useEffect(() => {
    fetchAAR();
  }, [fetchAAR]);

  const debrief = useTypewriter(aar?.debrief || '', 20);

  const scanTranslate = scanY.interpolate({
    inputRange: [0, 1],
    outputRange: [-20, 820],
  });

  // ── Status color ──────────────────────────────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const getStatusColor = (status: string) => {
    if (status === 'COMPLETED') return '#5EC48C';
    if (status === 'FAILED') return '#E85C5C';
    return '#888';
  };

  const getGradeColor = (rate: number) => {
    if (rate >= 80) return '#5EC48C';
    if (rate >= 50) return '#E8A838';
    return '#E85C5C';
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#080A0E" />
      <LinearGradient colors={['#080A0E', '#0D121A', '#080A0E']} style={StyleSheet.absoluteFillObject} />

      {/* Scan line */}
      <Animated.View
        style={[styles.scanLine, { transform: [{ translateY: scanTranslate }] }]}
        pointerEvents="none"
      />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* ── HEADER ──────────────────────────────────────────────────────── */}
        <View style={styles.header}>
          <View style={styles.shieldRow}>
            <Shield size={20} color="#E85C5C" strokeWidth={2} />
            <Text style={styles.classifiedLabel}>CLASSIFIED — EYES ONLY</Text>
            <Animated.View style={{ opacity: blinkOpacity }}>
              <View style={styles.liveDot} />
            </Animated.View>
          </View>
          <Text style={styles.title}>AFTER ACTION{'\n'}REPORT</Text>
          <Text style={styles.dateLabel}>
            DATE: {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }).toUpperCase()}
          </Text>
          <View style={styles.divider} />
        </View>

        {/* ── LOADING ─────────────────────────────────────────────────────── */}
        {loading && (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#E85C5C" />
            <Text style={styles.loadingLabel}>COMPILING FIELD DATA...</Text>
            <Text style={styles.loadingSub}>Vanguard Commander is reviewing operations</Text>
          </View>
        )}

        {/* ── ERROR ───────────────────────────────────────────────────────── */}
        {!loading && error && (
          <View style={styles.errorBox}>
            <AlertTriangle size={32} color="#E85C5C" />
            <Text style={styles.errorTitle}>DEBRIEF FAILED</Text>
            <Text style={styles.errorText}>{error}</Text>
            <Pressable style={styles.retryBtn} onPress={fetchAAR}>
              <Text style={styles.retryText}>RETRY DEBRIEF</Text>
            </Pressable>
          </View>
        )}

        {/* ── AAR CONTENT ─────────────────────────────────────────────────── */}
        {!loading && aar && (
          <Animated.View style={{ opacity: headerOpacity }}>

            {/* ── STATS GRID ──────────────────────────────────────────────── */}
            <Text style={styles.sectionLabel}>OPERATIONAL SUMMARY</Text>
            <View style={styles.statsGrid}>
              <StatBox
                label="COMPLETION RATE"
                value={`${aar.stats.completionRate}%`}
                color={getGradeColor(aar.stats.completionRate)}
              />
              <StatBox
                label="OPS COMPLETED"
                value={`${aar.stats.completed}/${aar.stats.total}`}
                color="#7C9EF8"
              />
              <StatBox
                label="INTEL SECURED"
                value={`${aar.stats.pointsEarned}`}
                color="#E8A838"
                sub="pts"
              />
              <StatBox
                label="OPS FAILED"
                value={`${aar.stats.failed}`}
                color={aar.stats.failed > 0 ? '#E85C5C' : '#5EC48C'}
              />
            </View>

            {/* ── DOMAIN BREAKDOWN ────────────────────────────────────────── */}
            <Text style={styles.sectionLabel}>DOMAIN BREAKDOWN</Text>
            {(aar.stats.categoryBreakdown || []).map((cat: any) => {
              const Icon = CAT_ICONS[cat.category] || Target;
              const color = CAT_COLORS[cat.category] || '#888';
              const rate = cat.total > 0 ? Math.round((cat.completed / cat.total) * 100) : 0;
              return (
                <View key={cat.category} style={styles.domainRow}>
                  <View style={[styles.domainIcon, { backgroundColor: `${color}20` }]}>
                    <Icon size={16} color={color} strokeWidth={2.5} />
                  </View>
                  <Text style={styles.domainLabel}>{cat.category}</Text>
                  <View style={styles.domainBar}>
                    <View style={[styles.domainFill, { width: `${rate}%`, backgroundColor: color }]} />
                  </View>
                  <Text style={[styles.domainPct, { color }]}>{rate}%</Text>
                </View>
              );
            })}

            {/* ── COMMANDER'S DEBRIEF ─────────────────────────────────────── */}
            <View style={styles.debriefCard}>
              <View style={styles.debriefHeader}>
                <View style={styles.redDot} />
                <Text style={styles.debriefTitle}>COMMANDER&apos;S DEBRIEF</Text>
              </View>
              <Text style={styles.debriefText}>{debrief}</Text>
              {debrief.length < (aar.debrief?.length || 0) && (
                <Animated.View style={{ opacity: blinkOpacity }}>
                  <Text style={styles.cursor}>▋</Text>
                </Animated.View>
              )}
            </View>

            {/* ── END DAY BUTTON ───────────────────────────────────────────── */}
            <Pressable
              style={styles.endDayBtn}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                router.replace('/(tabs)');
              }}
            >
              <Text style={styles.endDayText}>ACKNOWLEDGE & STAND DOWN</Text>
              <ChevronRight size={16} color="#080A0E" strokeWidth={3} />
            </Pressable>

            <Text style={styles.footer}>— Vanguard Intelligence — Cadence Protocol v1.0 —</Text>
          </Animated.View>
        )}
      </ScrollView>
    </View>
  );
}

// ── Stat Box ─────────────────────────────────────────────────────────────────
function StatBox({ label, value, color, sub }: { label: string; value: string; color: string; sub?: string }) {
  return (
    <View style={styles.statBox}>
      <Text style={[styles.statValue, { color }]}>{value} <Text style={[styles.statSub, { color }]}>{sub}</Text></Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#080A0E' },
  scroll: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 60 },

  scanLine: {
    position: 'absolute', left: 0, right: 0, height: 2,
    backgroundColor: 'rgba(232, 92, 92, 0.15)', zIndex: 99,
  },

  header: { marginBottom: 32 },
  shieldRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  classifiedLabel: {
    fontSize: 10, fontWeight: '900', color: '#E85C5C',
    letterSpacing: 3, textTransform: 'uppercase',
  },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#E85C5C' },
  title: {
    fontSize: 42, fontWeight: '900', color: '#F0EDE8', letterSpacing: -1, lineHeight: 46,
    marginBottom: 12,
  },
  dateLabel: {
    fontSize: 10, color: 'rgba(240,237,232,0.4)', fontWeight: '700', letterSpacing: 1.5,
    marginBottom: 20,
  },
  divider: { height: 1, backgroundColor: 'rgba(232,92,92,0.3)' },

  // Loading
  loadingBox: { alignItems: 'center', gap: 16, paddingVertical: 80 },
  loadingLabel: {
    fontSize: 14, fontWeight: '900', color: '#F0EDE8', letterSpacing: 3,
  },
  loadingSub: { fontSize: 12, color: 'rgba(240,237,232,0.4)', fontWeight: '600' },

  // Error
  errorBox: { alignItems: 'center', gap: 12, paddingVertical: 60 },
  errorTitle: { fontSize: 18, fontWeight: '900', color: '#E85C5C', letterSpacing: 2 },
  errorText: { fontSize: 13, color: 'rgba(240,237,232,0.6)', textAlign: 'center', fontWeight: '600' },
  retryBtn: {
    marginTop: 8, paddingHorizontal: 24, paddingVertical: 12,
    backgroundColor: 'rgba(232,92,92,0.15)', borderRadius: 12,
    borderWidth: 1, borderColor: '#E85C5C',
  },
  retryText: { fontSize: 12, fontWeight: '900', color: '#E85C5C', letterSpacing: 2 },

  // Stats Grid
  sectionLabel: {
    fontSize: 9, fontWeight: '900', color: 'rgba(240,237,232,0.35)',
    letterSpacing: 3, textTransform: 'uppercase', marginTop: 28, marginBottom: 12,
  },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statBox: {
    flex: 1, minWidth: '45%',
    backgroundColor: 'rgba(240,237,232,0.04)',
    borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: 'rgba(240,237,232,0.07)',
  },
  statValue: { fontSize: 28, fontWeight: '900', letterSpacing: -1 },
  statSub: { fontSize: 12, fontWeight: '700' },
  statLabel: {
    fontSize: 9, fontWeight: '800', color: 'rgba(240,237,232,0.4)',
    letterSpacing: 2, textTransform: 'uppercase', marginTop: 4,
  },

  // Domain breakdown
  domainRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    marginBottom: 10,
  },
  domainIcon: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  domainLabel: {
    fontSize: 11, fontWeight: '900', color: 'rgba(240,237,232,0.6)',
    letterSpacing: 1.5, width: 44,
  },
  domainBar: {
    flex: 1, height: 6, backgroundColor: 'rgba(240,237,232,0.08)',
    borderRadius: 4, overflow: 'hidden',
  },
  domainFill: { height: '100%', borderRadius: 4 },
  domainPct: { fontSize: 12, fontWeight: '900', width: 36, textAlign: 'right' },

  // Debrief card
  debriefCard: {
    backgroundColor: 'rgba(232,92,92,0.06)',
    borderRadius: 20, padding: 20, marginTop: 4,
    borderWidth: 1, borderColor: 'rgba(232,92,92,0.2)',
  },
  debriefHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  redDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#E85C5C' },
  debriefTitle: {
    fontSize: 10, fontWeight: '900', color: '#E85C5C', letterSpacing: 3,
  },
  debriefText: {
    fontSize: 15, color: '#F0EDE8', fontWeight: '600', lineHeight: 24,
    letterSpacing: 0.2,
  },
  cursor: { color: '#E85C5C', fontSize: 18, marginTop: 4 },

  // End Day
  endDayBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#F0EDE8', borderRadius: 16,
    paddingVertical: 18, marginTop: 32,
  },
  endDayText: {
    fontSize: 13, fontWeight: '900', color: '#080A0E', letterSpacing: 2,
  },

  footer: {
    textAlign: 'center', fontSize: 10, color: 'rgba(240,237,232,0.2)',
    fontWeight: '700', letterSpacing: 1.5, marginTop: 24,
  },
});
