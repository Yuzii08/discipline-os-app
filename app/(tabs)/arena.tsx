import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, ActivityIndicator,
  StatusBar, Image,
} from 'react-native';
import { Trophy, Medal, TrendingUp, Flame } from 'lucide-react-native';
import { supabase } from '../../services/supabase';
import { useUserStore } from '../../store/useUserStore';
import { useThemeStyles } from '../../hooks/use-theme-styles';

const getRankColors = (must: string, chr: string): Record<number, string> => ({ 
  1: must, 2: '#C0C0C0', 3: '#CD7F32' 
});

export default function ArenaScreen() {
  const { tokens, styles, clay } = useThemeStyles(createStyles);
  const { BG, CHR, SAGE, TERR, MUST } = tokens;
  const { clayCard } = clay;
  const RANK_COLORS = getRankColors(MUST, CHR);

  const { profile } = useUserStore();
  const [data, setData]       = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    const { data: rows } = await supabase
      .from('users')
      .select('user_id, username, discipline_score, global_rank_tier, current_streak, avatar_url')
      .order('discipline_score', { ascending: false })
      .limit(50);
    setData(rows ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const myIdx  = data.findIndex(u => u.user_id === profile?.user_id);
  const myRank = myIdx !== -1 ? myIdx + 1 : null;

  const renderItem = ({ item, index }: any) => {
    const rank    = index + 1;
    const isMe    = item.user_id === profile?.user_id;
    const rankClr = RANK_COLORS[rank] || `${CHR}15`;
    const isMedal = rank <= 3;

    return (
      <View style={[styles.row, clayCard, isMe && styles.rowMe]}>
        <View style={[styles.rankBox, { backgroundColor: isMedal ? rankClr : `${CHR}10` }]}>
          {isMedal
            ? <Medal size={16} color={rank === 1 ? '#3D405B' : '#fff'} strokeWidth={2.5} />
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
        <Text style={[styles.score, isMedal && { color: TERR }]}>
          {(item.discipline_score || 0).toLocaleString()}
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={BG} />

      {/* ── Header ── */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>The Arena</Text>
          <Text style={styles.sub}>Top Vanguards</Text>
        </View>
        <Trophy size={28} color={MUST} strokeWidth={2} />
      </View>

      {/* ── Your Standing Card ── */}
      {myRank && (
        <View style={[styles.myCard, clayCard]}>
          <TrendingUp size={18} color={SAGE} strokeWidth={2.5} />
          <View style={{ flex: 1 }}>
            <Text style={styles.myLabel}>Your Standing</Text>
            <Text style={styles.myRank}>#{myRank} Globally</Text>
          </View>
          <View style={[styles.tierBadge, { backgroundColor: `${SAGE}25` }]}>
            <Text style={styles.tierText}>{profile?.global_rank_tier ?? 'Novice'}</Text>
          </View>
        </View>
      )}

      {/* ── List ── */}
      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator color={SAGE} size="large" />
          <Text style={styles.loadText}>Syncing rankings...</Text>
        </View>
      ) : (
        <FlatList
          data={data}
          keyExtractor={i => i.user_id}
          contentContainerStyle={styles.listContent}
          refreshing={loading}
          onRefresh={fetchData}
          renderItem={renderItem}
        />
      )}
    </View>
  );
}

const createStyles = (tokens: any, clay: any) => {
  const { BG, CHR, SAGE, TERR } = tokens;
  
  return StyleSheet.create({
  root:    { flex: 1, backgroundColor: BG },
  header:  {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: 56, paddingHorizontal: 20, paddingBottom: 16,
  },
  title: { fontSize: 28, fontWeight: '900', color: CHR, letterSpacing: -0.5 },
  sub:   { fontSize: 13, color: `${CHR}50`, fontWeight: '700', marginTop: 2, letterSpacing: 0.5, textTransform: 'uppercase' },

  myCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: BG, borderRadius: 24,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.5)',
    paddingHorizontal: 20, paddingVertical: 16,
    marginHorizontal: 20, marginBottom: 16,
  },
  myLabel: { fontSize: 10, fontWeight: '800', color: `${CHR}50`, letterSpacing: 2, textTransform: 'uppercase' },
  myRank:  { fontSize: 20, fontWeight: '900', color: CHR, marginTop: 2 },
  tierBadge: { borderRadius: 100, paddingHorizontal: 14, paddingVertical: 6 },
  tierText:  { fontSize: 11, fontWeight: '800', color: SAGE },

  listContent: { paddingHorizontal: 20, paddingBottom: 120 },

  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: BG, borderRadius: 20,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.5)',
    paddingHorizontal: 16, paddingVertical: 14, marginBottom: 12,
  },
  rowMe: { borderColor: `${TERR}40`, borderWidth: 1.5 },

  rankBox: { width: 34, height: 34, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  rankNum: { fontSize: 13, fontWeight: '900', color: `${CHR}60` },

  avatarBubble: {
    width: 40, height: 40, borderRadius: 14,
    backgroundColor: `${SAGE}25`, alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: { width: 40, height: 40, borderRadius: 14 },
  avatarLetter: { fontSize: 16, fontWeight: '900', color: SAGE },

  username:  { fontSize: 14, fontWeight: '800', color: CHR },
  metaRow:   { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  metaText:  { fontSize: 11, color: `${CHR}55`, fontWeight: '600' },
  metaDot:   { fontSize: 11, color: `${CHR}30` },

  score:  { fontSize: 15, fontWeight: '900', color: CHR },

  loader:   { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadText: { fontSize: 12, color: `${CHR}50`, fontWeight: '600' },
  });
};
