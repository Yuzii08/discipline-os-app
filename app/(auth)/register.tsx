import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, Pressable,
  ActivityIndicator, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { AuthService } from '../../services/authService';
import { UserPlus, ArrowRight, ShieldAlert, MailCheck, Eye, EyeOff } from 'lucide-react-native';

const BG   = '#F9F7F2';
const CHR  = '#3D405B';
const SAGE = '#81B29A';
const TERR = '#E07A5F';

const clay = {
  shadowColor: '#B8ACA0',
  shadowOffset: { width: 6, height: 8 },
  shadowOpacity: 0.28,
  shadowRadius: 16,
  elevation: 6,
};

export default function RegisterScreen() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [needsConfirmation, setNeedsConfirmation] = useState(false);

  const handleRegister = async () => {
    if (!username || !email || !password || !confirmPassword) {
      setErrorMsg('All sectors must be filled');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match');
      return;
    }
    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    try {
      const { needsConfirmation } = await AuthService.signup(email.trim(), password, username.trim());
      if (needsConfirmation) {
        setNeedsConfirmation(true);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  if (needsConfirmation) {
    return (
      <SafeAreaView style={[styles.root, styles.center]}>
        <View style={[styles.iconWrap, clay, { marginBottom: 28 }]}>
          <MailCheck size={36} color={SAGE} strokeWidth={2} />
        </View>
        <Text style={styles.heroTitle}>Check Your Email</Text>
        <Text style={[styles.heroSub, { marginTop: 10, marginBottom: 36, paddingHorizontal: 32 }]}>
          We sent a link to{'\n'}
          <Text style={{ color: CHR, fontWeight: '800' }}>{email}</Text>
          {'\n\n'}Click it to activate your account, then log in.
        </Text>
        <Pressable
          style={({ pressed }) => [styles.primaryBtn, pressed && { opacity: 0.8 }]}
          onPress={() => router.replace('/(auth)/login')}
        >
          <Text style={styles.primaryBtnText}>Go to Login</Text>
          <ArrowRight size={18} color={BG} strokeWidth={2.5} />
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        bounces={true}
      >
        {/* ── HERO ── */}
        <View style={styles.heroBox}>
          <View style={[styles.iconWrap, clay]}>
            <UserPlus size={36} color={CHR} strokeWidth={2} />
          </View>
          <Text style={styles.heroTitle}>Enlistment</Text>
          <Text style={styles.heroSub}>There is no retreating from this point.</Text>
        </View>

        {/* ── ERROR ── */}
        {!!errorMsg && (
          <View style={[styles.errorBox, clay]}>
            <ShieldAlert size={16} color={TERR} strokeWidth={2.5} />
            <Text style={styles.errorText}>{errorMsg}</Text>
          </View>
        )}

        {/* ── FORM ── */}
        <View style={[styles.formCard, clay]}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>CALLSIGN</Text>
            <TextInput
              style={styles.input}
              placeholder="Username"
              placeholderTextColor={`${CHR}40`}
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>IDENTIFIER</Text>
            <TextInput
              style={styles.input}
              placeholder="Email address"
              placeholderTextColor={`${CHR}40`}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>PASSPHRASE</Text>
            <View style={styles.passwordRow}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="Min. 6 characters"
                placeholderTextColor={`${CHR}40`}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <Pressable style={styles.eyeBtn} onPress={() => setShowPassword(v => !v)}>
                {showPassword
                  ? <EyeOff size={20} color={`${CHR}60`} strokeWidth={2} />
                  : <Eye size={20} color={`${CHR}60`} strokeWidth={2} />}
              </Pressable>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>CONFIRM PASSPHRASE</Text>
            <View style={styles.passwordRow}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="Re-enter password"
                placeholderTextColor={`${CHR}40`}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirmPassword}
              />
              <Pressable style={styles.eyeBtn} onPress={() => setShowConfirmPassword(v => !v)}>
                {showConfirmPassword
                  ? <EyeOff size={20} color={`${CHR}60`} strokeWidth={2} />
                  : <Eye size={20} color={`${CHR}60`} strokeWidth={2} />}
              </Pressable>
            </View>
          </View>
        </View>

        {/* ── SUBMIT ── */}
        <Pressable
          style={({ pressed }) => [styles.primaryBtn, pressed && { opacity: 0.8 }]}
          onPress={handleRegister}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={BG} />
          ) : (
            <>
              <Text style={styles.primaryBtnText}>Join the Vanguard</Text>
              <ArrowRight size={18} color={BG} strokeWidth={2.5} />
            </>
          )}
        </Pressable>

        <Pressable style={styles.secondaryBtn} onPress={() => router.back()} disabled={loading}>
          <Text style={styles.secondaryBtnText}>Already enlisted? Authenticate.</Text>
        </Pressable>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG },
  center: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  container: { paddingHorizontal: 28, paddingTop: 48, paddingBottom: 80 },

  heroBox: { alignItems: 'center', marginBottom: 24 },
  iconWrap: {
    width: 72, height: 72, borderRadius: 24, backgroundColor: BG,
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)',
  },
  heroTitle: { fontSize: 32, fontWeight: '900', color: CHR, letterSpacing: -1, marginBottom: 6 },
  heroSub: { fontSize: 13, color: `${CHR}60`, fontWeight: '600', textAlign: 'center' },

  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#F5E6E6', padding: 14, borderRadius: 16, marginBottom: 16,
    borderLeftWidth: 4, borderLeftColor: TERR,
  },
  errorText: { flex: 1, fontSize: 13, fontWeight: '700', color: TERR },

  formCard: {
    backgroundColor: BG, padding: 20, borderRadius: 24, marginBottom: 24,
    borderWidth: 1.5, borderColor: 'rgba(0,0,0,0.09)', gap: 16,
    elevation: 0,
  },
  inputGroup: { gap: 6 },
  inputLabel: { fontSize: 10, fontWeight: '900', color: `${CHR}50`, letterSpacing: 1.5, textTransform: 'uppercase' },
  input: {
    backgroundColor: `${CHR}06`, height: 50, borderRadius: 16,
    paddingHorizontal: 16, fontSize: 16, fontWeight: '600', color: CHR,
  },
  passwordRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  eyeBtn: {
    width: 48, height: 50, borderRadius: 16,
    backgroundColor: `${CHR}06`, alignItems: 'center', justifyContent: 'center',
  },

  primaryBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    height: 60, borderRadius: 20, backgroundColor: SAGE,
    marginBottom: 16,
    elevation: 4,
  },
  primaryBtnText: { color: BG, fontSize: 16, fontWeight: '900', letterSpacing: 0.5 },

  secondaryBtn: { paddingVertical: 12, alignItems: 'center' },
  secondaryBtnText: { color: `${CHR}70`, fontSize: 14, fontWeight: '700' },
});
