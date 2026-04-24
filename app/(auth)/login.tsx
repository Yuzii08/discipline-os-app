import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TextInput, Pressable,
  ActivityIndicator, KeyboardAvoidingView, Platform,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { AuthService } from '../../services/authService';
import { Eye, EyeOff, CheckSquare, Square } from 'lucide-react-native';
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
  runOnJS,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

const { width: W, height: H } = Dimensions.get('window');

// ── Theme ──
const BG   = '#F9F7F2';
const CHR  = '#3D405B';
const SAGE = '#81B29A';
const TERR = '#E07A5F';
const MUST = '#F2CC8F';

const CREDENTIALS_KEY = 'discipline_os_saved_credentials';

// ── Floating particle component ──
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
    transform: [
      { translateY: translateY.value },
      { rotate: `${rotate.value}deg` },
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[{
        position: 'absolute',
        left: x,
        bottom: 0,
        width: size,
        height: size,
        borderRadius: size / 4,
        backgroundColor: color,
      }, style]}
    />
  );
}

// ── Particle field ──
const PARTICLES = Array.from({ length: 14 }, (_, i) => ({
  id: i,
  delay: i * 400,
  size: 6 + Math.random() * 14,
  x: Math.random() * W,
  color: [SAGE, MUST, TERR, `${CHR}30`][i % 4],
}));

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail]           = useState('');
  const [password, setPassword]     = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading]       = useState(false);
  const [errorMsg, setErrorMsg]     = useState('');
  const [scanDone, setScanDone]     = useState(false);

  // ── Entrance animations ──
  const scanProgress = useSharedValue(0);
  const scanOpacity  = useSharedValue(1);
  const contentY     = useSharedValue(40);
  const contentOp    = useSharedValue(0);
  const orbScale     = useSharedValue(0.4);
  const orbGlow      = useSharedValue(0);
  const titleX       = useSharedValue(-W);
  const formOp       = useSharedValue(0);
  const formY        = useSharedValue(30);
  const btnScale     = useSharedValue(0.8);
  const btnOp        = useSharedValue(0);
  const errorShake   = useSharedValue(0);
  const btnPulse     = useSharedValue(1);

  useEffect(() => {
    const loadCredentials = async () => {
      try {
        const s = await SecureStore.getItemAsync(CREDENTIALS_KEY);
        if (s) {
          const { savedEmail, savedPassword } = JSON.parse(s);
          if (savedEmail && savedPassword) { setEmail(savedEmail); setPassword(savedPassword); setRememberMe(true); }
        }
      } catch {}
    };
    loadCredentials();

    // Sequence: scan → fade out → content in
    scanProgress.value = withTiming(1, { duration: 1200, easing: Easing.out(Easing.quad) });
    
    setTimeout(() => {
      scanOpacity.value = withTiming(0, { duration: 400 });
      runOnJS(setScanDone)(true);

      // Content enters
      contentOp.value = withTiming(1, { duration: 500 });
      contentY.value  = withTiming(0, { duration: 500, easing: Easing.out(Easing.back(1.5)) });

      // Orb
      orbScale.value = withDelay(100, withSpring(1, { damping: 12, stiffness: 120 }));
      orbGlow.value  = withDelay(300, withRepeat(
        withSequence(withTiming(1, { duration: 2000 }), withTiming(0.3, { duration: 2000 })),
        -1, true
      ));

      // Title slides in
      titleX.value = withDelay(200, withSpring(0, { damping: 14, stiffness: 100 }));

      // Form
      formOp.value = withDelay(350, withTiming(1, { duration: 400 }));
      formY.value  = withDelay(350, withTiming(0, { duration: 400, easing: Easing.out(Easing.cubic) }));

      // Button
      btnOp.value    = withDelay(500, withTiming(1, { duration: 300 }));
      btnScale.value = withDelay(500, withSpring(1, { damping: 10, stiffness: 120 }));

      // Persistent button pulse
      setTimeout(() => {
        btnPulse.value = withRepeat(
          withSequence(withTiming(1.03, { duration: 900 }), withTiming(1, { duration: 900 })),
          -1, true
        );
      }, 1200);
    }, 1400);
  }, []);

  const handleLogin = async () => {
    if (!email || !password) {
      setErrorMsg('Enter both email and password.');
      errorShake.value = withSequence(
        withTiming(-12, { duration: 60 }), withTiming(12, { duration: 60 }),
        withTiming(-8, { duration: 60 }), withTiming(8, { duration: 60 }),
        withTiming(0, { duration: 60 })
      );
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    setLoading(true);
    setErrorMsg('');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await AuthService.login(email.trim(), password);
      if (rememberMe) {
        await SecureStore.setItemAsync(CREDENTIALS_KEY, JSON.stringify({ savedEmail: email.trim(), savedPassword: password }));
      } else {
        await SecureStore.deleteItemAsync(CREDENTIALS_KEY);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Login failed.');
      errorShake.value = withSequence(
        withTiming(-12, { duration: 60 }), withTiming(12, { duration: 60 }),
        withTiming(-8, { duration: 60 }), withTiming(8, { duration: 60 }),
        withTiming(0, { duration: 60 })
      );
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setLoading(false);
    }
  };

  // ── Animated styles ──
  const scanLineStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: interpolate(scanProgress.value, [0, 1], [0, H]) }],
    opacity: scanOpacity.value,
  }));
  const scanOverlayStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scanProgress.value, [0, 0.3, 1], [1, 0.6, 0]),
  }));
  const contentStyle   = useAnimatedStyle(() => ({ opacity: contentOp.value, transform: [{ translateY: contentY.value }] }));
  const orbContStyle   = useAnimatedStyle(() => ({ transform: [{ scale: orbScale.value }] }));
  const orbGlowStyle   = useAnimatedStyle(() => ({ opacity: interpolate(orbGlow.value, [0, 1], [0.3, 0.9]) }));
  const titleStyle     = useAnimatedStyle(() => ({ transform: [{ translateX: titleX.value }] }));
  const formStyle      = useAnimatedStyle(() => ({ opacity: formOp.value, transform: [{ translateY: formY.value }] }));
  const btnStyle       = useAnimatedStyle(() => ({ opacity: btnOp.value, transform: [{ scale: btnScale.value * btnPulse.value }] }));
  const errorStyle     = useAnimatedStyle(() => ({ transform: [{ translateX: errorShake.value }] }));

  return (
    <View style={s.root}>
      {/* ── Particle field ── */}
      {PARTICLES.map(p => (
        <Particle key={p.id} delay={p.delay} size={p.size} x={p.x} color={p.color} />
      ))}

      {/* ── Scan intro overlay ── */}
      {!scanDone && (
        <>
          <Animated.View style={[StyleSheet.absoluteFill, s.scanBg, scanOverlayStyle]} />
          <Animated.View style={[s.scanLine, scanLineStyle]} />
          <View style={s.scanTextWrap}>
            <Text style={s.scanText}>CADENCE OS</Text>
            <Text style={s.scanSub}>INITIALIZING IDENTITY CHECK</Text>
            <View style={s.scanDots}>
              {[0,1,2].map(i => <View key={i} style={s.scanDot} />)}
            </View>
          </View>
        </>
      )}

      {/* ── Main content ── */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <SafeAreaView style={{ flex: 1 }}>
          <Animated.ScrollView
            style={[{ flex: 1 }, contentStyle]}
            contentContainerStyle={s.container}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* ── Animated orb hero ── */}
            <Animated.View style={[s.orbWrap, orbContStyle]}>
              {/* Outer glow ring */}
              <Animated.View style={[s.orbGlow, orbGlowStyle]} />
              {/* Mid ring */}
              <View style={s.orbRing} />
              {/* Core orb */}
              <View style={s.orbCore}>
                <View style={s.orbInner} />
                <View style={s.orbShine} />
              </View>
              {/* Status dot */}
              <View style={s.statusDot} />
            </Animated.View>

            {/* ── Title ── */}
            <Animated.View style={[s.titleWrap, titleStyle]}>
              <Text style={s.eyebrow}>▸ IDENTITY VERIFICATION</Text>
              <Text style={s.heroTitle}>Enter the Arena</Text>
              <Text style={s.heroSub}>Authenticate your identity to resume protocols.</Text>
            </Animated.View>

            {/* ── Error ── */}
            {!!errorMsg && (
              <Animated.View style={[s.errorBox, errorStyle]}>
                <Text style={s.errorDot}>⬡</Text>
                <Text style={s.errorText}>{errorMsg}</Text>
              </Animated.View>
            )}

            {/* ── Form ── */}
            <Animated.View style={[s.formCard, formStyle]}>
              {/* Decorative corner marks */}
              <View style={[s.corner, s.cornerTL]} />
              <View style={[s.corner, s.cornerTR]} />
              <View style={[s.corner, s.cornerBL]} />
              <View style={[s.corner, s.cornerBR]} />

              <View style={s.inputGroup}>
                <Text style={s.inputLabel}>◈ IDENTIFIER</Text>
                <TextInput
                  style={s.input}
                  placeholder="Email address"
                  placeholderTextColor={`${CHR}35`}
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>

              <View style={s.inputGroup}>
                <Text style={s.inputLabel}>◈ PASSPHRASE</Text>
                <View style={s.passwordRow}>
                  <TextInput
                    style={[s.input, { flex: 1 }]}
                    placeholder="Password"
                    placeholderTextColor={`${CHR}35`}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                  />
                  <Pressable style={s.eyeBtn} onPress={() => setShowPassword(v => !v)}>
                    {showPassword
                      ? <EyeOff size={18} color={`${CHR}60`} strokeWidth={2} />
                      : <Eye size={18} color={`${CHR}60`} strokeWidth={2} />}
                  </Pressable>
                </View>
              </View>

              <Pressable style={s.rememberRow} onPress={() => setRememberMe(!rememberMe)} disabled={loading}>
                {rememberMe
                  ? <CheckSquare size={18} color={SAGE} strokeWidth={2.5} />
                  : <Square size={18} color={`${CHR}35`} strokeWidth={2.5} />}
                <Text style={s.rememberText}>Save Login Credentials</Text>
              </Pressable>
            </Animated.View>

            {/* ── CTA Button ── */}
            <Animated.View style={btnStyle}>
              <Pressable
                style={({ pressed }) => [s.ctaBtn, pressed && s.ctaPressed]}
                onPress={handleLogin}
                disabled={loading}
              >
                {/* Button inner glow */}
                <View style={s.ctaBtnGlow} />
                {loading ? (
                  <ActivityIndicator color={BG} />
                ) : (
                  <View style={s.ctaContent}>
                    <Text style={s.ctaText}>Initiate Sequence</Text>
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

            {/* ── Secondary ── */}
            <Pressable style={s.secondaryBtn} onPress={() => router.push('/register')} disabled={loading}>
              <Text style={s.secondaryText}>No account? <Text style={{ color: SAGE, fontWeight: '800' }}>Enlist here.</Text></Text>
            </Pressable>

          </Animated.ScrollView>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG },
  container: { paddingHorizontal: 24, paddingTop: 20, paddingBottom: 60 },

  // ── Scan intro ──
  scanBg: { backgroundColor: CHR, zIndex: 100 },
  scanLine: {
    position: 'absolute', top: 0, left: 0, right: 0,
    height: 3,
    backgroundColor: SAGE,
    shadowColor: SAGE, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 1, shadowRadius: 16,
    zIndex: 101,
  },
  scanTextWrap: {
    position: 'absolute', top: '40%', left: 0, right: 0,
    alignItems: 'center', zIndex: 102,
  },
  scanText: { fontSize: 28, fontWeight: '900', color: BG, letterSpacing: 8 },
  scanSub: { fontSize: 10, fontWeight: '700', color: `${BG}60`, letterSpacing: 3, marginTop: 8, textTransform: 'uppercase' },
  scanDots: { flexDirection: 'row', gap: 8, marginTop: 20 },
  scanDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: SAGE },

  // ── Orb ──
  orbWrap: { alignItems: 'center', justifyContent: 'center', marginTop: 16, marginBottom: 28, height: 140 },
  orbGlow: {
    position: 'absolute',
    width: 160, height: 160, borderRadius: 80,
    backgroundColor: SAGE,
    shadowColor: SAGE, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 1, shadowRadius: 40,
  },
  orbRing: {
    position: 'absolute',
    width: 120, height: 120, borderRadius: 60,
    borderWidth: 1.5, borderColor: `${SAGE}50`,
    backgroundColor: 'transparent',
  },
  orbCore: {
    width: 90, height: 90, borderRadius: 30,
    backgroundColor: CHR,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: CHR, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 20,
    elevation: 12,
    borderWidth: 1, borderColor: `${SAGE}30`,
  },
  orbInner: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: SAGE,
    shadowColor: SAGE, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8, shadowRadius: 12,
  },
  orbShine: {
    position: 'absolute', top: 10, left: 12,
    width: 20, height: 8, borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  statusDot: {
    position: 'absolute', bottom: 0, right: 0,
    width: 14, height: 14, borderRadius: 7,
    backgroundColor: SAGE,
    borderWidth: 2, borderColor: BG,
    shadowColor: SAGE, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 1, shadowRadius: 6,
  },

  // ── Title ──
  titleWrap: { alignItems: 'center', marginBottom: 20 },
  eyebrow: { fontSize: 9, fontWeight: '900', color: SAGE, letterSpacing: 3, marginBottom: 8, textTransform: 'uppercase' },
  heroTitle: { fontSize: 34, fontWeight: '900', color: CHR, letterSpacing: -1, marginBottom: 6 },
  heroSub: { fontSize: 13, color: `${CHR}55`, fontWeight: '600', textAlign: 'center', paddingHorizontal: 24, lineHeight: 20 },

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

  // ── Form card ──
  formCard: {
    backgroundColor: `${CHR}05`,
    padding: 24, borderRadius: 28, marginBottom: 24,
    borderWidth: 1.5, borderColor: `${CHR}10`,
    gap: 20,
    position: 'relative',
    shadowColor: '#B8ACA0',
    shadowOffset: { width: 6, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 4,
  },
  // Corner bracket decorations
  corner: {
    position: 'absolute', width: 14, height: 14,
    borderColor: `${SAGE}50`,
  },
  cornerTL: { top: 10, left: 10, borderTopWidth: 2, borderLeftWidth: 2, borderRadius: 4 },
  cornerTR: { top: 10, right: 10, borderTopWidth: 2, borderRightWidth: 2, borderRadius: 4 },
  cornerBL: { bottom: 10, left: 10, borderBottomWidth: 2, borderLeftWidth: 2, borderRadius: 4 },
  cornerBR: { bottom: 10, right: 10, borderBottomWidth: 2, borderRightWidth: 2, borderRadius: 4 },

  inputGroup: { gap: 8 },
  inputLabel: { fontSize: 9, fontWeight: '900', color: SAGE, letterSpacing: 2.5, textTransform: 'uppercase' },
  input: {
    backgroundColor: BG,
    height: 54, borderRadius: 18,
    paddingHorizontal: 18, fontSize: 16, fontWeight: '600', color: CHR,
    borderWidth: 1.5, borderColor: `${CHR}10`,
    shadowColor: '#B8ACA0',
    shadowOffset: { width: 2, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 2,
  },
  passwordRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  eyeBtn: {
    width: 54, height: 54, borderRadius: 18,
    backgroundColor: BG,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: `${CHR}10`,
    shadowColor: '#B8ACA0', shadowOffset: { width: 2, height: 4 }, shadowOpacity: 0.12, shadowRadius: 8,
    elevation: 2,
  },
  rememberRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingTop: 4 },
  rememberText: { fontSize: 13, fontWeight: '700', color: `${CHR}60` },

  // ── CTA ──
  ctaBtn: {
    height: 64, borderRadius: 22,
    backgroundColor: CHR,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 20,
    overflow: 'hidden',
    shadowColor: CHR,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 10,
  },
  ctaPressed: { transform: [{ scale: 0.97 }], shadowOpacity: 0.15 },
  ctaBtnGlow: {
    position: 'absolute', top: 0, left: '20%', right: '20%', height: '50%',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 100,
  },
  ctaContent: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  ctaText: { fontSize: 17, fontWeight: '900', color: BG, letterSpacing: 0.5 },
  ctaArrow: {
    width: 32, height: 32, borderRadius: 10,
    backgroundColor: SAGE,
    alignItems: 'center', justifyContent: 'center',
  },
  ctaArrowText: { color: BG, fontSize: 12, fontWeight: '900' },

  // ── Divider ──
  divider: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 },
  dividerLine: { flex: 1, height: 1, backgroundColor: `${CHR}12` },
  dividerText: { fontSize: 12, fontWeight: '700', color: `${CHR}35` },

  // ── Secondary ──
  secondaryBtn: { alignItems: 'center', paddingVertical: 8 },
  secondaryText: { fontSize: 14, fontWeight: '600', color: `${CHR}50` },
});
