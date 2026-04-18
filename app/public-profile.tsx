import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable,
  ActivityIndicator, Image, StatusBar,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '../services/supabase';
import { Flame, Trophy, Target, ChevronLeft, Zap, TrendingUp, Heart, CameraOff } from 'lucide-react-native';
import { useThemeStyles } from '../hooks/use-theme-styles';

const TIER_META: Record<string, { color: string; gradient: [string, string] }> = {
  Novice:   { color: '#81B29A', gradient: ['#81B29A30', '#81B29A08'] },
  Advanced: { color: '#F2CC8F', gradient: ['#F2CC8F30', '#F2CC8F08'] },
  Elite:    { color: '#E07A5F', gradient: ['#E07A5F30', '#E07A5F08'] },
  Legend:   { color: '#C77DFF', gradient: ['#C77DFF30', '#C77DFF08'] },
};

export default function PublicProfileScreen() {
  const { tokens, styles, clay } = useThemeStyles(createStyles);
  const { CHR, SAGE, TERR, MUST } = tokens;
  const { clayCard } = clay;

  const { userId } = useLocalSearchParams<{ userId: string }>();
  const router = useRouter();
  const [user, setUser]           = useState<any>(null);
  const [recentPosts, setRecentPosts] = useState<any[]>([]);
  const [loading, setLoading]     = useState(true);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const { data: userData } = await supabase
        .from('users')
        .select('username, discipline_score, current_streak, max_streak, global_rank_tier, created_at, avatar_url')
        .eq('user_id', userId)
        .single();
      setUser(userData);

      const { data: postsData } = await supabase
        .from('posts')
        .select('post_id, content, image_url, created_at, like_count, mission_completions(end_image_url, start_image_url)')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(8);
      setRecentPosts(postsData || []);
    } catch (e) {
      console.warn('Profile load failed:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (userId) loadProfile(); }, [userId]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#F9F7F2', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color="#81B29A" size="large" />
      </View>
    );
  }

  if (!user) {
    return (
      <View style={{ flex: 1, backgroundColor: '#F9F7F2', alignItems: 'center', justifyContent: 'center' }}>
        <Trophy size={40} color="rgba(61,64,91,0.2)" strokeWidth={1.5} />
        <Text style={{ color: 'rgba(61,64,91,0.5)', fontWeight: '700', marginTop: 12 }}>Operator not found.</Text>
      </View>
    );
  }

  const tier = user.global_rank_tier || 'Novice';
  const tierInfo = TIER_META[tier] ?? TIER_META['Novice'];
  const initial = (user.username || 'U')[0].toUpperCase();
  const memberSince = new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const winRate = user.discipline_score > 0 ? Math.min(100, Math.round((user.discipline_score / 5000) * 100)) : 0;

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ── BACK ── */}
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <ChevronLeft size={22} color={CHR} strokeWidth={2.5} />
          <Text style={styles.backText}>Back</Text>
        </Pressable>

        {/* ── HERO BANNER ── */}
        <View style={[styles.heroBanner, { backgroundColor: tierInfo.gradient[0] }]}>
          {/* Avatar */}
          <View style={styles.avatarWrapper}>
            {user.avatar_url ? (
              <Image source={{ uri: user.avatar_url }} style={styles.avatarImg} />
            ) : (
              <View style={[styles.avatar, { backgroundColor: `${tierInfo.color}25` }]}>
                <Text style={[styles.avatarLetter, { color: tierInfo.color }]}>{initial}</Text>
              </View>
            )}
            <View style={[styles.tierRing, { borderColor: tierInfo.color }]} />
          </View>

          <Text style={styles.username}>{user.username}</Text>

          <View style={[styles.tierPill, { backgroundColor: `${tierInfo.color}25` }]}>
            <Trophy size={12} color={tierInfo.color} strokeWidth={2.5} />
            <Text style={[styles.tierText, { color: tierInfo.color }]}>{tier}</Text>
          </View>

          <Text style={styles.memberSince}>Operator since {memberSince}</Text>
        </View>

        {/* ── STATS GRID ── */}
        <View style={styles.statsGrid}>
          <View style={[styles.statBox, clayCard]}>
            <Zap size={20} color={TERR} strokeWidth={2} />
            <Text style={styles.statNum}>{Math.round(user.discipline_score || 0).toLocaleString()}</Text>
            <Text style={styles.statLbl}>Focus Points</Text>
          </View>
          <View style={[styles.statBox, clayCard]}>
            <Flame size={20} color={TERR} strokeWidth={2.5} />
            <Text style={styles.statNum}>{user.current_streak || 0}</Text>
            <Text style={styles.statLbl}>Active Streak</Text>
          </View>
          <View style={[styles.statBox, clayCard]}>
            <Target size={20} color={SAGE} strokeWidth={2} />
            <Text style={styles.statNum}>{user.max_streak || 0}</Text>
            <Text style={styles.statLbl}>Peak Streak</Text>
          </View>
          <View style={[styles.statBox, clayCard]}>
            <TrendingUp size={20} color={MUST} strokeWidth={2} />
            <Text style={styles.statNum}>{winRate}%</Text>
            <Text style={styles.statLbl}>Consistency</Text>
          </View>
        </View>

        {/* ── TIER INDICATOR BAR ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Discipline Rating</Text>
          <View style={[styles.ratingBar, clayCard]}>
            <View style={styles.ratingFill}>
              <View style={[styles.ratingTrack, { backgroundColor: `${CHR}08` }]}>
                <View style={[
                  styles.ratingProgress,
                  { width: `${winRate}%` as any, backgroundColor: tierInfo.color }
                ]} />
              </View>
            </View>
            <View style={[styles.ratingBadge, { backgroundColor: `${tierInfo.color}20` }]}>
              <Text style={[styles.ratingBadgeText, { color: tierInfo.color }]}>{tier}</Text>
            </View>
          </View>
        </View>

        {/* ── RECENT SNAPS ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Protocol Snaps</Text>
          {recentPosts.length === 0 && (
            <View style={styles.emptySnaps}>
              <CameraOff size={36} color={`${CHR}20`} strokeWidth={1.5} />
              <Text style={styles.emptyText}>No public snaps yet</Text>
            </View>
          )}
          {recentPosts.map(post => {
            const imgUri = post.image_url
              ?? post.mission_completions?.end_image_url
              ?? post.mission_completions?.start_image_url
              ?? null;
            return (
              <View key={post.post_id} style={[styles.postCard, clayCard]}>
                {imgUri ? (
                  <Image source={{ uri: imgUri }} style={styles.postImg} resizeMode="cover" />
                ) : null}
                <View style={styles.postBody}>
                  <Text style={styles.postCaption} numberOfLines={3}>{post.content}</Text>
                  <View style={styles.postFooter}>
                    <Text style={styles.postTime}>
                      {new Date(post.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </Text>
                    <View style={styles.postLikes}>
                      <Heart size={12} color={TERR} strokeWidth={2.5} fill={TERR} />
                      <Text style={styles.likesCount}>{post.like_count || 0}</Text>
                    </View>
                  </View>
                </View>
              </View>
            );
          })}
        </View>

      </ScrollView>
    </View>
  );
}

const createStyles = (tokens: any, clay: any) => {
  const { BG, CHR, TERR } = tokens; // SAGE/MUST used in component scope
  return StyleSheet.create({
    root:   { flex: 1, backgroundColor: BG },
    scroll: { paddingBottom: 100 },

    backBtn:  { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16 },
    backText: { fontSize: 15, fontWeight: '700', color: CHR },

    heroBanner: {
      alignItems: 'center', paddingVertical: 32, paddingHorizontal: 20,
      borderBottomLeftRadius: 32, borderBottomRightRadius: 32, marginBottom: 6,
    },
    avatarWrapper: { marginBottom: 16, alignItems: 'center', justifyContent: 'center', position: 'relative' },
    avatar: {
      width: 100, height: 100, borderRadius: 34,
      alignItems: 'center', justifyContent: 'center',
      borderWidth: 3, borderColor: 'rgba(255,255,255,0.7)',
    },
    avatarImg: {
      width: 100, height: 100, borderRadius: 34,
      borderWidth: 3, borderColor: 'rgba(255,255,255,0.7)',
    },
    tierRing: {
      position: 'absolute', inset: -6,
      borderRadius: 40, borderWidth: 2, borderStyle: 'dashed',
      width: 112, height: 112, opacity: 0.5,
    },
    avatarLetter: { fontSize: 42, fontWeight: '900' },
    username:     { fontSize: 26, fontWeight: '900', color: CHR, letterSpacing: -0.5, marginBottom: 10 },
    tierPill:     { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 100, marginBottom: 8 },
    tierText:     { fontSize: 11, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 },
    memberSince:  { fontSize: 11, fontWeight: '600', color: `${CHR}45` },

    statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingHorizontal: 20, marginTop: 20, marginBottom: 4 },
    statBox:   { width: '47%', borderRadius: 20, padding: 16, alignItems: 'center', gap: 6, backgroundColor: BG },
    statNum:   { fontSize: 22, fontWeight: '900', color: CHR },
    statLbl:   { fontSize: 9, fontWeight: '900', color: `${CHR}50`, textTransform: 'uppercase', letterSpacing: 1.5, textAlign: 'center' },

    section:      { paddingHorizontal: 20, marginTop: 20 },
    sectionTitle: { fontSize: 10, fontWeight: '900', color: `${CHR}50`, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 12 },

    ratingBar: {
      flexDirection: 'row', alignItems: 'center', gap: 12,
      backgroundColor: BG, borderRadius: 18,
      borderWidth: 1, borderColor: 'rgba(255,255,255,0.5)',
      paddingHorizontal: 16, paddingVertical: 14,
    },
    ratingFill:     { flex: 1 },
    ratingTrack:    { height: 8, borderRadius: 100, overflow: 'hidden' },
    ratingProgress: { height: '100%', borderRadius: 100 },
    ratingBadge:    { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 100 },
    ratingBadgeText:{ fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 },

    emptySnaps: { alignItems: 'center', paddingVertical: 40, gap: 10 },
    emptyText:  { fontSize: 14, fontWeight: '600', color: `${CHR}40` },

    postCard: { borderRadius: 20, overflow: 'hidden', marginBottom: 12, backgroundColor: BG },
    postImg:  { width: '100%', height: 200 },
    postBody: { padding: 14 },
    postCaption: { fontSize: 14, color: `${CHR}85`, lineHeight: 21, fontWeight: '500', marginBottom: 10 },
    postFooter:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    postTime:    { fontSize: 10, fontWeight: '700', color: `${CHR}40` },
    postLikes:   { flexDirection: 'row', alignItems: 'center', gap: 4 },
    likesCount:  { fontSize: 11, fontWeight: '800', color: TERR },
  });
};
