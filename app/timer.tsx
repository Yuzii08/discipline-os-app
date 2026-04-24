import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, Pressable, StatusBar, Vibration, Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Timer, Pause, Play, RotateCcw, CheckCircle, X } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { handleMissionComplete } from '../services/missionService';


const BG   = '#F9F7F2';
const CHR  = '#3D405B';
const SAGE = '#81B29A';
const TERR = '#E07A5F';
const MUST = '#F2CC8F';

// ─── Pomodoro phases ─────────────────────────────────────────────────────────
const PHASES = [
  { label: 'Focus',      minutes: 25, color: TERR },
  { label: 'Short Break', minutes: 5,  color: SAGE },
  { label: 'Focus',      minutes: 25, color: TERR },
  { label: 'Long Break', minutes: 15, color: MUST },
];

export default function TimerScreen() {
  const router = useRouter();
  const { completionId, title, points, durationMins } = useLocalSearchParams();


  // Use mission duration if passed, otherwise Pomodoro 25min
  const totalSeconds = durationMins ? Number(durationMins) * 60 : 25 * 60;

  const [secondsLeft, setSecondsLeft] = useState(totalSeconds);
  const [running, setRunning]         = useState(false);
  const [done, setDone]               = useState(false);
  const [phaseIdx, setPhaseIdx]       = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const phase     = durationMins ? null : PHASES[phaseIdx];
  const totalSecs = durationMins ? totalSeconds : (phase!.minutes * 60);
  const progress  = 1 - secondsLeft / totalSecs;

  const handlePhaseComplete = React.useCallback(async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Vibration.vibrate([0, 400, 200, 400]);

    if (durationMins && completionId) {
      // Timed mission complete — delegate to missionService for score + DB write
      const basePts = points ? Number(points) : 20;
      await handleMissionComplete(completionId as string, basePts, 'EASY');
      setDone(true);
      return;
    }

    // Pomodoro: advance phase
    const nextIdx = (phaseIdx + 1) % PHASES.length;
    setPhaseIdx(nextIdx);
    setSecondsLeft(PHASES[nextIdx].minutes * 60);
    setRunning(false);
    Alert.alert(
      PHASES[phaseIdx].label + ' Complete!',
      `Up next: ${PHASES[nextIdx].label} (${PHASES[nextIdx].minutes} min)`,
      [{ text: 'Start', onPress: () => setRunning(true) }]
    );
  }, [durationMins, completionId, phaseIdx, points]);



  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setSecondsLeft(prev => {
          if (prev <= 1) {
            clearInterval(intervalRef.current!);
            handlePhaseComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running, handlePhaseComplete]);

  const reset = () => {
    setRunning(false);
    setSecondsLeft(totalSecs);
  };

  const mins = String(Math.floor(secondsLeft / 60)).padStart(2, '0');
  const secs = String(secondsLeft % 60).padStart(2, '0');

  const accent = phase?.color ?? TERR;

  // const circumference = 2 * Math.PI * 110; // reserved for SVG arc
  // const strokeDash = circumference * progress; // reserved for SVG arc

  if (done) {
    return (
      <View style={[styles.root, styles.center]}>
        <CheckCircle size={80} color={SAGE} strokeWidth={1.5} />
        <Text style={styles.doneHead}>Mission Complete</Text>
        <Text style={styles.doneSub}>+{points || 0} pts earned</Text>
        <Pressable 
          style={styles.doneBtn} 
          onPress={() => router.replace({
            pathname: '/(tabs)',
            params: { showAAR: completionId }
          })}
        >
          <Text style={styles.doneBtnText}>Back to Dashboard</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={BG} />

      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <X size={22} color={`${CHR}60`} strokeWidth={2.5} />
        </Pressable>
        <Text style={styles.headerTitle}>{title || 'Focus Timer'}</Text>
        <View style={{ width: 22 }} />
      </View>

      {/* Phase label */}
      {phase && (
        <View style={[styles.phasePill, { backgroundColor: `${accent}20` }]}>
          <Text style={[styles.phaseText, { color: accent }]}>{phase.label}</Text>
        </View>
      )}

      {/* Clock ring */}
      <View style={styles.clockWrap}>
        <View style={[styles.ringOuter, { borderColor: `${accent}20` }]}>
          <View style={[styles.ringFill, { borderColor: accent, borderTopColor: 'transparent', transform: [{ rotate: `${progress * 360}deg` }] }]} />
          <View style={styles.ringInner}>
            <Text style={[styles.time, { color: accent }]}>{mins}:{secs}</Text>
            <Text style={styles.timeLabel}>
              {running ? 'Running' : secondsLeft === totalSecs ? 'Ready' : 'Paused'}
            </Text>
          </View>
        </View>
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        <Pressable style={[styles.ctrlBtn, { backgroundColor: `${CHR}08` }]} onPress={reset}>
          <RotateCcw size={22} color={`${CHR}60`} strokeWidth={2.5} />
        </Pressable>
        <Pressable
          style={[styles.ctrlBtnMain, { backgroundColor: accent }]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            setRunning(r => !r);
          }}
        >
          {running
            ? <Pause size={30} color="#fff" strokeWidth={2.5} />
            : <Play  size={30} color="#fff" strokeWidth={2.5} />
          }
        </Pressable>
        <View style={[styles.ctrlBtn, { backgroundColor: `${CHR}08` }]}>
          <Timer size={22} color={`${CHR}30`} strokeWidth={2} />
        </View>
      </View>

      {/* Pomodoro phase dots */}
      {!durationMins && (
        <View style={styles.dots}>
          {PHASES.map((p, i) => (
            <View key={i} style={[styles.dot, { backgroundColor: i === phaseIdx ? accent : `${CHR}15` }]} />
          ))}
        </View>
      )}

      {/* Mission info */}
      {durationMins && (
        <View style={styles.missionInfo}>
          <Text style={styles.missionInfoText}>
            Complete {Number(durationMins)} min session to earn{' '}
            <Text style={{ color: SAGE, fontWeight: '900' }}>+{points} pts</Text>
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG },
  center: { alignItems: 'center', justifyContent: 'center', gap: 16 },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 24, paddingTop: 56, paddingBottom: 16,
  },
  headerTitle: { fontSize: 17, fontWeight: '800', color: CHR },

  phasePill: {
    alignSelf: 'center', paddingHorizontal: 16, paddingVertical: 6,
    borderRadius: 20, marginBottom: 32,
  },
  phaseText: { fontSize: 12, fontWeight: '900', letterSpacing: 2, textTransform: 'uppercase' },

  clockWrap: { alignItems: 'center', marginBottom: 48 },
  ringOuter: {
    width: 240, height: 240, borderRadius: 120,
    borderWidth: 10, alignItems: 'center', justifyContent: 'center',
    position: 'relative',
  },
  ringFill: {
    position: 'absolute', width: 240, height: 240, borderRadius: 120,
    borderWidth: 10, borderColor: TERR,
  },
  ringInner: { alignItems: 'center', gap: 4 },
  time:      { fontSize: 56, fontWeight: '900', letterSpacing: -2 },
  timeLabel: { fontSize: 11, fontWeight: '700', color: `${CHR}50`, letterSpacing: 2, textTransform: 'uppercase' },

  controls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 20, marginBottom: 32 },
  ctrlBtn: { width: 54, height: 54, borderRadius: 27, alignItems: 'center', justifyContent: 'center' },
  ctrlBtnMain: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center' },

  dots: { flexDirection: 'row', gap: 8, justifyContent: 'center' },
  dot:  { width: 8, height: 8, borderRadius: 4 },

  missionInfo: { marginHorizontal: 32, marginTop: 8 },
  missionInfoText: { textAlign: 'center', color: `${CHR}50`, fontSize: 13, fontWeight: '600' },

  doneHead: { fontSize: 26, fontWeight: '900', color: CHR, marginTop: 12 },
  doneSub:  { fontSize: 16, color: `${CHR}50`, fontWeight: '600' },
  doneBtn:  { marginTop: 24, backgroundColor: SAGE, paddingHorizontal: 32, paddingVertical: 14, borderRadius: 16 },
  doneBtnText: { color: '#fff', fontWeight: '900', fontSize: 15 },
});
