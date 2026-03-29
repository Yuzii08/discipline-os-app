import React from 'react';
import { View, Text, StyleSheet, ScrollView, StatusBar, Pressable } from 'react-native';
import { useUserStore } from '../../store/useUserStore';
import { Flame, Award, Star, Edit2 } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useThemeStyles } from '../../hooks/use-theme-styles';

const getDomains = (TERR: string, SAGE: string, MUST: string) => [
  { key: 'BODY', color: TERR, pct: 42 },
  { key: 'MIND', color: SAGE, pct: 88 },
  { key: 'WORK', color: MUST, pct: 70 },
];

export default function ProfileScreen() {
  const { tokens, styles, clay } = useThemeStyles(createStyles);
  const { BG, CHR, SAGE, TERR, MUST } = tokens;
  const { clayCard } = clay;
  const DOMAINS = getDomains(TERR, SAGE, MUST);

  const { profile, disciplineScore, currentStreak } = useUserStore();
  const router   = useRouter();
  const username = profile?.username || 'Warrior';
  const tier     = profile?.global_rank_tier || 'Novice';
  const initial  = username[0].toUpperCase();

  // Consistency index mock
  const maxScore       = 5000;
  const consistencyIdx = Math.min(100, Math.round((disciplineScore / maxScore) * 100));

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={BG} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ── HERO ── */}
        <View style={styles.hero}>
          <View style={[styles.avatar, clayCard]}>
            <Text style={styles.avatarLetter}>{initial}</Text>
          </View>
          <Text style={styles.username}>{username}</Text>
          <View style={[styles.tierBadge, { backgroundColor: `${SAGE}25` }]}>
            <Award size={13} color={SAGE} strokeWidth={2.5} />
            <Text style={styles.tierText}>{tier}</Text>
          </View>
          <Pressable style={styles.editBtn} onPress={() => router.push('/edit-profile')}>
            <Edit2 size={14} color={CHR} strokeWidth={2.5} />
            <Text style={styles.editBtnText}>Edit Profile</Text>
          </Pressable>
        </View>

        {/* ── STATS ROW ── */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, clayCard, { backgroundColor: SAGE }]}>
            <Text style={styles.statVal}>{disciplineScore.toLocaleString()}</Text>
            <Text style={styles.statLabel}>Lifetime Points</Text>
          </View>
          <View style={[styles.statCard, clayCard, { backgroundColor: TERR }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Flame size={18} color="#fff" strokeWidth={2.5} />
              <Text style={styles.statVal}>{currentStreak}</Text>
            </View>
            <Text style={styles.statLabel}>Day Streak</Text>
          </View>
          <View style={[styles.statCard, clayCard, { backgroundColor: MUST }]}>
            <Text style={[styles.statVal, { color: CHR }]}>{consistencyIdx}%</Text>
            <Text style={[styles.statLabel, { color: `${CHR}80` }]}>Consistency</Text>
          </View>
        </View>

        {/* ── PERFORMANCE DOMAINS ── */}
        <Text style={styles.sectionLabel}>Performance Output</Text>
        <View style={[styles.card, clayCard]}>
          {DOMAINS.map((d, i) => (
            <View key={d.key} style={[styles.domainRow, i < DOMAINS.length - 1 && styles.domainDivider]}>
              <Text style={styles.domainKey}>{d.key}</Text>
              <View style={styles.track}>
                <View style={[styles.fill, { width: `${d.pct}%` as any, backgroundColor: d.color }]} />
              </View>
              <Text style={styles.domainPct}>{d.pct}%</Text>
            </View>
          ))}
        </View>

        {/* ── AI ASSESSMENT ── */}
        <Text style={styles.sectionLabel}>Observer Assessment</Text>
        <View style={[styles.aiCard, clayCard]}>
          <Star size={18} color={MUST} strokeWidth={2} style={{ marginBottom: 10 }} />
          <Text style={styles.aiText}>
            &quot;Your physical discipline is lagging behind your mental output. A weak vessel cannot support a strong mind. Rebalance in tomorrow&apos;s protocol.&quot;
          </Text>
          <Text style={styles.aiDate}>Analysis logged 48 hours ago</Text>
        </View>

      </ScrollView>
    </View>
  );
}

const createStyles = (tokens: any) => {
  const { BG, CHR, SAGE, TERR, MUST } = tokens;
  return StyleSheet.create({
  root:   { flex: 1, backgroundColor: BG },
  scroll: { paddingHorizontal: 20, paddingTop: 56, paddingBottom: 120 },

  hero: { alignItems: 'center', marginBottom: 28 },
  avatar: {
    width: 84, height: 84, borderRadius: 28,
    backgroundColor: `${SAGE}25`, alignItems: 'center', justifyContent: 'center',
    marginBottom: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)',
  },
  avatarLetter: { fontSize: 36, fontWeight: '900', color: SAGE },
  username:     { fontSize: 24, fontWeight: '900', color: CHR, marginBottom: 8 },
  tierBadge:    { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 100, paddingHorizontal: 14, paddingVertical: 6 },
  tierText:     { fontSize: 12, fontWeight: '800', color: SAGE },
  editBtn:      { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12, paddingHorizontal: 16, paddingVertical: 8, backgroundColor: `${CHR}10`, borderRadius: 100 },
  editBtnText:  { fontSize: 12, fontWeight: '800', color: CHR },

  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 28 },
  statCard:  {
    flex: 1, borderRadius: 20, padding: 14,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.35)',
  },
  statVal:   { fontSize: 18, fontWeight: '900', color: '#fff', marginBottom: 4 },
  statLabel: { fontSize: 9, fontWeight: '800', color: 'rgba(255,255,255,0.7)', letterSpacing: 1, textTransform: 'uppercase' },

  sectionLabel: { fontSize: 10, fontWeight: '900', color: `${CHR}50`, letterSpacing: 2.5, textTransform: 'uppercase', marginBottom: 12 },

  card: {
    backgroundColor: BG, borderRadius: 24,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.5)',
    paddingVertical: 6, paddingHorizontal: 20, marginBottom: 24,
  },
  domainRow:     { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, gap: 12 },
  domainDivider: { borderBottomWidth: 1, borderBottomColor: `${CHR}08` },
  domainKey:     { fontSize: 11, fontWeight: '900', color: CHR, width: 40, letterSpacing: 1 },
  track:         { flex: 1, height: 8, backgroundColor: `${CHR}12`, borderRadius: 100, overflow: 'hidden' },
  fill:          { height: '100%', borderRadius: 100 },
  domainPct:     { fontSize: 13, fontWeight: '800', color: CHR, width: 36, textAlign: 'right' },

  aiCard: {
    backgroundColor: BG, borderRadius: 24,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.5)',
    padding: 20, marginBottom: 16,
  },
  aiText: { fontSize: 14, fontStyle: 'italic', color: `${CHR}80`, lineHeight: 22, marginBottom: 10 },
  aiDate: { fontSize: 10, fontWeight: '700', color: `${CHR}40`, letterSpacing: 1, textTransform: 'uppercase' },
  });
};
