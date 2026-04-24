import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, Dimensions, TouchableOpacity, Modal } from 'react-native';
import { supabase } from '../../services/supabase';
import { useUserStore } from '../../store/useUserStore';
import { Flame, Target, Timer, Sparkles, Brain, Dumbbell, Briefcase, X } from 'lucide-react-native';

import { useThemeStyles } from '../../hooks/use-theme-styles';

const screenWidth = Dimensions.get('window').width;

type DayInfo = {
  date: string;
  completedCount: number;
  failedCount: number;
  points: number;
  completedMissions: any[];
  categoryCounts: { BODY: number; MIND: number; WORK: number };
};

export default function OracleScreen() {
  const { tokens, styles, clay } = useThemeStyles(createStyles);
  const { BG, CHR, SAGE, TERR } = tokens;
  const { clayCard } = clay;

  const { profile } = useUserStore();
  const [loading, setLoading] = useState(true);
  
  const [heatmapData, setHeatmapData] = useState<DayInfo[]>([]);
  
  // Stats
  const [totalHours, setTotalHours] = useState<number>(0);
  const [judgePassRate, setJudgePassRate] = useState<number>(0);
  const [flowHour, setFlowHour] = useState<string>("TBD");
  
  // Categories
  const [bodyCount, setBodyCount] = useState(0);
  const [mindCount, setMindCount] = useState(0);
  const [workCount, setWorkCount] = useState(0);

  // Verdict
  const [verdict, setVerdict] = useState<string>("The Oracle is analyzing your discipline...");

  // Modal State
  const [selectedDay, setSelectedDay] = useState<DayInfo | null>(null);

  const loadData = React.useCallback(async () => {
    if (!profile) return;
    setLoading(true);
    
    // Fetch last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const { data } = await supabase
      .from('mission_completions')
      .select('*, missions(expected_duration_mins, category, title)')
      .eq('user_id', profile.user_id)
      .gte('created_at', thirtyDaysAgo.toISOString())
      .order('created_at', { ascending: false });

    if (data) {
      analyzeData(data);
    }
    
    setLoading(false);
  }, [profile]);

  const analyzeData = (data: any[]) => {
    // 1. Heatmap Data (last 30 days)
    const map = new Map<string, DayInfo>();
    for (let i = 0; i < 30; i++) {
       const d = new Date();
       d.setDate(d.getDate() - i);
       const dstr = d.toISOString().split('T')[0];
       map.set(dstr, { date: dstr, completedCount: 0, failedCount: 0, points: 0, completedMissions: [], categoryCounts: { BODY: 0, MIND: 0, WORK: 0 } });
    }
    
    let totalMins = 0;
    let totalAssessed = 0;
    let totalPassed = 0;
    let bCount = 0;
    let mCount = 0;
    let wCount = 0;
    const hourCounts = Array(24).fill(0);

    data.forEach(c => {
       const dstr = new Date(c.created_at).toISOString().split('T')[0];
       const day = map.get(dstr);

       if (c.status === 'COMPLETED' || c.status === 'FAILED') {
          totalAssessed++;
       }

       if (c.status === 'COMPLETED') {
          totalPassed++;
          if (c.missions?.expected_duration_mins) totalMins += c.missions.expected_duration_mins;
          if (day) {
            day.completedCount++;
            day.points += c.points_earned || 0;
            day.completedMissions.push(c.missions);
          }

          if (c.missions?.category === 'BODY') {
            bCount++;
            if (day) day.categoryCounts.BODY++;
          }
          if (c.missions?.category === 'MIND') {
            mCount++;
            if (day) day.categoryCounts.MIND++;
          }
          if (c.missions?.category === 'WORK') {
            wCount++;
            if (day) day.categoryCounts.WORK++;
          }

          if (c.started_at) {
             const hour = new Date(c.started_at).getHours();
             hourCounts[hour]++;
          }
       } else if (c.status === 'FAILED' && day) {
          day.failedCount++;
       }
    });

    const arr = Array.from(map.values()).reverse(); // oldest to newest
    setHeatmapData(arr);

    setBodyCount(bCount);
    setMindCount(mCount);
    setWorkCount(wCount);

    setTotalHours(Math.round((totalMins / 60) * 10) / 10);
    const passRate = totalAssessed > 0 ? Math.round((totalPassed / totalAssessed) * 100) : 0;
    setJudgePassRate(passRate);

    const maxHourCount = Math.max(...hourCounts);
    if (maxHourCount > 0) {
       const bestHour = hourCounts.indexOf(maxHourCount);
       const ampm = bestHour >= 12 ? 'PM' : 'AM';
       const hr12 = bestHour % 12 || 12;
       setFlowHour(`${hr12} ${ampm}`);
    } else {
       setFlowHour("N/A");
    }

    // Generate Verdict
    if (totalAssessed === 0) {
      setVerdict("You have no recent history. The Oracle awaits your first action.");
    } else if (passRate < 50) {
      setVerdict(`You are failing ${100 - passRate}% of your missions. Weakness is creeping in. Discipline must be enforced immediately.`);
    } else if (bCount === 0 && totalAssessed > 5) {
      setVerdict("Your Mind and Work are active, but your Body decays. The Oracle demands physical exertion.");
    } else if (mCount === 0 && totalAssessed > 5) {
      setVerdict("You are a machine of action, but lack reflection. Feed your Mind.");
    } else if (passRate >= 90 && totalPassed > 10) {
      setVerdict("Flawless execution. You operate with Vanguard precision. Maintain this standard.");
    } else {
      setVerdict(`Acceptable performance. ${passRate}% pass rate. Identify the leaks in your routine and eliminate them.`);
    }
  };

  useEffect(() => {
    loadData();
  }, [profile, loadData]);

  const getColorForDay = (day: DayInfo) => {
    if (day.completedCount === 0 && day.failedCount === 0) return `${CHR}10`; // Empty
    if (day.failedCount > day.completedCount) return `${TERR}80`; // Mostly failed -> Red
    if (day.points >= 100) return '#FFD700'; // Gold day

    const { BODY, MIND, WORK } = day.categoryCounts;
    if (BODY > MIND && BODY > WORK) return '#3B82F6'; // Blue
    if (MIND > BODY && MIND > WORK) return '#8B5CF6'; // Purple
    if (WORK > BODY && WORK > MIND) return '#F97316'; // Orange

    if (day.completedCount > 0) return SAGE; // Good mixed day
    return `${CHR}10`;
  };

  const getDayFormat = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.getDate().toString();
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
        {/* The Oracle's Verdict */}
        <View style={[styles.verdictCard, clayCard]}>
          <Text style={styles.verdictTitle}>The Oracle's Verdict</Text>
          <Text style={styles.verdictText}>{verdict}</Text>
          <View style={styles.streakRow}>
            <View style={styles.streakBadge}>
              <Flame size={14} color={TERR} />
              <Text style={styles.streakText}>{profile?.current_streak || 0} Day Streak</Text>
            </View>
            <View style={styles.streakBadge}>
              <Target size={14} color={SAGE} />
              <Text style={styles.streakText}>Max {profile?.max_streak || 0}</Text>
            </View>
          </View>
        </View>

        <Text style={styles.sectionTitle}>30-Day Protocol (Tap a day)</Text>
        <View style={[styles.heatmapCard, clayCard]}>
           <View style={styles.calendarGrid}>
             {heatmapData.map((day, i) => (
                <TouchableOpacity 
                  key={i} 
                  activeOpacity={0.7}
                  onPress={() => setSelectedDay(day)}
                  style={[styles.calendarBlock, { backgroundColor: getColorForDay(day) }]} 
                >
                  <Text style={[
                    styles.calendarText, 
                    { color: day.completedCount > 0 || day.failedCount > 0 ? BG : `${CHR}40` }
                  ]}>
                    {getDayFormat(day.date)}
                  </Text>
                </TouchableOpacity>
             ))}
           </View>
           <View style={styles.heatLegend}>
             <View style={styles.legendItem}>
                <View style={[styles.legendBlock, { backgroundColor: '#3B82F6' }]} />
                <Text style={styles.legendText}>Body</Text>
             </View>
             <View style={styles.legendItem}>
                <View style={[styles.legendBlock, { backgroundColor: '#8B5CF6' }]} />
                <Text style={styles.legendText}>Mind</Text>
             </View>
             <View style={styles.legendItem}>
                <View style={[styles.legendBlock, { backgroundColor: '#F97316' }]} />
                <Text style={styles.legendText}>Work</Text>
             </View>
             <View style={styles.legendItem}>
                <View style={[styles.legendBlock, { backgroundColor: SAGE }]} />
                <Text style={styles.legendText}>Mix</Text>
             </View>
             <View style={styles.legendItem}>
                <View style={[styles.legendBlock, { backgroundColor: '#FFD700' }]} />
                <Text style={styles.legendText}>Elite</Text>
             </View>
             <View style={styles.legendItem}>
                <View style={[styles.legendBlock, { backgroundColor: `${TERR}80` }]} />
                <Text style={styles.legendText}>Failed</Text>
             </View>
             <View style={styles.legendItem}>
                <View style={[styles.legendBlock, { backgroundColor: `${CHR}10` }]} />
                <Text style={styles.legendText}>Rest</Text>
             </View>
           </View>
        </View>

        <Text style={styles.sectionTitle}>Category Proficiency</Text>
        <View style={styles.categoryGrid}>
           <View style={[styles.catCard, clayCard]}>
              <Dumbbell size={24} color={CHR} />
              <Text style={styles.catVal}>{bodyCount}</Text>
              <Text style={styles.catLbl}>BODY</Text>
           </View>
           <View style={[styles.catCard, clayCard]}>
              <Brain size={24} color={SAGE} />
              <Text style={styles.catVal}>{mindCount}</Text>
              <Text style={styles.catLbl}>MIND</Text>
           </View>
           <View style={[styles.catCard, clayCard]}>
              <Briefcase size={24} color={TERR} />
              <Text style={styles.catVal}>{workCount}</Text>
              <Text style={styles.catLbl}>WORK</Text>
           </View>
        </View>

        <Text style={styles.sectionTitle}>Flow State Analytics</Text>
        <View style={styles.statsGrid}>
           <View style={[styles.statCard, clayCard]}>
              <Flame size={20} color={TERR} strokeWidth={2.5} />
              <Text style={styles.statVal}>{flowHour}</Text>
              <Text style={styles.statLbl}>Peak Flow</Text>
           </View>
           <View style={[styles.statCard, clayCard]}>
              <Timer size={20} color={CHR} strokeWidth={2.5} />
              <Text style={styles.statVal}>{totalHours}h</Text>
              <Text style={styles.statLbl}>Locked In</Text>
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

      {/* Day Detail Modal */}
      <Modal visible={!!selectedDay} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, clayCard]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalDate}>{selectedDay?.date}</Text>
              <TouchableOpacity onPress={() => setSelectedDay(null)}>
                <X size={24} color={CHR} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalStatsRow}>
              <View style={styles.modalStat}>
                <Text style={styles.modalStatVal}>{selectedDay?.points}</Text>
                <Text style={styles.modalStatLbl}>Points</Text>
              </View>
              <View style={styles.modalStat}>
                <Text style={[styles.modalStatVal, { color: SAGE }]}>{selectedDay?.completedCount}</Text>
                <Text style={styles.modalStatLbl}>Passed</Text>
              </View>
              <View style={styles.modalStat}>
                <Text style={[styles.modalStatVal, { color: TERR }]}>{selectedDay?.failedCount}</Text>
                <Text style={styles.modalStatLbl}>Failed</Text>
              </View>
            </View>

            <ScrollView style={styles.modalMissions}>
              {selectedDay?.completedMissions.length === 0 ? (
                <Text style={styles.noMissions}>No missions completed on this day.</Text>
              ) : (
                selectedDay?.completedMissions.map((m, i) => (
                  <View key={i} style={styles.missionRow}>
                    <Sparkles size={14} color={SAGE} />
                    <Text style={styles.missionTitle}>{m?.title || 'Unknown Mission'}</Text>
                  </View>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const createStyles = (tokens: any) => {
  const { BG, CHR, SAGE, TERR } = tokens;
  return StyleSheet.create({
  root: { flex: 1, backgroundColor: BG },
  header: {
    paddingTop: 60, paddingHorizontal: 20, paddingBottom: 10,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'
  },
  brandName: { fontSize: 24, fontWeight: '900', color: CHR, letterSpacing: -0.5 },
  scroll: { padding: 20, paddingBottom: 100 },
  sectionTitle: {
    fontSize: 12, fontWeight: '900', color: `${CHR}50`, 
    letterSpacing: 2, textTransform: 'uppercase', marginBottom: 12, marginTop: 10
  },
  
  verdictCard: {
    borderRadius: 20, padding: 24, marginBottom: 30,
    backgroundColor: `${CHR}05`,
  },
  verdictTitle: { fontSize: 10, fontWeight: '900', color: `${CHR}60`, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 12 },
  verdictText: { fontSize: 16, fontWeight: '700', color: CHR, lineHeight: 24, marginBottom: 20 },
  streakRow: { flexDirection: 'row', gap: 10 },
  streakBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: `${CHR}10`, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, gap: 6 },
  streakText: { fontSize: 12, fontWeight: '800', color: CHR },

  heatmapCard: {
    borderRadius: 20, padding: 20, marginBottom: 30, alignItems: 'center'
  },
  calendarGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 6, 
    width: '100%', justifyContent: 'flex-start'
  },
  calendarBlock: {
    width: (screenWidth - 80 - 36) / 7, // 7 columns
    aspectRatio: 1, 
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarText: {
    fontSize: 12, fontWeight: '800'
  },
  heatLegend: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16,
    width: '100%', marginTop: 24, flexWrap: 'wrap'
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendText: { fontSize: 10, fontWeight: '800', color: `${CHR}60`, letterSpacing: 1, textTransform: 'uppercase' },
  legendBlock: { width: 12, height: 12, borderRadius: 3 },
  
  categoryGrid: { flexDirection: 'row', gap: 10, marginBottom: 30 },
  catCard: { flex: 1, borderRadius: 16, padding: 16, alignItems: 'center', gap: 8 },
  catVal: { fontSize: 20, fontWeight: '900', color: CHR },
  catLbl: { fontSize: 10, fontWeight: '900', color: `${CHR}50`, letterSpacing: 1 },

  statsGrid: { flexDirection: 'row', gap: 14, marginBottom: 14 },
  statCard: { flex: 1, borderRadius: 20, padding: 20, gap: 8 },
  statVal: { fontSize: 24, fontWeight: '900', color: CHR },
  statLbl: { fontSize: 10, fontWeight: '800', color: `${CHR}50`, letterSpacing: 1, textTransform: 'uppercase' },

  passRateCard: { borderRadius: 20, padding: 24, marginBottom: 30 },
  passRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  passTitle: { fontSize: 32, fontWeight: '900', color: SAGE },
  passSub: { fontSize: 12, fontWeight: '800', color: `${CHR}60`, textTransform: 'uppercase', letterSpacing: 1 },
  passIcon: { width: 50, height: 50, borderRadius: 25, alignItems: 'center', justifyContent: 'center' },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: BG, borderRadius: 24, padding: 24, maxHeight: '70%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalDate: { fontSize: 20, fontWeight: '900', color: CHR },
  modalStatsRow: { flexDirection: 'row', justifyContent: 'space-around', backgroundColor: `${CHR}05`, padding: 16, borderRadius: 16, marginBottom: 20 },
  modalStat: { alignItems: 'center' },
  modalStatVal: { fontSize: 24, fontWeight: '900', color: CHR },
  modalStatLbl: { fontSize: 10, fontWeight: '800', color: `${CHR}50`, textTransform: 'uppercase', marginTop: 4 },
  modalMissions: { flexGrow: 0 },
  noMissions: { fontSize: 14, color: `${CHR}50`, fontStyle: 'italic', textAlign: 'center', marginTop: 20 },
  missionRow: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: `${CHR}05`, padding: 12, borderRadius: 12, marginBottom: 8 },
  missionTitle: { fontSize: 14, fontWeight: '600', color: CHR, flex: 1 }
  });
};

