import React from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { Shield, Target, Zap } from 'lucide-react-native';
import { useUserStore } from '../../store/useUserStore';
import { useThemeStyles } from '../../hooks/use-theme-styles';

export function RivalCard() {
  const { tokens, styles: themeStyles, clay } = useThemeStyles(createCardStyles);
  const { CHR, TERR, SAGE, MUST, isDark } = tokens;
  const { clayCard } = clay;

  const [isPinging, setIsPinging] = React.useState(false);
  const { 
    rivalProfile, discoverRival, showToast, disciplineScore 
  } = useUserStore();

  React.useEffect(() => {
    discoverRival();
  }, [discoverRival]);

  if (!rivalProfile) return null;

  const pointsDifference = Math.abs(disciplineScore - rivalProfile.score);
  const isChasing = disciplineScore < rivalProfile.score;
  
  const handlePingRival = async () => {
    setIsPinging(true);
    try {
      // Logic for nudging rival
      await new Promise(r => setTimeout(r, 1000));
      showToast(`Ping sent to ${rivalProfile.username}`);
    } finally {
      setIsPinging(false);
    }
  };
  
  return (
    <View style={[styles.container, clayCard]}>
      <View style={styles.headerRow}>
        <Target size={14} color={isChasing ? TERR : SAGE} strokeWidth={2.5} />
        <Text style={styles.headerText}>COMPETITIVE RIVAL</Text>
      </View>

      <View style={styles.contentRow}>
        <View style={styles.infoCol}>
          <Text style={styles.rivalName}>{rivalProfile.username}</Text>
          <View style={styles.rankRow}>
            <Shield size={10} color={`${CHR}60`} strokeWidth={2} />
            <Text style={styles.rivalRank}>{rivalProfile.tier}</Text>
          </View>
        </View>

        <View style={[styles.diffBox, { borderColor: isChasing ? `${TERR}30` : `${SAGE}30` }]}>
          <Text style={[styles.diffText, { color: isChasing ? TERR : SAGE }]}>
            {isChasing ? `-${pointsDifference.toLocaleString()}` : `+${pointsDifference.toLocaleString()}`}
          </Text>
          <Text style={styles.diffLabel}>PTS {isChasing ? 'BEHIND' : 'AHEAD'}</Text>
        </View>
      </View>

      <Pressable 
        style={({ pressed }) => [
          styles.pingButton, 
          { backgroundColor: pressed ? `${MUST}90` : MUST },
          isPinging && { opacity: 0.7 }
        ]} 
        onPress={handlePingRival}
        disabled={isPinging}
      >
        {isPinging ? (
          <ActivityIndicator color="#000" size="small" />
        ) : (
          <>
            <Zap size={16} color="#000" strokeWidth={2.5} />
            <Text style={styles.pingButtonText}>ZAP RIVAL</Text>
          </>
        )}
      </Pressable>
    </View>
  );
}

const createCardStyles = (tokens: any) => {
  const { CHR } = tokens;
  return StyleSheet.create({}); // Logic handled by useThemeStyles
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 24,
    padding: 20,
    borderRadius: 28,
    marginBottom: 24,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  headerText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#3D405B',
    letterSpacing: 1.5,
    opacity: 0.5,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  infoCol: {
    flex: 1,
  },
  rivalName: {
    fontSize: 22,
    fontWeight: '900',
    color: '#3D405B',
  },
  rankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  rivalRank: {
    fontSize: 11,
    fontWeight: '800',
    color: '#3D405B',
    opacity: 0.6,
    textTransform: 'uppercase',
  },
  diffBox: {
    alignItems: 'flex-end',
    backgroundColor: 'rgba(255,255,255,0.4)',
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  diffText: {
    fontSize: 20,
    fontWeight: '900',
  },
  diffLabel: {
    fontSize: 8,
    fontWeight: '800',
    color: '#3D405B',
    opacity: 0.5,
    marginTop: 2,
  },
  pingButton: {
    marginTop: 20,
    height: 52,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  pingButtonText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#000',
    letterSpacing: 1,
  }
});
