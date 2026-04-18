import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Colors, Spacing, Typography, Radius, create3DCardStyle, Elevation } from '../../constants/theme';
import { IconSymbol } from '../ui/icon-symbol';
import { supabase } from '../../services/supabase';
import { useUserStore } from '../../store/useUserStore';

interface Props {
  rivalName: string;
  rivalRankTier: string; 
  pointsDifference: number; 
}

export function RivalCard({ rivalName, rivalRankTier, pointsDifference }: Props) {
  const isChasing = pointsDifference > 0;
  const [isPinging, setIsPinging] = React.useState(false);
  const { showToast, activeChallenge } = useUserStore();

  const handlePingRival = async () => {
    setIsPinging(true);
    // Determine if Rival is effectively in gauntlet. For immediate mockup feel, we assume
    // rival is in the same gauntlet if user is.
    const isInGauntlet = activeChallenge?.challengeName?.includes('GAUNTLET');
    
    try {
      await supabase.functions.invoke('send-nudge', {
        body: { sender_id: 'local_user', receiver_id: 'rival_id', is_in_gauntlet: isInGauntlet }
      });
      showToast('Ping Deployed');
    } catch {
      showToast('Ping Deployed (Mock)');
    }
    setTimeout(() => setIsPinging(false), 1000);
  };
  
  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.headerText}>COMPETITIVE TARGET</Text>
      </View>

      <View style={styles.contentRow}>
        <View style={styles.infoCol}>
          <Text style={styles.rivalName}>{rivalName}</Text>
          <Text style={styles.rivalRank}>{rivalRankTier}</Text>
        </View>

        <View style={styles.diffBox}>
          <Text style={[styles.diffText, { color: isChasing ? Colors.work : Colors.success }]}>
            {isChasing ? `-${pointsDifference.toLocaleString()}` : `+${pointsDifference.toLocaleString()}`}
          </Text>
          <Text style={styles.diffLabel}>PTS {isChasing ? 'BEHIND' : 'AHEAD'}</Text>
        </View>
      </View>

      <TouchableOpacity 
        style={styles.pingButton} 
        onPress={handlePingRival}
        disabled={isPinging}
      >
        {isPinging ? (
          <ActivityIndicator color={Colors.bg.primary} size="small" />
        ) : (
          <>
            <IconSymbol name="bolt.fill" size={14} color={Colors.bg.primary} />
            <Text style={styles.pingButtonText}>PING STRATEGY</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...create3DCardStyle(),
    padding: Spacing.xl,
    marginBottom: Spacing.xl,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    gap: Spacing.xs,
  },
  headerText: {
    ...Typography.caption,
    color: Colors.text.secondary,
    fontWeight: '600',
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
    ...Typography.h3,
    color: Colors.text.primary,
  },
  rivalRank: {
    ...Typography.caption,
    color: Colors.text.secondary,
  },
  diffBox: {
    alignItems: 'flex-end',
    backgroundColor: Colors.bg.card,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderBottomWidth: 2,
    borderBottomColor: Colors.borderDark,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xs,
  },
  diffText: {
    ...Typography.h2,
  },
  diffLabel: {
    ...Typography.caption,
  },
  pingButton: {
    marginTop: Spacing.xl,
    backgroundColor: Colors.accent,
    borderRadius: Radius.full,
    borderTopWidth: 1,
    borderTopColor: Colors.accentBorder,
    borderBottomWidth: 4,
    borderBottomColor: '#265BC7', // Darker blue shadow
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    ...Elevation.soft,
  },
  pingButtonText: {
    ...Typography.h3,
    color: '#000000',
  }
});
