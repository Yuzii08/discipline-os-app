import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '../services/supabase';
import { Flame, Trophy, Target, ChevronLeft, Zap } from 'lucide-react-native';

const BG    = '#F9F7F2';
const CHR   = '#3D405B';
const SAGE  = '#81B29A';
const TERR  = '#E07A5F';
const MUST  = '#F2CC8F';

const clayCard = {
  backgroundColor: BG,
  shadowColor: '#B8B2A5',
  shadowOffset: { width: 6, height: 8 },
  shadowOpacity: 0.3,
  shadowRadius: 14,
  elevation: 7,
  borderWidth: 1,
  borderColor: 'rgba(230,225,215,0.4)',
};

export default function PublicProfileScreen() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [recentPosts, setRecentPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    loadProfile();
  }, [userId]);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const { data: userData } = await supabase
        .from('users')
        .select('username, discipline_score, current_streak, max_streak, global_rank_tier, created_at')
        .eq('user_id', userId)
        .single();

      setUser(userData);

      const { data: postsData } = await supabase
        .from('posts')
        .select('post_id, content, image_url, created_at, like_count')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(5);

      setRecentPosts(postsData || []);
    } catch (e) {
      console.warn('Profile load failed:', e);
    } finally {
      setLoading(false);
    }
  };

  const tierColor = (tier: string) => {
    if (tier === 'Elite') return TERR;
    if (tier === 'Advanced') return MUST;
    return SAGE;
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: BG, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={SAGE} />
      </View>
    );
  }

  if (!user) {
    return (
      <View style={{ flex: 1, backgroundColor: BG, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: `${CHR}50`, fontWeight: '700' }}>Operator not found.</Text>
      </View>
    );
  }

  const memberSince = new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Back */}
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <ChevronLeft size={22} color={CHR} strokeWidth={2.5} />
          <Text style={styles.backText}>Back</Text>
        </Pressable>

        {/* ── Avatar + Name ── */}
        <View style={styles.heroSection}>
          <View style={styles.bigAvatar}>
            <Text style={styles.bigAvatarText}>{(user.username || 'U')[0].toUpperCase()}</Text>
          </View>
          <Text style={styles.username}>{user.username}</Text>
          <View style={[styles.tierPill, { backgroundColor: `${tierColor(user.global_rank_tier)}20` }]}>
            <Trophy size={12} color={tierColor(user.global_rank_tier)} strokeWidth={2.5} />
            <Text style={[styles.tierText, { color: tierColor(user.global_rank_tier) }]}>{user.global_rank_tier}</Text>
          </View>
          <Text style={styles.memberSince}>Member since {memberSince}</Text>
        </View>

        {/* ── Stats ── */}
        <View style={styles.statsRow}>
          <View style={[styles.statBox, clayCard]}>
            <Zap size={18} color={TERR} strokeWidth={2.5} />
            <Text style={styles.statNum}>{Math.round(user.discipline_score || 0)}</Text>
            <Text style={styles.statLbl}>Score</Text>
          </View>
          <View style={[styles.statBox, clayCard]}>
            <Flame size={18} color={TERR} strokeWidth={2.5} />
            <Text style={styles.statNum}>{user.current_streak}</Text>
            <Text style={styles.statLbl}>Streak</Text>
          </View>
          <View style={[styles.statBox, clayCard]}>
            <Target size={18} color={SAGE} strokeWidth={2.5} />
            <Text style={styles.statNum}>{user.max_streak}</Text>
            <Text style={styles.statLbl}>Max Streak</Text>
          </View>
        </View>

        {/* ── Recent Snaps ── */}
        <Text style={styles.sectionTitle}>Recent Snaps</Text>
        {recentPosts.length === 0 && (
          <Text style={styles.emptyText}>No public snaps yet.</Text>
        )}
        {recentPosts.map(post => (
          <View key={post.post_id} style={[styles.postCard, clayCard]}>
            <Text style={styles.postCaption}>{post.content}</Text>
            <View style={styles.postFooter}>
              <Text style={styles.postTime}>
                {new Date(post.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </Text>
              <View style={styles.postLikes}>
                <Flame size={12} color={TERR} strokeWidth={2.5} />
                <Text style={styles.likesCount}>{post.like_count || 0}</Text>
              </View>
            </View>
          </View>
        ))}

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG },
  scroll: { paddingHorizontal: 20, paddingTop: 56, paddingBottom: 100 },

  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 24 },
  backText: { fontSize: 15, fontWeight: '700', color: CHR },

  heroSection: { alignItems: 'center', marginBottom: 32 },
  bigAvatar: {
    width: 90, height: 90, borderRadius: 28, backgroundColor: `${SAGE}25`,
    alignItems: 'center', justifyContent: 'center', marginBottom: 14,
    shadowColor: SAGE, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16,
  },
  bigAvatarText: { fontSize: 36, fontWeight: '900', color: CHR },
  username: { fontSize: 26, fontWeight: '900', color: CHR, letterSpacing: -0.5, marginBottom: 8 },
  tierPill: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 100, marginBottom: 6 },
  tierText: { fontSize: 11, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 },
  memberSince: { fontSize: 11, fontWeight: '600', color: `${CHR}45` },

  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 32 },
  statBox: { flex: 1, borderRadius: 20, padding: 18, alignItems: 'center', gap: 6 },
  statNum: { fontSize: 22, fontWeight: '900', color: CHR },
  statLbl: { fontSize: 9, fontWeight: '900', color: `${CHR}50`, textTransform: 'uppercase', letterSpacing: 1.5 },

  sectionTitle: { fontSize: 11, fontWeight: '900', color: `${CHR}50`, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 14 },
  emptyText: { fontSize: 13, fontWeight: '600', color: `${CHR}40`, textAlign: 'center', marginTop: 20 },

  postCard: { borderRadius: 20, padding: 16, marginBottom: 12 },
  postCaption: { fontSize: 14, color: `${CHR}85`, lineHeight: 21, fontWeight: '500', marginBottom: 10 },
  postFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  postTime: { fontSize: 10, fontWeight: '700', color: `${CHR}40` },
  postLikes: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  likesCount: { fontSize: 11, fontWeight: '800', color: `${CHR}55` },
});
