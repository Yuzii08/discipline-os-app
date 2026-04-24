import React, { useEffect, useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, FlatList, ActivityIndicator,
  StatusBar, Image, Pressable, ScrollView,
} from 'react-native';
import { Trophy, Medal, TrendingUp, Flame, Shield, Users, Target, ChevronRight } from 'lucide-react-native';
import { useUserStore } from '../../store/useUserStore';
import { useThemeStyles } from '../../hooks/use-theme-styles';
import { useRouter } from 'expo-router';
import { 
  fetchGlobalTop, fetchSquadTop, getTierInfo, 
  LeaderboardUser, LeaderboardSquad 
} from '../../services/leaderboardService';
import { LinearGradient } from 'expo-linear-gradient';

const getRankColors = (must: string, chr: string): Record<number, string> => ({ 
  1: must, 2: '#C0C0C0', 3: '#CD7F32' 
});

type ArenaTab = 'global' | 'squads';

export default function ArenaScreen() {
  const { tokens, styles, clay } = useThemeStyles(createStyles);
  const { BG, CHR, SAGE, TERR, MUST, isDark } = tokens;
  const { clayCard } = clay;
  const RANK_COLORS = getRankColors(MUST, CHR);
  const router = useRouter();

  const { profile, disciplineScore } = useUserStore();
  const [tab, setTab]           = useState<ArenaTab>('global');
  const [globalData, setGlobalData] = useState<LeaderboardUser[]>([]);
  const [squadData, setSquadData]   = useState<LeaderboardSquad[]>([]);
  const [loading, setLoading]   = useState(true);

  const tierInfo = useMemo(() => getTierInfo(disciplineScore), [disciplineScore]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [gData, sData] = await Promise.all([
        fetchGlobalTop(50),
        fetchSquadTop(50)
      ]);
      setGlobalData(gData);
      setSquadData(sData);
    } catch (e) {
      console.warn('Leaderboard fetch failed:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const myRankGlobal = useMemo(() => {
    const idx = globalData.findIndex(u => u.user_id === profile?.user_id);
    return idx !== -1 ? idx + 1 : null;
  }, [globalData, profile?.user_id]);

  const renderGlobalItem = ({ item, index }: { item: LeaderboardUser, index: number }) => {
    const rank    = index + 1;
    const isMe    = item.user_id === profile?.user_id;
    const rankClr = RANK_COLORS[rank] || `${CHR}15`;
    const isMedal = rank <= 3;

    return (
      <Pressable
        onPress={() => isMe ? router.push('/(tabs)/profile') : router.push({ pathname: '/public-profile', params: { userId: item.user_id } })}
        style={[styles.row, clayCard, isMe && styles.rowMe]}
      >
        <View style={[styles.rankBox, { backgroundColor: isMedal ? rankClr : `${CHR}10` }]}>
          {isMedal
            ? <Medal size={16} color={rank === 1 ? (isDark ? '#000' : '#fff') : '#fff'} strokeWidth={2.5} />
            : <Text style={styles.rankNum}>{rank}</Text>
          }
        </View>
        <View style={styles.avatarBubble}>
          {item.avatar_url ? (
            <Image source={{ uri: item.avatar_url }} style={styles.avatarImage} />
          ) : (
            <Text style={styles.avatarLetter}>{(item.username || '?')[0].toUpperCase()}</Text>
          )}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.username, isMe && { color: TERR }]}>
            {item.username || 'Unknown'}{isMe ? ' (You)' : ''}
          </Text>
          <View style={styles.metaRow}>
            <Flame size={11} color={TERR} strokeWidth={2.5} />
            <Text style={styles.metaText}>{item.current_streak || 0}d</Text>
            <Text style={styles.metaDot}>·</Text>
            <Text style={styles.metaText}>{item.global_rank_tier || 'Novice'}</Text>
          </View>
        </View>
        <Text style={[styles.score, isMedal && { color: rank === 1 ? MUST : TERR }]}>
          {(item.discipline_score || 0).toLocaleString()}
        </Text>
      </Pressable>
    );
  };

  const renderSquadItem = ({ item, index }: { item: LeaderboardSquad, index: number }) => {
    const rank    = index + 1;
    const isMySquad = profile?.squad_id === item.squad_id;
    const rankClr = RANK_COLORS[rank] || `${CHR}15`;
    const isMedal = rank <= 3;

    return (
      <View style={[styles.row, clayCard, isMySquad && styles.rowMe]}>
        <View style={[styles.rankBox, { backgroundColor: isMedal ? rankClr : `${CHR}10` }]}>
          {isMedal
            ? <Shield size={16} color={rank === 1 ? (isDark ? '#000' : '#fff') : '#fff'} strokeWidth={2.5} />
            : <Text style={styles.rankNum}>{rank}</Text>
          }
        </View>
        <View style={[styles.avatarBubble, { backgroundColor: `${SAGE}30` }]}>
          {item.avatar_url ? (
            <Image source={{ uri: item.avatar_url }} style={styles.avatarImage} />
          ) : (
            <Users size={20} color={SAGE} strokeWidth={2.5} />
          )}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.username, isMySquad && { color: MUST }]}>
            {item.name || 'Elite Squad'}{isMySquad ? ' (Your Unit)' : ''}
          </Text>
          <Text style={styles.metaText} numberOfLines={1}>{item.motto || 'Strength in Discipline'}</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={[styles.score, isMedal && { color: rank === 1 ? MUST : TERR }]}>
            {Math.floor(item.total_score).toLocaleString()}
          </Text>
          <Text style={styles.metaTextSmall}>{item.member_count} units</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      <FlatList
        data={tab === 'global' ? globalData : squadData}
        keyExtractor={i => (tab === 'global' ? (i as LeaderboardUser).user_id : (i as LeaderboardSquad).squad_id)}
        renderItem={tab === 'global' ? (renderGlobalItem as any) : (renderSquadItem as any)}
        contentContainerStyle={styles.listContent}
        refreshing={loading}
        onRefresh={loadData}
        ListHeaderComponent={(
          <>
            {/* ── Header ── */}
            <View style={styles.header}>
              <View>
                <Text style={styles.title}>The Arena</Text>
                <Text style={styles.sub}>{tab === 'global' ? 'Global High Command' : 'Strategic Units'}</Text>
              </View>
              <Trophy size={32} color={MUST} strokeWidth={2} />
            </View>

            {/* ── Tier Progress Card ── */}
            <View style={[styles.progressCard, clayCard]}>
              <View style={styles.progressHeader}>
                <View style={[styles.tierIconBox, { backgroundColor: `${tierInfo.currentTier.color}25` }]}>
                  <Target size={24} color={tierInfo.currentTier.color} strokeWidth={2.5} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.progressLabel}>CURRENT STANDING</Text>
                  <Text style={[styles.tierName, { color: tierInfo.currentTier.color }]}>
                    {tierInfo.currentTier.name.toUpperCase()}
                  </Text>
                </View>
                <View style={styles.rankBadge}>
                  <Text style={styles.rankBadgeText}>#{myRankGlobal || '?'}</Text>
                </View>
              </View>

              {tierInfo.nextTier && (
                <View style={styles.progressBody}>
                  <View style={styles.progressBarBg}>
                    <View style={[styles.progressBarFill, { width: `${tierInfo.progress * 100}%`, backgroundColor: tierInfo.currentTier.color }]} />
                  </View>
                  <View style={styles.progressFooter}>
                    <Text style={styles.progressFooterText}>{Math.floor(disciplineScore).toLocaleString()} DP / {tierInfo.nextTier.min.toLocaleString()} DP</Text>
                    <Text style={styles.progressFooterNext}>{tierInfo.remaining.toLocaleString()} more until {tierInfo.nextTier.name}</Text>
                  </View>
                </View>
              )}
            </View>

            {/* ── Tab Switcher ── */}
            <View style={styles.tabRow}>
              {(['global', 'squads'] as ArenaTab[]).map(t => (
                <Pressable
                  key={t}
                  onPress={() => setTab(t)}
                  style={[styles.tabBtn, tab === t && { backgroundColor: CHR }]}
                >
                  <Text style={[styles.tabBtnText, tab === t && { color: isDark ? '#000' : '#fff' }]}>
                    {t.toUpperCase()}
                  </Text>
                </Pressable>
              ))}
            </View>
          </>
        )}
        ListEmptyComponent={loading ? null : (
          <View style={styles.loader}>
            <Text style={styles.loadText}>No tactical data found.</Text>
          </View>
        )}
      />

      {loading && (
        <View style={StyleSheet.absoluteFillObject}>
          <View style={{ flex: 1, backgroundColor: `${BG}99`, alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIndicator color={SAGE} size="large" />
            <Text style={[styles.loadText, { marginTop: 12 }]}>Syncing Arena Data...</Text>
          </View>
        </View>
      )}
    </View>
  );
}

const createStyles = (tokens: any, clay: any) => {
  const { BG, CHR, SAGE, TERR, MUST, isDark } = tokens;
  
  return StyleSheet.create({
  root:    { flex: 1, backgroundColor: BG },
  header:  {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: 64, paddingHorizontal: 24, paddingBottom: 24,
  },
  title: { fontSize: 32, fontWeight: '900', color: CHR, letterSpacing: -0.5 },
  sub:   { fontSize: 13, color: `${CHR}50`, fontWeight: '700', marginTop: 2, letterSpacing: 1, textTransform: 'uppercase' },

  progressCard: {
    marginHorizontal: 20,
    backgroundColor: BG, borderRadius: 28,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.5)',
    padding: 20, marginBottom: 24,
  },
  progressHeader: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  tierIconBox: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  progressLabel: { fontSize: 10, fontWeight: '800', color: `${CHR}40`, letterSpacing: 2 },
  tierName: { fontSize: 24, fontWeight: '900', marginTop: 2 },
  rankBadge: { backgroundColor: `${CHR}10`, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  rankBadgeText: { fontSize: 14, fontWeight: '900', color: CHR },

  progressBody: { marginTop: 20 },
  progressBarBg: { height: 6, backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)', borderRadius: 3, overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: 3 },
  progressFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  progressFooterText: { fontSize: 11, fontWeight: '800', color: CHR, opacity: 0.6 },
  progressFooterNext: { fontSize: 11, fontWeight: '800', color: SAGE },

  tabRow: { flexDirection: 'row', gap: 10, marginHorizontal: 20, marginBottom: 20 },
  tabBtn: { flex: 1, paddingVertical: 12, borderRadius: 16, alignItems: 'center', backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' },
  tabBtnText: { fontSize: 12, fontWeight: '900', color: `${CHR}50`, letterSpacing: 1 },

  listContent: { paddingBottom: 120 },

  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: BG, borderRadius: 24,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.5)',
    paddingHorizontal: 16, paddingVertical: 16, 
    marginHorizontal: 20, marginBottom: 12,
  },
  rowMe: { borderColor: `${TERR}40`, borderWidth: 1.5 },

  rankBox: { width: 36, height: 36, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  rankNum: { fontSize: 14, fontWeight: '900', color: `${CHR}60` },

  avatarBubble: {
    width: 44, height: 44, borderRadius: 18,
    backgroundColor: `${SAGE}25`, alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: { width: 44, height: 44, borderRadius: 18 },
  avatarLetter: { fontSize: 18, fontWeight: '900', color: SAGE },

  username:  { fontSize: 15, fontWeight: '800', color: CHR },
  metaRow:   { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  metaText:  { fontSize: 12, color: `${CHR}55`, fontWeight: '600' },
  metaTextSmall: { fontSize: 10, color: `${CHR}40`, fontWeight: '700', marginTop: 2 },
  metaDot:   { fontSize: 11, color: `${CHR}30` },

  score:  { fontSize: 16, fontWeight: '900', color: CHR },

  loader:   { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  loadText: { fontSize: 13, color: `${CHR}50`, fontWeight: '600', letterSpacing: 0.5 },
  });
};
