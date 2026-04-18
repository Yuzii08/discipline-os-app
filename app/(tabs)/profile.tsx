import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, StatusBar,
  Pressable, Image, ActivityIndicator, Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useUserStore } from '../../store/useUserStore';
import { Flame, Award, Edit2, Camera, Trophy, Zap, Target, Star, TrendingUp, ChevronRight } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useThemeStyles } from '../../hooks/use-theme-styles';
import { supabase } from '../../services/supabase';
import { decode } from 'base64-arraybuffer';
import { useFocusEffect } from '@react-navigation/native';

const TIER_META: Record<string, { color: string; icon: any; gradient: [string, string] }> = {
  Novice:   { color: '#81B29A', icon: Star,    gradient: ['#81B29A40', '#81B29A10'] },
  Advanced: { color: '#F2CC8F', icon: TrendingUp, gradient: ['#F2CC8F40', '#F2CC8F10'] },
  Elite:    { color: '#E07A5F', icon: Trophy,  gradient: ['#E07A5F40', '#E07A5F10'] },
  Legend:   { color: '#C77DFF', icon: Award,   gradient: ['#C77DFF40', '#C77DFF10'] },
};

export default function ProfileScreen() {
  const { tokens, styles, clay } = useThemeStyles(createStyles);
  const { BG, CHR, SAGE, TERR, MUST } = tokens;
  const { clayCard } = clay;

  const { profile, disciplineScore, currentStreak, setProfile } = useUserStore();
  const router = useRouter();
  const username = profile?.username || 'Warrior';
  const tier     = profile?.global_rank_tier || 'Novice';
  const initial  = username[0].toUpperCase();
  const tierInfo = TIER_META[tier] ?? TIER_META['Novice'];
  const TierIcon = tierInfo.icon;

  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [stats, setStats] = useState({ totalCompleted: 0, totalFailed: 0, bodyPct: 0, mindPct: 0, workPct: 0 });
  const [loadingStats, setLoadingStats] = useState(true);

  const maxScore       = 5000;
  const consistencyIdx = Math.min(100, Math.round((disciplineScore / maxScore) * 100));

  const loadProfileData = React.useCallback(async () => {
    if (!profile?.user_id) return;
    setLoadingStats(true);
    try {
      // Fetch avatar_url from DB
      const { data: userData } = await supabase
        .from('users')
        .select('avatar_url')
        .eq('user_id', profile.user_id)
        .single();
      if ((userData as any)?.avatar_url) setAvatarUri((userData as any).avatar_url);

      // Fetch completed mission counts per category
      const { data: completions } = await supabase
        .from('mission_completions')
        .select('status, missions!inner(category)')
        .eq('user_id', profile.user_id);

      if (completions) {
        const done   = completions.filter((c: any) => c.status === 'COMPLETED');
        const failed = completions.filter((c: any) => c.status === 'FAILED');
        const cat = (k: string) => done.filter((c: any) => c.missions?.category === k).length;
        const total = done.length || 1;
        setStats({
          totalCompleted: done.length,
          totalFailed: failed.length,
          bodyPct: Math.round((cat('BODY') / total) * 100),
          mindPct: Math.round((cat('MIND') / total) * 100),
          workPct: Math.round((cat('WORK') / total) * 100),
        });
      }
    } catch (e) {
      console.warn('Profile data load failed', e);
    } finally {
      setLoadingStats(false);
    }
  }, [profile?.user_id]);

  useFocusEffect(React.useCallback(() => { loadProfileData(); }, [loadProfileData]));

  const pickAndUploadAvatar = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Allow photo access to set your avatar.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
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
      Alert.alert('Upload failed', e?.message || 'Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const DOMAINS = [
    { key: 'BODY', color: TERR, pct: stats.bodyPct },
    { key: 'MIND', color: SAGE, pct: stats.mindPct },
    { key: 'WORK', color: MUST, pct: stats.workPct },
  ];

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={BG} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ── HERO BANNER ── */}
    <View style={[styles.heroBanner, { backgroundColor: tierInfo.gradient[0] }]}>
          {/* Avatar */}
          <Pressable style={styles.avatarWrapper} onPress={pickAndUploadAvatar}>
            {uploading ? (
              <View style={[styles.avatar, { backgroundColor: `${SAGE}30` }]}>
                <ActivityIndicator color={SAGE} />
              </View>
            ) : avatarUri ? (
              <Image source={{ uri: avatarUri }} style={styles.avatarImg} />
            ) : (
              <View style={[styles.avatar, { backgroundColor: `${tierInfo.color}25` }]}>
                <Text style={[styles.avatarLetter, { color: tierInfo.color }]}>{initial}</Text>
              </View>
            )}
            <View style={[styles.cameraBtn, { backgroundColor: tierInfo.color }]}>
              <Camera size={13} color="#fff" strokeWidth={2.5} />
            </View>
          </Pressable>

          <Text style={styles.username}>{username}</Text>

          <View style={[styles.tierBadge, { backgroundColor: `${tierInfo.color}25` }]}>
            <TierIcon size={13} color={tierInfo.color} strokeWidth={2.5} />
            <Text style={[styles.tierText, { color: tierInfo.color }]}>{tier}</Text>
          </View>

          <Pressable style={styles.editBtn} onPress={() => router.push('/edit-profile')}>
            <Edit2 size={13} color={CHR} strokeWidth={2.5} />
            <Text style={styles.editBtnText}>Edit Profile</Text>
          </Pressable>
        </View>

        {/* ── STATS TRIPTYCH ── */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, clayCard, { borderTopColor: SAGE, borderTopWidth: 3 }]}>
            <Zap size={20} color={SAGE} strokeWidth={2} />
            <Text style={styles.statVal}>{disciplineScore.toLocaleString()}</Text>
            <Text style={styles.statLbl}>Focus Points</Text>
          </View>
          <View style={[styles.statCard, clayCard, { borderTopColor: TERR, borderTopWidth: 3 }]}>
            <Flame size={20} color={TERR} strokeWidth={2.5} />
            <Text style={styles.statVal}>{currentStreak}</Text>
            <Text style={styles.statLbl}>Day Streak</Text>
          </View>
          <View style={[styles.statCard, clayCard, { borderTopColor: MUST, borderTopWidth: 3 }]}>
            <Target size={20} color={MUST} strokeWidth={2} />
            <Text style={[styles.statVal, { color: CHR }]}>{consistencyIdx}%</Text>
            <Text style={styles.statLbl}>Consistency</Text>
          </View>
        </View>

        {/* ── MISSION LEDGER ── */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Mission Ledger</Text>
          <View style={[styles.ledgerRow, clayCard]}>
            <View style={styles.ledgerItem}>
              <Text style={[styles.ledgerNum, { color: SAGE }]}>{stats.totalCompleted}</Text>
              <Text style={styles.ledgerLbl}>Completed</Text>
            </View>
            <View style={styles.ledgerDivider} />
            <View style={styles.ledgerItem}>
              <Text style={[styles.ledgerNum, { color: TERR }]}>{stats.totalFailed}</Text>
              <Text style={styles.ledgerLbl}>Failed</Text>
            </View>
            <View style={styles.ledgerDivider} />
            <View style={styles.ledgerItem}>
              <Text style={[styles.ledgerNum, { color: MUST }]}>
                {stats.totalCompleted + stats.totalFailed > 0
                  ? Math.round((stats.totalCompleted / (stats.totalCompleted + stats.totalFailed)) * 100)
                  : 0}%
              </Text>
              <Text style={styles.ledgerLbl}>Win Rate</Text>
            </View>
          </View>
        </View>

        {/* ── PERFORMANCE DOMAINS ── */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Domain Output</Text>
          <View style={[styles.card, clayCard]}>
            {loadingStats ? (
              <ActivityIndicator color={SAGE} style={{ marginVertical: 20 }} />
            ) : (
              DOMAINS.map((d, i) => (
                <View key={d.key} style={[styles.domainRow, i < DOMAINS.length - 1 && styles.domainDivider]}>
                  <View style={[styles.domainIcon, { backgroundColor: `${d.color}20` }]}>
                    <Text style={[styles.domainKey, { color: d.color }]}>{d.key}</Text>
                  </View>
                  <View style={styles.track}>
                    <View style={[styles.fill, { width: `${d.pct}%` as any, backgroundColor: d.color }]} />
                  </View>
                  <Text style={styles.domainPct}>{d.pct}%</Text>
                </View>
              ))
            )}
          </View>
        </View>

        {/* ── QUICK LINKS ── */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Quick Links</Text>
          <View style={[styles.card, clayCard]}>
            {[
              { label: 'View Leaderboard', icon: Trophy, color: MUST, route: '/leaderboard' },
              { label: 'Edit Callsign', icon: Edit2, color: SAGE, route: '/edit-profile' },
            ].map((item, i) => (
              <Pressable
                key={item.label}
                style={[styles.quickRow, i > 0 && styles.domainDivider]}
                onPress={() => router.push(item.route as any)}
              >
                <View style={[styles.quickIcon, { backgroundColor: `${item.color}20` }]}>
                  <item.icon size={16} color={item.color} strokeWidth={2.5} />
                </View>
                <Text style={styles.quickLabel}>{item.label}</Text>
                <ChevronRight size={16} color={`${CHR}30`} strokeWidth={2.5} />
              </Pressable>
            ))}
          </View>
        </View>

      </ScrollView>
    </View>
  );
}

const createStyles = (tokens: any) => {
  const { BG, CHR } = tokens;
  return StyleSheet.create({
    root:   { flex: 1, backgroundColor: BG },
    scroll: { paddingBottom: 120 },

    heroBanner: {
      alignItems: 'center', paddingTop: 64, paddingBottom: 32,
      paddingHorizontal: 20, marginBottom: 0,
      borderBottomLeftRadius: 36, borderBottomRightRadius: 36,
    },
    avatarWrapper: { marginBottom: 16, position: 'relative' },
    avatar: {
      width: 96, height: 96, borderRadius: 32,
      alignItems: 'center', justifyContent: 'center',
      borderWidth: 3, borderColor: 'rgba(255,255,255,0.7)',
      shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.15, shadowRadius: 16, elevation: 8,
    },
    avatarImg: {
      width: 96, height: 96, borderRadius: 32,
      borderWidth: 3, borderColor: 'rgba(255,255,255,0.7)',
    },
    avatarLetter: { fontSize: 40, fontWeight: '900' },
    cameraBtn: {
      position: 'absolute', bottom: -4, right: -4,
      width: 28, height: 28, borderRadius: 10,
      alignItems: 'center', justifyContent: 'center',
      borderWidth: 2, borderColor: BG,
    },
    username: { fontSize: 26, fontWeight: '900', color: CHR, letterSpacing: -0.5, marginBottom: 10 },
    tierBadge: {
      flexDirection: 'row', alignItems: 'center', gap: 6,
      borderRadius: 100, paddingHorizontal: 16, paddingVertical: 7, marginBottom: 14,
    },
    tierText: { fontSize: 12, fontWeight: '900', letterSpacing: 0.5, textTransform: 'uppercase' },
    editBtn: {
      flexDirection: 'row', alignItems: 'center', gap: 6,
      paddingHorizontal: 18, paddingVertical: 9,
      backgroundColor: 'rgba(255,255,255,0.55)', borderRadius: 100,
    },
    editBtnText: { fontSize: 12, fontWeight: '800', color: CHR },

    statsRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 20, marginTop: 20, marginBottom: 8 },
    statCard:  { flex: 1, borderRadius: 20, padding: 14, alignItems: 'center', gap: 6, backgroundColor: BG },
    statVal:   { fontSize: 20, fontWeight: '900', color: CHR },
    statLbl:   { fontSize: 8, fontWeight: '900', color: `${CHR}50`, letterSpacing: 1.5, textTransform: 'uppercase', textAlign: 'center' },

    section: { paddingHorizontal: 20, marginTop: 20 },
    sectionLabel: { fontSize: 10, fontWeight: '900', color: `${CHR}50`, letterSpacing: 2.5, textTransform: 'uppercase', marginBottom: 12 },

    ledgerRow: {
      flexDirection: 'row', borderRadius: 22,
      borderWidth: 1, borderColor: 'rgba(255,255,255,0.5)',
      backgroundColor: BG, overflow: 'hidden',
    },
    ledgerItem: { flex: 1, alignItems: 'center', paddingVertical: 18 },
    ledgerNum:  { fontSize: 24, fontWeight: '900' },
    ledgerLbl:  { fontSize: 9, fontWeight: '900', color: `${CHR}50`, marginTop: 3, letterSpacing: 1, textTransform: 'uppercase' },
    ledgerDivider: { width: 1, backgroundColor: `${CHR}08`, marginVertical: 12 },

    card: {
      backgroundColor: BG, borderRadius: 22,
      borderWidth: 1, borderColor: 'rgba(255,255,255,0.5)',
      paddingVertical: 4, paddingHorizontal: 18,
    },
    domainRow:     { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, gap: 12 },
    domainDivider: { borderBottomWidth: 1, borderBottomColor: `${CHR}06` },
    domainIcon:    { width: 40, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
    domainKey:     { fontSize: 10, fontWeight: '900', letterSpacing: 1 },
    track:         { flex: 1, height: 7, backgroundColor: `${CHR}10`, borderRadius: 100, overflow: 'hidden' },
    fill:          { height: '100%', borderRadius: 100 },
    domainPct:     { fontSize: 13, fontWeight: '800', color: CHR, width: 36, textAlign: 'right' },

    quickRow:   { flexDirection: 'row', alignItems: 'center', paddingVertical: 15, gap: 12 },
    quickIcon:  { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    quickLabel: { flex: 1, fontSize: 14, fontWeight: '700', color: CHR },
  });
};
