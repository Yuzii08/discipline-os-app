import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, Dimensions } from 'react-native';
import { supabase } from '../../services/supabase';
import { useUserStore } from '../../store/useUserStore';
import { Flame, Target, Timer, Sparkles } from 'lucide-react-native';

import { useThemeStyles } from '../../hooks/use-theme-styles';

const screenWidth = Dimensions.get('window').width;

export default function OracleScreen() {
  const { tokens, styles, clay } = useThemeStyles(createStyles);
  const { CHR, SAGE, TERR } = tokens;
  const { clayCard } = clay;

  const { profile } = useUserStore();
  const [loading, setLoading] = useState(true);
  
  const [flowHour, setFlowHour] = useState<string>("TBD");
  const [totalHours, setTotalHours] = useState<number>(0);
  const [judgePassRate, setJudgePassRate] = useState<number>(0);
  const [heatmapData, setHeatmapData] = useState<number[]>([]);

  const loadData = React.useCallback(async () => {
    if (!profile) return;
    setLoading(true);
    
    // Fetch last 90 days of completions
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    
    const { data } = await supabase
      .from('mission_completions')
      .select('*, missions(expected_duration_mins)')
      .eq('user_id', profile.user_id)
      .gte('created_at', ninetyDaysAgo.toISOString())
      .order('created_at', { ascending: false });

    if (data) {
      analyzeData(data);
    }
    
    setLoading(false);
  }, [profile]);

  const analyzeData = (data: any[]) => {
    // 1. Heatmap Data (last 90 days)
    const map = new Map<string, number>();
    for (let i = 0; i < 90; i++) {
       const d = new Date();
       d.setDate(d.getDate() - i);
       map.set(d.toISOString().split('T')[0], 0);
    }
    
    let totalMins = 0;
    let totalAssessed = 0;
    let totalPassed = 0;
    const hourCounts = Array(24).fill(0);

    data.forEach(c => {
       const dstr = new Date(c.created_at).toISOString().split('T')[0];
       if (map.has(dstr) && c.status === 'COMPLETED') {
          map.set(dstr, map.get(dstr)! + 1);
       }

       if (c.status === 'COMPLETED' || c.status === 'FAILED') {
          totalAssessed++;
          if (c.status === 'COMPLETED') totalPassed++;
       }

       if (c.status === 'COMPLETED' && c.missions?.expected_duration_mins) {
          totalMins += c.missions.expected_duration_mins;
       }

       if (c.started_at && c.status === 'COMPLETED') {
          const hour = new Date(c.started_at).getHours();
          hourCounts[hour]++;
       }
    });

    const arr = Array.from(map.values()).reverse(); // oldest to newest
    setHeatmapData(arr);

    setTotalHours(Math.round((totalMins / 60) * 10) / 10);
    setJudgePassRate(totalAssessed > 0 ? Math.round((totalPassed / totalAssessed) * 100) : 0);

    const maxHourCount = Math.max(...hourCounts);
    if (maxHourCount > 0) {
       const bestHour = hourCounts.indexOf(maxHourCount);
       const ampm = bestHour >= 12 ? 'PM' : 'AM';
       const hr12 = bestHour % 12 || 12;
       setFlowHour(`${hr12} ${ampm}`);
    } else {
       setFlowHour("N/A");
    }
  };

  useEffect(() => {
    loadData();
  }, [profile, loadData]);

  const getColorForIntensity = (count: number) => {
    if (count === 0) return `${CHR}10`;
    if (count === 1) return `${SAGE}66`;
    if (count === 2) return `${SAGE}B3`;
    return SAGE;
  };

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.brandName}>The Oracle</Text>
        <Sparkles size={20} color={SAGE} strokeWidth={2.5} />
      </View>

      <ScrollView 
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={loadData} tintColor={SAGE} />}
      >
        <Text style={styles.sectionTitle}>Consistency Radar</Text>
        <View style={[styles.heatmapCard, clayCard]}>
           <View style={styles.heatmapGrid}>
             {heatmapData.map((count, i) => (
                <View 
                  key={i} 
                  style={[styles.heatBlock, { backgroundColor: getColorForIntensity(count) }]} 
                />
             ))}
           </View>
           <View style={styles.heatLegend}>
             <Text style={styles.legendText}>Less</Text>
             <View style={{ flexDirection: 'row', gap: 4 }}>
                <View style={[styles.legendBlock, { backgroundColor: getColorForIntensity(0) }]} />
                <View style={[styles.legendBlock, { backgroundColor: getColorForIntensity(1) }]} />
                <View style={[styles.legendBlock, { backgroundColor: getColorForIntensity(2) }]} />
                <View style={[styles.legendBlock, { backgroundColor: getColorForIntensity(3) }]} />
             </View>
             <Text style={styles.legendText}>More</Text>
           </View>
        </View>

        <Text style={styles.sectionTitle}>Flow State Analytics</Text>
        <View style={styles.statsGrid}>
           <View style={[styles.statCard, clayCard]}>
              <Flame size={20} color={TERR} strokeWidth={2.5} />
              <Text style={styles.statVal}>{flowHour}</Text>
              <Text style={styles.statLbl}>Peak Flow Hour</Text>
           </View>
           <View style={[styles.statCard, clayCard]}>
              <Timer size={20} color={CHR} strokeWidth={2.5} />
              <Text style={styles.statVal}>{totalHours}h</Text>
              <Text style={styles.statLbl}>Total Locked Time</Text>
           </View>
        </View>

        <View style={[styles.passRateCard, clayCard]}>
           <View style={styles.passRow}>
              <View>
                 <Text style={styles.passTitle}>{judgePassRate}%</Text>
                 <Text style={styles.passSub}>Judge Verdict Pass Rate</Text>
              </View>
              <View style={[styles.passIcon, { backgroundColor: `${SAGE}30` }]}>
                 <Target size={24} color={SAGE} strokeWidth={2.5} />
              </View>
           </View>
        </View>

      </ScrollView>
    </View>
  );
}

const createStyles = (tokens: any) => {
  const { BG, CHR, SAGE } = tokens;
  return StyleSheet.create({
  root: { flex: 1, backgroundColor: BG },
  header: {
    paddingTop: 60, paddingHorizontal: 20, paddingBottom: 20,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'
  },
  brandName: { fontSize: 24, fontWeight: '900', color: CHR, letterSpacing: -0.5 },
  scroll: { padding: 20, paddingBottom: 100 },
  sectionTitle: {
    fontSize: 12, fontWeight: '900', color: `${CHR}50`, 
    letterSpacing: 2, textTransform: 'uppercase', marginBottom: 12, marginTop: 10
  },
  heatmapCard: {
    borderRadius: 20, padding: 20, marginBottom: 30, alignItems: 'center'
  },
  heatmapGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 4, 
    width: screenWidth - 80, justifyContent: 'center'
  },
  heatBlock: {
    width: 12, height: 12, borderRadius: 3,
  },
  heatLegend: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    width: '100%', marginTop: 20, paddingHorizontal: 10
  },
  legendText: { fontSize: 10, fontWeight: '800', color: `${CHR}60`, letterSpacing: 1, textTransform: 'uppercase' },
  legendBlock: { width: 10, height: 10, borderRadius: 2 },
  
  statsGrid: { flexDirection: 'row', gap: 14, marginBottom: 14 },
  statCard: { flex: 1, borderRadius: 20, padding: 20, gap: 8 },
  statVal: { fontSize: 24, fontWeight: '900', color: CHR },
  statLbl: { fontSize: 10, fontWeight: '800', color: `${CHR}50`, letterSpacing: 1, textTransform: 'uppercase' },

  passRateCard: { borderRadius: 20, padding: 24, marginBottom: 30 },
  passRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  passTitle: { fontSize: 32, fontWeight: '900', color: SAGE },
  passSub: { fontSize: 12, fontWeight: '800', color: `${CHR}60`, textTransform: 'uppercase', letterSpacing: 1 },
  passIcon: { width: 50, height: 50, borderRadius: 25, alignItems: 'center', justifyContent: 'center' }
  });
};
