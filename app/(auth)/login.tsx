import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TextInput, Pressable,
  ActivityIndicator, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { AuthService } from '../../services/authService';
import { ShieldAlert, ArrowRight, Lock, CheckSquare, Square, Eye, EyeOff } from 'lucide-react-native';

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

// No-shadow card for Android to prevent shadow painting over siblings
const flatCard = {
  borderWidth: 1.5,
  borderColor: 'rgba(0,0,0,0.08)',
  elevation: 0,
};

const CREDENTIALS_KEY = 'discipline_os_saved_credentials';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const loadCredentials = async () => {
      try {
        const savedStr = await SecureStore.getItemAsync(CREDENTIALS_KEY);
        if (savedStr) {
          const { savedEmail, savedPassword } = JSON.parse(savedStr);
          if (savedEmail && savedPassword) {
            setEmail(savedEmail);
            setPassword(savedPassword);
            setRememberMe(true);
          }
        }
      } catch (e) {
        console.warn('Failed to load credentials', e);
      }
    };
    loadCredentials();
  }, []);

  const handleLogin = async () => {
    if (!email || !password) {
      setErrorMsg('Enter both email and password.');
      return;
    }
    setLoading(true);
    setErrorMsg('');
    try {
      await AuthService.login(email.trim(), password);
      if (rememberMe) {
        await SecureStore.setItemAsync(CREDENTIALS_KEY, JSON.stringify({ savedEmail: email.trim(), savedPassword: password }));
      } else {
        await SecureStore.deleteItemAsync(CREDENTIALS_KEY);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        bounces={true}
      >
        {/* ── HERO GRAPHIC ── */}
        <View style={styles.heroBox}>
          <View style={[styles.iconWrap, clay]}>
            <Lock size={36} color={CHR} strokeWidth={2} />
          </View>
          <Text style={styles.heroTitle}>Enter the Arena</Text>
          <Text style={styles.heroSub}>Authenticate your identity to resume protocols.</Text>
        </View>

        {/* ── ERROR ── */}
        {!!errorMsg && (
          <View style={[styles.errorBox, clay]}>
            <ShieldAlert size={16} color={TERR} strokeWidth={2.5} />
            <Text style={styles.errorText}>{errorMsg}</Text>
          </View>
        )}

        <View style={[styles.formCard, clay]}>
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
                placeholder="Password"
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

          <Pressable
            style={styles.rememberRow}
            onPress={() => setRememberMe(!rememberMe)}
            disabled={loading}
          >
            {rememberMe
              ? <CheckSquare size={20} color={SAGE} strokeWidth={2.5} />
              : <Square size={20} color={`${CHR}40`} strokeWidth={2.5} />
            }
            <Text style={styles.rememberText}>Save Login Credentials</Text>
          </Pressable>
        </View>

        {/* ── ACTIONS ── */}
        <Pressable
          style={({ pressed }) => [styles.primaryBtn, pressed && { opacity: 0.8 }]}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={BG} />
          ) : (
            <>
              <Text style={styles.primaryBtnText}>Initiate Sequence</Text>
              <ArrowRight size={18} color={BG} strokeWidth={2.5} />
            </>
          )}
        </Pressable>

        <Pressable
          style={styles.secondaryBtn}
          onPress={() => router.push('/register')}
          disabled={loading}
        >
          <Text style={styles.secondaryBtnText}>No account? Enlist here.</Text>
        </Pressable>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG },
  container: { paddingHorizontal: 28, paddingTop: 60, paddingBottom: 80 },

  heroBox: { alignItems: 'center', marginBottom: 32 },
  iconWrap: {
    width: 72, height: 72, borderRadius: 24, backgroundColor: BG,
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)',
  },
  heroTitle: { fontSize: 32, fontWeight: '900', color: CHR, letterSpacing: -1, marginBottom: 6 },
  heroSub: { fontSize: 13, color: `${CHR}60`, fontWeight: '600', textAlign: 'center', paddingHorizontal: 20 },

  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#F5E6E6', padding: 14, borderRadius: 16, marginBottom: 20,
    borderLeftWidth: 4, borderLeftColor: TERR,
  },
  errorText: { flex: 1, fontSize: 13, fontWeight: '700', color: TERR },

  formCard: {
    backgroundColor: BG, padding: 24, borderRadius: 24, marginBottom: 32,
    borderWidth: 1.5, borderColor: 'rgba(0,0,0,0.09)', gap: 20,
    elevation: 0,
  },
  inputGroup: { gap: 8 },
  inputLabel: { fontSize: 10, fontWeight: '900', color: `${CHR}50`, letterSpacing: 1.5, textTransform: 'uppercase' },
  input: {
    backgroundColor: `${CHR}06`, height: 56, borderRadius: 16,
    paddingHorizontal: 16, fontSize: 16, fontWeight: '600', color: CHR,
  },
  passwordRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  eyeBtn: {
    width: 48, height: 56, borderRadius: 16,
    backgroundColor: `${CHR}06`, alignItems: 'center', justifyContent: 'center',
  },

  primaryBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    height: 60, borderRadius: 20, backgroundColor: CHR,
    marginBottom: 20,
    elevation: 4,
  },
  primaryBtnText: { color: BG, fontSize: 16, fontWeight: '900', letterSpacing: 0.5 },

  rememberRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    marginTop: 4, paddingVertical: 4,
  },
  rememberText: { fontSize: 13, fontWeight: '700', color: `${CHR}80` },

  secondaryBtn: { paddingVertical: 12, alignItems: 'center' },
  secondaryBtnText: { color: `${CHR}70`, fontSize: 14, fontWeight: '700' },
});
