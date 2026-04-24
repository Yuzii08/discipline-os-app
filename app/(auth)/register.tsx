import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TextInput, Pressable,
  ActivityIndicator, KeyboardAvoidingView, Platform,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { AuthService } from '../../services/authService';
import { Eye, EyeOff } from 'lucide-react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  Easing,
  interpolate,
  interpolateColor,
  runOnJS,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

const { width: W, height: H } = Dimensions.get('window');

const BG   = '#F9F7F2';
const CHR  = '#3D405B';
const SAGE = '#81B29A';
const TERR = '#E07A5F';
const MUST = '#F2CC8F';

// ── Particle (same field for visual consistency) ──
function Particle({ delay, size, x, color }: { delay: number; size: number; x: number; color: string }) {
  const translateY = useSharedValue(H * 0.6);
  const opacity    = useSharedValue(0);
  const rotate     = useSharedValue(0);

  useEffect(() => {
    translateY.value = withDelay(delay, withRepeat(
      withTiming(-H * 0.7, { duration: 6000 + Math.random() * 4000, easing: Easing.linear }),
      -1, false
    ));
    opacity.value = withDelay(delay, withRepeat(
      withSequence(
        withTiming(0.7, { duration: 1200 }),
        withTiming(0.7, { duration: 3000 }),
        withTiming(0, { duration: 1200 }),
      ),
      -1, false
    ));
    rotate.value = withDelay(delay, withRepeat(
      withTiming(360, { duration: 8000, easing: Easing.linear }),
      -1, false
    ));
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }, { rotate: `${rotate.value}deg` }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[{
      position: 'absolute', left: x, bottom: 0,
      width: size, height: size, borderRadius: size / 4,
      backgroundColor: color,
    }, style]} />
  );
}

const PARTICLES = Array.from({ length: 12 }, (_, i) => ({
  id: i, delay: i * 450,
  size: 5 + Math.random() * 12,
  x: Math.random() * W,
  color: [SAGE, MUST, TERR, `${CHR}30`][i % 4],
}));

// ── Strength ring indicator ──
function StrengthRing({ value }: { value: number }) {
  const segments = [
    { label: 'ID', done: !!value },
  ];
  // Just a visual row of 4 status dots
  return null;
}

export default function RegisterScreen() {
  const router = useRouter();
  const [username,        setUsername]        = useState('');
  const [email,           setEmail]           = useState('');
  const [password,        setPassword]        = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword,    setShowPassword]    = useState(false);
  const [showConfirm,     setShowConfirm]     = useState(false);
  const [loading,         setLoading]         = useState(false);
  const [errorMsg,        setErrorMsg]        = useState('');
  const [needsConfirm,    setNeedsConfirm]    = useState(false);
  const [bootDone,        setBootDone]        = useState(false);

  // ── Boot sequence ──
  const bootProgress  = useSharedValue(0);
  const bootOpacity   = useSharedValue(1);
  const bootBarColor  = useSharedValue(0);

  // ── Content anims ──
  const contentOp   = useSharedValue(0);
  const contentY    = useSharedValue(50);
  const leftSlide   = useSharedValue(-W * 0.5);
  const rightSlide  = useSharedValue(W * 0.5);
  const headerScale = useSharedValue(0.6);
  const headerOp    = useSharedValue(0);
  const btnOp       = useSharedValue(0);
  const btnY        = useSharedValue(20);
  const btnPulse    = useSharedValue(1);
  const errorShake  = useSharedValue(0);

  useEffect(() => {
    // Boot bar charges up in 3 phases
    bootProgress.value = withSequence(
      withTiming(0.4, { duration: 500, easing: Easing.out(Easing.quad) }),
      withTiming(0.75, { duration: 400, easing: Easing.linear }),
      withTiming(1, { duration: 350, easing: Easing.in(Easing.quad) }),
    );
    bootBarColor.value = withTiming(1, { duration: 1200 });

    setTimeout(() => {
      bootOpacity.value = withTiming(0, { duration: 350 });
      runOnJS(setBootDone)(true);

      // Content bursts in
      contentOp.value = withTiming(1, { duration: 400 });
      contentY.value  = withTiming(0, { duration: 400, easing: Easing.out(Easing.back(1.4)) });

      // Header
      headerOp.value    = withDelay(100, withTiming(1, { duration: 350 }));
      headerScale.value = withDelay(100, withSpring(1, { damping: 11, stiffness: 130 }));

      // Left / right halves slide together (form card effect)
      leftSlide.value  = withDelay(200, withSpring(0, { damping: 14, stiffness: 110 }));
      rightSlide.value = withDelay(200, withSpring(0, { damping: 14, stiffness: 110 }));

      // Button
      btnOp.value = withDelay(450, withTiming(1, { duration: 300 }));
      btnY.value  = withDelay(450, withSpring(0, { damping: 10, stiffness: 120 }));

      // Persistent CTA pulse
      setTimeout(() => {
        btnPulse.value = withRepeat(
          withSequence(withTiming(1.025, { duration: 1000 }), withTiming(1, { duration: 1000 })),
          -1, true
        );
      }, 1000);
    }, 1350);
  }, []);

  const handleRegister = async () => {
    if (!username || !email || !password || !confirmPassword) {
      setErrorMsg('All sectors must be filled');
      triggerShake();
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg('Passphrases do not match');
      triggerShake();
      return;
    }
    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters');
      triggerShake();
      return;
    }
    setLoading(true);
    setErrorMsg('');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const result = await AuthService.signup(email.trim(), password, username.trim());
      if (result.needsConfirmation) setNeedsConfirm(true);
    } catch (err: any) {
      setErrorMsg(err.message || 'Registration failed.');
      triggerShake();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setLoading(false);
    }
  };

  const triggerShake = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    errorShake.value = withSequence(
      withTiming(-14, { duration: 55 }), withTiming(14, { duration: 55 }),
      withTiming(-10, { duration: 55 }), withTiming(10, { duration: 55 }),
      withTiming(0, { duration: 55 })
    );
  };

  // ── Animated styles ──
  const bootBarStyle = useAnimatedStyle(() => ({
    width: `${bootProgress.value * 100}%`,
    backgroundColor: interpolateColor(bootBarColor.value, [0, 1], [TERR, SAGE]),
  }));
  const bootOverlayStyle = useAnimatedStyle(() => ({ opacity: bootOpacity.value }));
  const contentStyle  = useAnimatedStyle(() => ({ opacity: contentOp.value, transform: [{ translateY: contentY.value }] }));
  const headerStyle   = useAnimatedStyle(() => ({ opacity: headerOp.value, transform: [{ scale: headerScale.value }] }));
  const leftStyle     = useAnimatedStyle(() => ({ transform: [{ translateX: leftSlide.value }] }));
  const rightStyle    = useAnimatedStyle(() => ({ transform: [{ translateX: rightSlide.value }] }));
  const btnAnimStyle  = useAnimatedStyle(() => ({ opacity: btnOp.value, transform: [{ translateY: btnY.value }, { scale: btnPulse.value }] }));
  const errorStyle    = useAnimatedStyle(() => ({ transform: [{ translateX: errorShake.value }] }));

  // ── Post-register confirmation screen ──
  if (needsConfirm) {
    return (
      <View style={s.root}>
        {PARTICLES.map(p => <Particle key={p.id} {...p} />)}
        <SafeAreaView style={s.confirmRoot}>
          {/* Success orb */}
          <View style={s.successOrbWrap}>
            <View style={s.successGlow} />
            <View style={s.successOrb}>
              <Text style={s.successIcon}>✓</Text>
            </View>
          </View>

          <Text style={s.confirmTitle}>Confirm Your<Text style={{ color: SAGE }}> Email</Text></Text>
          <Text style={s.confirmSub}>
            We sent a confirmation link to{'\n'}
            <Text style={{ color: CHR, fontWeight: '900' }}>{email}</Text>
          </Text>
          <Text style={s.confirmHint}>
            Click it to activate your account, then return here to log in.
          </Text>

          <Pressable
            style={({ pressed }) => [s.ctaBtn, pressed && s.ctaPressed, { marginTop: 36 }]}
            onPress={() => router.replace('/(auth)/login')}
          >
            <View style={s.ctaBtnGlow} />
            <View style={s.ctaContent}>
              <Text style={s.ctaText}>Go to Login</Text>
              <View style={s.ctaArrow}><Text style={s.ctaArrowText}>▶</Text></View>
            </View>
          </Pressable>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={s.root}>
      {/* ── Particles ── */}
      {PARTICLES.map(p => <Particle key={p.id} {...p} />)}

      {/* ── Boot overlay ── */}
      {!bootDone && (
        <Animated.View style={[StyleSheet.absoluteFill, s.bootOverlay, bootOverlayStyle]}>
          <Text style={s.bootTitle}>CADENCE OS</Text>
          <Text style={s.bootSub}>RECRUIT REGISTRATION PROTOCOL</Text>
          <View style={s.bootBarTrack}>
            <Animated.View style={[s.bootBar, bootBarStyle]} />
          </View>
          <Text style={s.bootPct}>LOADING ENROLLMENT MATRIX</Text>
          {/* Grid lines */}
          {[0.2, 0.4, 0.6, 0.8].map((v, i) => (
            <View key={i} style={[s.gridLine, { top: `${v * 100}%` }]} />
          ))}
        </Animated.View>
      )}

      {/* ── Main content ── */}
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <SafeAreaView style={{ flex: 1 }}>
          <Animated.ScrollView
            style={[{ flex: 1 }, contentStyle]}
            contentContainerStyle={s.container}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* ── Header ── */}
            <Animated.View style={[s.heroWrap, headerStyle]}>
              {/* Rank bars */}
              <View style={s.rankBars}>
                {[1,2,3,4].map(i => (
                  <View key={i} style={[s.rankBar, { height: i * 6 + 8, backgroundColor: i <= 3 ? SAGE : `${CHR}20` }]} />
                ))}
              </View>
              <View style={s.heroTextWrap}>
                <Text style={s.eyebrow}>▸ NEW RECRUIT INDUCTION</Text>
                <Text style={s.heroTitle}>Enlistment</Text>
                <Text style={s.heroSub}>There is no retreating from this point.</Text>
              </View>
              <View style={s.rankBars}>
                {[4,3,2,1].map(i => (
                  <View key={i} style={[s.rankBar, { height: i * 6 + 8, backgroundColor: i <= 3 ? SAGE : `${CHR}20` }]} />
                ))}
              </View>
            </Animated.View>

            {/* ── Error ── */}
            {!!errorMsg && (
              <Animated.View style={[s.errorBox, errorStyle]}>
                <Text style={s.errorDot}>⬡</Text>
                <Text style={s.errorText}>{errorMsg}</Text>
              </Animated.View>
            )}

            {/* ── Form (split reveal) ── */}
            <View style={s.formOuter}>
              {/* Left half slides in */}
              <Animated.View style={[StyleSheet.absoluteFill, { overflow: 'hidden', borderRadius: 28 }, leftStyle]}>
                <View style={[s.formHalf, { left: 0, width: '50%' }]} />
              </Animated.View>
              {/* Right half slides in */}
              <Animated.View style={[StyleSheet.absoluteFill, { overflow: 'hidden', borderRadius: 28 }, rightStyle]}>
                <View style={[s.formHalf, { right: 0, width: '50%' }]} />
              </Animated.View>

              {/* Actual form content (always rendered, clipped by halves fading in) */}
              <Animated.View style={[s.formCard, { opacity: headerOp }]}>
                {/* Corner brackets */}
                <View style={[s.corner, s.cornerTL]} />
                <View style={[s.corner, s.cornerTR]} />
                <View style={[s.corner, s.cornerBL]} />
                <View style={[s.corner, s.cornerBR]} />

                {/* Field counter */}
                <View style={s.fieldCounter}>
                  {['CALLSIGN','ID','PASSPHRASE','CONFIRM'].map((label, i) => {
                    const filled = [!!username, !!email, !!password, !!confirmPassword][i];
                    return (
                      <View key={label} style={[s.fieldDot, filled && s.fieldDotFilled]}>
                        <Text style={[s.fieldDotLabel, filled && { color: BG }]}>{i + 1}</Text>
                      </View>
                    );
                  })}
                </View>

                <View style={s.inputGroup}>
                  <Text style={s.inputLabel}>◈ CALLSIGN</Text>
                  <TextInput style={s.input} placeholder="Username" placeholderTextColor={`${CHR}35`}
                    value={username} onChangeText={setUsername} autoCapitalize="none" autoCorrect={false} />
                </View>

                <View style={s.inputGroup}>
                  <Text style={s.inputLabel}>◈ IDENTIFIER</Text>
                  <TextInput style={s.input} placeholder="Email address" placeholderTextColor={`${CHR}35`}
                    value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
                </View>

                <View style={s.inputGroup}>
                  <Text style={s.inputLabel}>◈ PASSPHRASE</Text>
                  <View style={s.passwordRow}>
                    <TextInput style={[s.input, { flex: 1 }]} placeholder="Min. 6 characters" placeholderTextColor={`${CHR}35`}
                      value={password} onChangeText={setPassword} secureTextEntry={!showPassword} />
                    <Pressable style={s.eyeBtn} onPress={() => setShowPassword(v => !v)}>
                      {showPassword ? <EyeOff size={18} color={`${CHR}60`} strokeWidth={2} /> : <Eye size={18} color={`${CHR}60`} strokeWidth={2} />}
                    </Pressable>
                  </View>
                </View>

                <View style={s.inputGroup}>
                  <Text style={s.inputLabel}>◈ CONFIRM PASSPHRASE</Text>
                  <View style={s.passwordRow}>
                    <TextInput style={[s.input, { flex: 1 }]} placeholder="Re-enter password" placeholderTextColor={`${CHR}35`}
                      value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry={!showConfirm} />
                    <Pressable style={s.eyeBtn} onPress={() => setShowConfirm(v => !v)}>
                      {showConfirm ? <EyeOff size={18} color={`${CHR}60`} strokeWidth={2} /> : <Eye size={18} color={`${CHR}60`} strokeWidth={2} />}
                    </Pressable>
                  </View>
                </View>
              </Animated.View>
            </View>

            {/* ── CTA ── */}
            <Animated.View style={btnAnimStyle}>
              <Pressable style={({ pressed }) => [s.ctaBtn, pressed && s.ctaPressed]} onPress={handleRegister} disabled={loading}>
                <View style={s.ctaBtnGlow} />
                {loading ? (
                  <ActivityIndicator color={BG} />
                ) : (
                  <View style={s.ctaContent}>
                    <Text style={s.ctaText}>Join the Vanguard</Text>
                    <View style={s.ctaArrow}><Text style={s.ctaArrowText}>▶</Text></View>
                  </View>
                )}
              </Pressable>
            </Animated.View>

            {/* ── Divider ── */}
            <View style={s.divider}>
              <View style={s.dividerLine} />
              <Text style={s.dividerText}>or</Text>
              <View style={s.dividerLine} />
            </View>

            <Pressable style={s.secondaryBtn} onPress={() => router.back()} disabled={loading}>
              <Text style={s.secondaryText}>Already enlisted? <Text style={{ color: SAGE, fontWeight: '800' }}>Authenticate.</Text></Text>
            </Pressable>
          </Animated.ScrollView>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG },
  container: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 60 },

  // ── Boot overlay ──
  bootOverlay: {
    backgroundColor: CHR,
    alignItems: 'center', justifyContent: 'center',
    zIndex: 100,
    padding: 40,
  },
  bootTitle: { fontSize: 26, fontWeight: '900', color: BG, letterSpacing: 8, marginBottom: 8 },
  bootSub: { fontSize: 9, fontWeight: '700', color: `${SAGE}80`, letterSpacing: 3, marginBottom: 40, textTransform: 'uppercase' },
  bootBarTrack: {
    width: '80%', height: 6, borderRadius: 3,
    backgroundColor: `${BG}20`, overflow: 'hidden', marginBottom: 12,
  },
  bootBar: { height: '100%', borderRadius: 3 },
  bootPct: { fontSize: 9, fontWeight: '700', color: `${BG}40`, letterSpacing: 2 },
  gridLine: { position: 'absolute', left: 0, right: 0, height: 1, backgroundColor: `${BG}06` },

  // ── Confirmation screen ──
  confirmRoot: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  successOrbWrap: { alignItems: 'center', justifyContent: 'center', marginBottom: 32, width: 110, height: 110 },
  successGlow: {
    position: 'absolute', width: 110, height: 110, borderRadius: 55,
    backgroundColor: SAGE, opacity: 0.2,
    shadowColor: SAGE, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 1, shadowRadius: 30,
  },
  successOrb: {
    width: 80, height: 80, borderRadius: 26,
    backgroundColor: SAGE,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: SAGE, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 16,
    elevation: 10,
  },
  successIcon: { fontSize: 36, color: BG, fontWeight: '900' },
  confirmTitle: { fontSize: 30, fontWeight: '900', color: CHR, letterSpacing: -0.8, textAlign: 'center', marginBottom: 12 },
  confirmSub: { fontSize: 15, color: `${CHR}70`, textAlign: 'center', lineHeight: 24, marginBottom: 8 },
  confirmHint: { fontSize: 13, color: `${CHR}45`, textAlign: 'center', lineHeight: 20 },

  // ── Hero ──
  heroWrap: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, paddingHorizontal: 4 },
  rankBars: { flexDirection: 'row', gap: 4, alignItems: 'flex-end' },
  rankBar: { width: 5, borderRadius: 3 },
  heroTextWrap: { flex: 1, alignItems: 'center' },
  eyebrow: { fontSize: 8, fontWeight: '900', color: SAGE, letterSpacing: 2.5, marginBottom: 6, textTransform: 'uppercase' },
  heroTitle: { fontSize: 32, fontWeight: '900', color: CHR, letterSpacing: -1, marginBottom: 4 },
  heroSub: { fontSize: 12, color: `${CHR}55`, fontWeight: '600', textAlign: 'center' },

  // ── Error ──
  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: `${TERR}12`, paddingVertical: 12, paddingHorizontal: 16,
    borderRadius: 16, marginBottom: 16,
    borderWidth: 1, borderColor: `${TERR}30`,
    borderLeftWidth: 3, borderLeftColor: TERR,
  },
  errorDot: { fontSize: 18, color: TERR },
  errorText: { flex: 1, fontSize: 13, fontWeight: '700', color: TERR },

  // ── Form ──
  formOuter: { marginBottom: 24, minHeight: 320 },
  formHalf: { position: 'absolute', top: 0, bottom: 0, backgroundColor: `${CHR}08` },
  formCard: {
    backgroundColor: `${CHR}04`,
    padding: 22, borderRadius: 28,
    borderWidth: 1.5, borderColor: `${CHR}10`,
    gap: 18,
    position: 'relative',
    shadowColor: '#B8ACA0',
    shadowOffset: { width: 6, height: 8 },
    shadowOpacity: 0.18, shadowRadius: 16,
    elevation: 4,
  },

  // Field progress dots
  fieldCounter: { flexDirection: 'row', gap: 8, alignSelf: 'flex-end', marginBottom: 4 },
  fieldDot: {
    width: 24, height: 24, borderRadius: 8,
    backgroundColor: `${CHR}08`,
    borderWidth: 1, borderColor: `${CHR}15`,
    alignItems: 'center', justifyContent: 'center',
  },
  fieldDotFilled: { backgroundColor: SAGE, borderColor: SAGE },
  fieldDotLabel: { fontSize: 10, fontWeight: '900', color: `${CHR}50` },

  // Corner brackets
  corner: { position: 'absolute', width: 14, height: 14, borderColor: `${SAGE}50` },
  cornerTL: { top: 10, left: 10, borderTopWidth: 2, borderLeftWidth: 2, borderRadius: 4 },
  cornerTR: { top: 10, right: 10, borderTopWidth: 2, borderRightWidth: 2, borderRadius: 4 },
  cornerBL: { bottom: 10, left: 10, borderBottomWidth: 2, borderLeftWidth: 2, borderRadius: 4 },
  cornerBR: { bottom: 10, right: 10, borderBottomWidth: 2, borderRightWidth: 2, borderRadius: 4 },

  inputGroup: { gap: 8 },
  inputLabel: { fontSize: 9, fontWeight: '900', color: SAGE, letterSpacing: 2.5, textTransform: 'uppercase' },
  input: {
    backgroundColor: BG, height: 52, borderRadius: 18,
    paddingHorizontal: 18, fontSize: 16, fontWeight: '600', color: CHR,
    borderWidth: 1.5, borderColor: `${CHR}10`,
    shadowColor: '#B8ACA0', shadowOffset: { width: 2, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8,
    elevation: 2,
  },
  passwordRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  eyeBtn: {
    width: 52, height: 52, borderRadius: 18,
    backgroundColor: BG, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: `${CHR}10`,
    shadowColor: '#B8ACA0', shadowOffset: { width: 2, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8,
    elevation: 2,
  },

  // ── CTA ──
  ctaBtn: {
    height: 64, borderRadius: 22,
    backgroundColor: CHR,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 20, overflow: 'hidden',
    shadowColor: CHR, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.35, shadowRadius: 20,
    elevation: 10,
  },
  ctaPressed: { transform: [{ scale: 0.97 }], shadowOpacity: 0.15 },
  ctaBtnGlow: {
    position: 'absolute', top: 0, left: '20%', right: '20%', height: '50%',
    backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 100,
  },
  ctaContent: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  ctaText: { fontSize: 17, fontWeight: '900', color: BG, letterSpacing: 0.5 },
  ctaArrow: {
    width: 32, height: 32, borderRadius: 10,
    backgroundColor: SAGE, alignItems: 'center', justifyContent: 'center',
  },
  ctaArrowText: { color: BG, fontSize: 12, fontWeight: '900' },

  // ── Divider ──
  divider: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 },
  dividerLine: { flex: 1, height: 1, backgroundColor: `${CHR}12` },
  dividerText: { fontSize: 12, fontWeight: '700', color: `${CHR}35` },

  secondaryBtn: { alignItems: 'center', paddingVertical: 8 },
  secondaryText: { fontSize: 14, fontWeight: '600', color: `${CHR}50` },
});
