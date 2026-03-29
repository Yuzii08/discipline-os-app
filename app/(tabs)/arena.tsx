import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, Pressable } from 'react-native';
import { supabase } from '../../services/supabase';
import { useUserStore } from '../../store/useUserStore';
import { ActivityIndicator } from 'react-native';
import { Flame, Activity, XOctagon, Trophy } from 'lucide-react-native';
import { useThemeStyles } from '../../hooks/use-theme-styles';

type ViewMode = 'RADAR' | 'GRAVEYARD' | 'RANKINGS';

export default function ArenaScreen() {
  const { tokens, styles, clay } = useThemeStyles(createStyles);
  const { BG, CHR, SAGE, TERR, MUST } = tokens;
  const { clayCard } = clay;

  const { profile } = useUserStore();
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<ViewMode>('RADAR');
  
  const [radar, setRadar] = useState<any[]>([]);
  const [graveyard, setGraveyard] = useState<any[]>([]);
  const [rankings, setRankings] = useState<any[]>([]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (view === 'RADAR' || view === 'GRAVEYARD') {
        const statusFilter = view === 'RADAR' ? 'PENDING' : 'FAILED';
        
        let query = supabase
          .from('mission_completions')
          .select('*, users!inner(username, current_streak, max_streak), missions!inner(title, category)')
          .eq('status', statusFilter)
          .order('started_at', { ascending: false, nullsFirst: false })
          .limit(20);
          
        const { data, error } = await query;
        if (!error && data) {
           if (view === 'RADAR') {
              const active = data.filter((c: any) => c.started_at && !c.ended_at);
              setRadar(active);
           } else {
              setGraveyard(data);
           }
        }
      } else if (view === 'RANKINGS') {
        const { data, error } = await supabase
          .from('users')
          .select('username, current_streak, discipline_score')
          .order('discipline_score', { ascending: false })
          .limit(10);
          
        if (!error && data) setRankings(data);
      }
    } catch (e) {
      console.warn("Arena fetch failed:", e);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [view]);

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.brandName}>The Arena</Text>
        <Flame size={20} color={TERR} strokeWidth={2.5} />
      </View>

      <View style={styles.tabRow}>
         <Pressable style={[styles.tabBtn, view === 'RADAR' && styles.tabBtnActive]} onPress={() => setView('RADAR')}>
            <Activity size={16} color={view === 'RADAR' ? '#fff' : CHR} />
            <Text style={[styles.tabText, view === 'RADAR' && { color: '#fff' }]}>Live Radar</Text>
         </Pressable>
         <Pressable style={[styles.tabBtn, view === 'GRAVEYARD' && styles.tabBtnActive]} onPress={() => setView('GRAVEYARD')}>
            <XOctagon size={16} color={view === 'GRAVEYARD' ? '#fff' : CHR} />
            <Text style={[styles.tabText, view === 'GRAVEYARD' && { color: '#fff' }]}>Graveyard</Text>
         </Pressable>
         <Pressable style={[styles.tabBtn, view === 'RANKINGS' && styles.tabBtnActive]} onPress={() => setView('RANKINGS')}>
            <Trophy size={16} color={view === 'RANKINGS' ? '#fff' : CHR} />
            <Text style={[styles.tabText, view === 'RANKINGS' && { color: '#fff' }]}>Rankings</Text>
         </Pressable>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={loadData} tintColor={CHR} />}
      >
        {view === 'RADAR' && (
          <View style={styles.list}>
             {radar.length === 0 && !loading && <Text style={styles.emptyText}>No users are enduring the Protocol right now.</Text>}
             {radar.map(item => (
                <View key={item.completion_id} style={[styles.feedCard, clayCard]}>
                   <View style={styles.avatarCirc}><Text style={styles.avatarT}>{(item.users?.username || 'U')[0].toUpperCase()}</Text></View>
                   <View style={{ flex: 1 }}>
                      <Text style={styles.userName}>{item.users?.username || 'Unknown'}</Text>
                      <Text style={styles.actionText}>Currently enduring: {item.missions?.title || 'Unknown Mission'}</Text>
                   </View>
                   <Activity size={16} color={SAGE} />
                </View>
             ))}
          </View>
        )}

        {view === 'GRAVEYARD' && (
          <View style={styles.list}>
             {graveyard.length === 0 && !loading && <Text style={styles.emptyText}>The Graveyard is empty. Everyone is holding the line.</Text>}
             {graveyard.map(item => (
                <View key={item.completion_id} style={[styles.feedCard, clayCard, { borderLeftWidth: 4, borderLeftColor: TERR }]}>
                   <View style={[styles.avatarCirc, { backgroundColor: `${TERR}25` }]}><Text style={[styles.avatarT, { color: TERR }]}>{(item.users?.username || 'U')[0].toUpperCase()}</Text></View>
                   <View style={{ flex: 1 }}>
                      <Text style={styles.userName}>{item.users?.username || 'Unknown'}</Text>
                      <Text style={styles.actionText}>Failed or lapsed: {item.missions?.title || 'Unknown Mission'}</Text>
                   </View>
                   <XOctagon size={16} color={TERR} />
                </View>
             ))}
          </View>
        )}

        {view === 'RANKINGS' && (
          <View style={styles.list}>
             {rankings.map((user, idx) => (
                <View key={idx} style={[styles.feedCard, clayCard]}>
                   <Text style={styles.rankNum}>#{idx + 1}</Text>
                   <View style={styles.avatarCirc}><Text style={styles.avatarT}>{(user.username || 'U')[0].toUpperCase()}</Text></View>
                   <View style={{ flex: 1 }}>
                      <Text style={[styles.userName, idx === 0 && { color: MUST, fontSize: 16 }]}>{user.username}</Text>
                      <Text style={styles.actionText}>{user.current_streak} Day Streak</Text>
                   </View>
                   <Text style={styles.scoreText}>{user.discipline_score} pts</Text>
                </View>
             ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const createStyles = (tokens: any) => {
  const { BG, CHR, SAGE, TERR, MUST } = tokens;
  return StyleSheet.create({
  root: { flex: 1, backgroundColor: BG },
  header: {
    paddingTop: 60, paddingHorizontal: 20, paddingBottom: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  brandName: { fontSize: 24, fontWeight: '900', color: CHR, letterSpacing: -0.5 },
  tabRow: {
    flexDirection: 'row', paddingHorizontal: 20, gap: 10,
    borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)', paddingBottom: 16
  },
  tabBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 12, borderRadius: 12, backgroundColor: `${CHR}08`
  },
  tabBtnActive: { backgroundColor: CHR },
  tabText: { fontSize: 11, fontWeight: '800', color: CHR, textTransform: 'uppercase', letterSpacing: 0.5 },
  scroll: { padding: 20, paddingBottom: 100 },
  list: { gap: 14 },
  emptyText: { textAlign: 'center', marginTop: 40, fontSize: 14, fontWeight: '700', color: `${CHR}40` },
  feedCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderRadius: 18
  },
  avatarCirc: {
    width: 38, height: 38, borderRadius: 19, backgroundColor: `${CHR}10`,
    alignItems: 'center', justifyContent: 'center'
  },
  avatarT: { fontSize: 16, fontWeight: '900', color: CHR },
  userName: { fontSize: 14, fontWeight: '900', color: CHR, marginBottom: 2 },
  actionText: { fontSize: 12, fontWeight: '600', color: `${CHR}60` },
  rankNum: { fontSize: 16, fontWeight: '900', color: `${CHR}40`, width: 24 },
  scoreText: { fontSize: 14, fontWeight: '900', color: SAGE }
  });
};
