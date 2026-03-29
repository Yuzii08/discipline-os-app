import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, Pressable,
  ActivityIndicator, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Check, X } from 'lucide-react-native';
import { supabase } from '../../services/supabase';
import { useUserStore } from '../../store/useUserStore';

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

export default function EditProfileScreen() {
  const router = useRouter();
  const { profile, setProfile } = useUserStore();
  const [username, setUsername] = useState(profile?.username ?? '');
  const [loading, setLoading] = useState(false);

  const save = async () => {
    if (!username.trim()) {
      Alert.alert('Invalid', 'Callsign cannot be empty.');
      return;
    }
    if (!profile?.user_id) return;

    setLoading(true);
    const sb = supabase as any;
    const { error } = await sb
      .from('users')
      .update({ username: username.trim() })
      .eq('user_id', profile.user_id);

    setLoading(false);

    if (error) {
      Alert.alert('Update Failed', error.message);
    } else {
      setProfile({ ...profile, username: username.trim() });
      router.back();
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.container}>
        {/* ── HEADER ── */}
        <View style={styles.topBar}>
          <Pressable style={styles.iconBtn} onPress={() => router.back()}>
            <X size={20} color={CHR} strokeWidth={2.5} />
          </Pressable>
          <Text style={styles.title}>Edit Profile</Text>
          <Pressable style={[styles.iconBtn, { backgroundColor: SAGE }]} onPress={save} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" size="small" /> : <Check size={20} color="#fff" strokeWidth={2.5} />}
          </Pressable>
        </View>

        {/* ── AVATAR (non-editable placeholder) ── */}
        <View style={styles.avatarWrap}>
          <View style={[styles.avatar, clay]}>
            <Text style={styles.avatarLetter}>{(username[0] || 'U').toUpperCase()}</Text>
          </View>
          <Text style={styles.avatarHint}>Avatar support coming soon</Text>
        </View>

        {/* ── FORM ── */}
        <View style={[styles.formCard, clay]}>
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>CALLSIGN</Text>
            <TextInput
              style={styles.input}
              value={username}
              onChangeText={setUsername}
              placeholder="Username"
              placeholderTextColor={`${CHR}40`}
              autoCorrect={false}
              autoCapitalize="none"
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>RANK TIER</Text>
            <View style={[styles.input, styles.readOnly]}>
              <Text style={styles.readOnlyText}>{profile?.global_rank_tier ?? 'INITIATE'}</Text>
              <Text style={styles.readOnlyHint}>Set by the Arena</Text>
            </View>
          </View>
        </View>

        <Text style={styles.disclaimer}>
          Your discipline score and streak cannot be manually edited. They are earned on the field.
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG },
  container: { flex: 1, paddingHorizontal: 24, paddingTop: 60 },

  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 40 },
  iconBtn: { width: 44, height: 44, borderRadius: 16, backgroundColor: `${CHR}10`, alignItems: 'center', justifyContent: 'center' },
  title:   { fontSize: 18, fontWeight: '900', color: CHR },

  avatarWrap: { alignItems: 'center', marginBottom: 36 },
  avatar: {
    width: 90, height: 90, borderRadius: 28,
    backgroundColor: `${SAGE}20`, alignItems: 'center', justifyContent: 'center',
    marginBottom: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)',
  },
  avatarLetter: { fontSize: 40, fontWeight: '900', color: SAGE },
  avatarHint:   { fontSize: 11, color: `${CHR}40`, fontWeight: '600' },

  formCard: {
    backgroundColor: BG, borderRadius: 24, padding: 22,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.5)', gap: 20, marginBottom: 24,
  },
  fieldGroup: { gap: 8 },
  fieldLabel: { fontSize: 10, fontWeight: '900', color: `${CHR}50`, letterSpacing: 1.5, textTransform: 'uppercase' },
  input: {
    height: 52, backgroundColor: `${CHR}06`, borderRadius: 16,
    paddingHorizontal: 16, fontSize: 16, fontWeight: '600', color: CHR,
  },
  readOnly:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  readOnlyText: { fontSize: 15, fontWeight: '800', color: `${CHR}80` },
  readOnlyHint: { fontSize: 11, color: `${CHR}40`, fontWeight: '600' },

  disclaimer: { fontSize: 11, color: `${CHR}40`, fontWeight: '600', textAlign: 'center', lineHeight: 18 },
});
