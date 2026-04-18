import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, Pressable,
  ActivityIndicator, KeyboardAvoidingView, Platform,
  Alert, Image, ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Check, X, Camera, Shield, Award, Zap, Flame } from 'lucide-react-native';
import { supabase } from '../../services/supabase';
import { useUserStore } from '../../store/useUserStore';
import * as ImagePicker from 'expo-image-picker';
import { decode } from 'base64-arraybuffer';
import { useThemeStyles } from '../../hooks/use-theme-styles';

const TIER_COLORS: Record<string, string> = {
  Novice: '#81B29A', Advanced: '#F2CC8F', Elite: '#E07A5F', Legend: '#C77DFF',
};

export default function EditProfileScreen() {
  const { tokens, styles, clay } = useThemeStyles(createStyles);
  const { CHR, SAGE, TERR } = tokens;
  const { clayCard } = clay;

  const router = useRouter();
  const { profile, setProfile, disciplineScore, currentStreak } = useUserStore();
  const [username, setUsername]     = useState(profile?.username ?? '');
  const [avatarUri, setAvatarUri]   = useState<string | null>((profile as any)?.avatar_url ?? null);
  const [loading, setLoading]       = useState(false);
  const [uploading, setUploading]   = useState(false);

  const tier      = profile?.global_rank_tier || 'Novice';
  const tierColor = TIER_COLORS[tier] ?? '#81B29A';
  const initial   = (username[0] || 'U').toUpperCase();

  const pickAvatar = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow photo access.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.75,
      base64: true,
    });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    setUploading(true);
    try {
      const path = `avatars/${profile!.user_id}/avatar.jpg`;
      const { error } = await supabase.storage
        .from('snaps')
        .upload(path, decode(asset.base64!), { contentType: 'image/jpeg', upsert: true });
      if (error) throw error;
      const { data: urlData } = supabase.storage.from('snaps').getPublicUrl(path);
      const publicUrl = urlData.publicUrl + `?t=${Date.now()}`;
      await supabase.from('users').update({ avatar_url: publicUrl } as any).eq('user_id', profile!.user_id);
      setAvatarUri(publicUrl);
      setProfile({ ...profile!, avatar_url: publicUrl } as any);
    } catch (e: any) {
      Alert.alert('Upload failed', e?.message || 'Try again.');
    } finally {
      setUploading(false);
    }
  };

  const save = async () => {
    const trimmed = username.trim();
    if (!trimmed) { Alert.alert('Invalid', 'Callsign cannot be empty.'); return; }
    if (!profile?.user_id) return;
    setLoading(true);
    const { error } = await (supabase as any)
      .from('users')
      .update({ username: trimmed })
      .eq('user_id', profile.user_id);
    setLoading(false);
    if (error) {
      Alert.alert('Update Failed', error.message);
    } else {
      setProfile({ ...profile, username: trimmed });
      router.back();
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ── TOP BAR ── */}
        <View style={styles.topBar}>
          <Pressable style={[styles.iconBtn, clayCard]} onPress={() => router.back()}>
            <X size={20} color={CHR} strokeWidth={2.5} />
          </Pressable>
          <Text style={styles.title}>Edit Profile</Text>
          <Pressable style={[styles.iconBtn, { backgroundColor: SAGE }]} onPress={save} disabled={loading}>
            {loading
              ? <ActivityIndicator color="#fff" size="small" />
              : <Check size={20} color="#fff" strokeWidth={2.5} />}
          </Pressable>
        </View>

        {/* ── AVATAR SECTION ── */}
        <View style={[styles.heroSection, { backgroundColor: `${tierColor}20` }]}>
          <Pressable style={styles.avatarWrapper} onPress={pickAvatar} disabled={uploading}>
            {uploading ? (
              <View style={[styles.avatar, { backgroundColor: `${tierColor}20` }]}>
                <ActivityIndicator color={tierColor} size="large" />
              </View>
            ) : avatarUri ? (
              <Image source={{ uri: avatarUri }} style={styles.avatarImg} />
            ) : (
              <View style={[styles.avatar, { backgroundColor: `${tierColor}20`, borderColor: tierColor }]}>
                <Text style={[styles.avatarLetter, { color: tierColor }]}>{initial}</Text>
              </View>
            )}
            <View style={[styles.cameraBtn, { backgroundColor: tierColor }]}>
              <Camera size={14} color="#fff" strokeWidth={2.5} />
            </View>
          </Pressable>
          <Text style={styles.avatarHint}>Tap to change avatar</Text>

          <View style={[styles.tierPill, { backgroundColor: `${tierColor}25` }]}>
            <Award size={12} color={tierColor} strokeWidth={2.5} />
            <Text style={[styles.tierText, { color: tierColor }]}>{tier}</Text>
          </View>
        </View>

        {/* ── QUICK STATS ── */}
        <View style={styles.quickStats}>
          <View style={[styles.quickStat, clayCard]}>
            <Zap size={16} color={SAGE} strokeWidth={2} />
            <Text style={styles.quickStatNum}>{disciplineScore.toLocaleString()}</Text>
            <Text style={styles.quickStatLbl}>Points</Text>
          </View>
          <View style={[styles.quickStat, clayCard]}>
            <Flame size={16} color={TERR} strokeWidth={2.5} />
            <Text style={styles.quickStatNum}>{currentStreak}</Text>
            <Text style={styles.quickStatLbl}>Streak</Text>
          </View>
        </View>

        {/* ── FORM ── */}
        <View style={styles.formSection}>
          <Text style={styles.sectionLabel}>Callsign</Text>
          <View style={[styles.inputWrap, clayCard]}>
            <TextInput
              style={styles.input}
              value={username}
              onChangeText={setUsername}
              placeholder="Username"
              placeholderTextColor={`${CHR}35`}
              autoCorrect={false}
              autoCapitalize="none"
            />
          </View>

          <Text style={[styles.sectionLabel, { marginTop: 20 }]}>Rank Tier</Text>
          <View style={[styles.inputWrap, clayCard, styles.readOnly]}>
            <Shield size={18} color={`${CHR}40`} strokeWidth={2} />
            <Text style={styles.readOnlyText}>{tier}</Text>
            <Text style={styles.readOnlyHint}>Set by the Arena</Text>
          </View>
        </View>

        <Text style={styles.disclaimer}>
          Discipline score and streak are earned in the field. They cannot be manually edited.
        </Text>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const createStyles = (tokens: any, clay: any) => {
  const { BG, CHR } = tokens;
  return StyleSheet.create({
    root:   { flex: 1, backgroundColor: BG },
    scroll: { paddingBottom: 60 },

    topBar: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: 24, paddingTop: 56, paddingBottom: 8,
    },
    iconBtn: { width: 46, height: 46, borderRadius: 16, backgroundColor: `${CHR}10`, alignItems: 'center', justifyContent: 'center' },
    title:   { fontSize: 18, fontWeight: '900', color: CHR },

    heroSection: {
      alignItems: 'center', paddingTop: 28, paddingBottom: 28,
      marginBottom: 6,
    },
    avatarWrapper: { marginBottom: 12, position: 'relative' },
    avatar: {
      width: 100, height: 100, borderRadius: 32,
      alignItems: 'center', justifyContent: 'center',
      borderWidth: 2.5,
    },
    avatarImg: {
      width: 100, height: 100, borderRadius: 32,
      borderWidth: 2.5, borderColor: 'rgba(255,255,255,0.7)',
    },
    avatarLetter: { fontSize: 44, fontWeight: '900' },
    cameraBtn: {
      position: 'absolute', bottom: -4, right: -4,
      width: 30, height: 30, borderRadius: 10,
      alignItems: 'center', justifyContent: 'center',
      borderWidth: 2, borderColor: BG,
    },
    avatarHint: { fontSize: 11, color: `${CHR}40`, fontWeight: '600', marginBottom: 14 },
    tierPill: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 100, paddingHorizontal: 14, paddingVertical: 7 },
    tierText: { fontSize: 12, fontWeight: '900', letterSpacing: 0.5, textTransform: 'uppercase' },

    quickStats: { flexDirection: 'row', gap: 12, paddingHorizontal: 24, marginTop: 20, marginBottom: 4 },
    quickStat:  { flex: 1, backgroundColor: BG, borderRadius: 18, padding: 16, alignItems: 'center', gap: 4 },
    quickStatNum: { fontSize: 22, fontWeight: '900', color: CHR },
    quickStatLbl: { fontSize: 9, fontWeight: '900', color: `${CHR}50`, textTransform: 'uppercase', letterSpacing: 1 },

    formSection: { paddingHorizontal: 24, marginTop: 20 },
    sectionLabel: { fontSize: 10, fontWeight: '900', color: `${CHR}50`, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 10 },

    inputWrap: { borderRadius: 18, backgroundColor: BG, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.5)' },
    input:     { height: 54, paddingHorizontal: 18, fontSize: 16, fontWeight: '700', color: CHR },

    readOnly:     { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, height: 54, gap: 10 },
    readOnlyText: { flex: 1, fontSize: 15, fontWeight: '800', color: `${CHR}70` },
    readOnlyHint: { fontSize: 11, color: `${CHR}35`, fontWeight: '600' },

    disclaimer: { fontSize: 11, color: `${CHR}35`, fontWeight: '600', textAlign: 'center', lineHeight: 18, marginTop: 24, paddingHorizontal: 32 },
  });
};
