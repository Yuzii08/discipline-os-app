import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Spacing, Typography, Radius } from '../../constants/theme';
import { IconSymbol } from '../ui/icon-symbol';

interface Props {
  challengeName: string;
  currentDay: number;
  totalDays: number;
  participantsStarted: number;
  participantsRemain: number;
}

export function ChallengeStatusCard({ 
  challengeName, currentDay, totalDays, participantsRemain 
}: Props) {
  const progressPercent = Math.min((currentDay / totalDays) * 100, 100);

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <IconSymbol name="shield.fill" size={14} color={Colors.text.secondary} />
        <Text style={styles.headerText}>ACTIVE CHALLENGE</Text>
      </View>

      <Text style={styles.challengeName}>{challengeName}</Text>
      
      <View style={styles.statsRow}>
        <View>
          <Text style={styles.statValue}>Day {currentDay}<Text style={styles.statValueSub}>/{totalDays}</Text></Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={styles.statValue}>{participantsRemain.toLocaleString()}</Text>
          <Text style={styles.statLabel}>Remaining</Text>
        </View>
      </View>

      <View style={styles.progressBarBg}>
        <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.bg.card,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
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
  challengeName: {
    ...Typography.h3,
    color: Colors.text.primary,
    marginBottom: Spacing.md,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  statValue: {
    ...Typography.h3,
    color: Colors.text.primary,
  },
  statValueSub: {
    ...Typography.h3,
    color: Colors.text.secondary,
    fontSize: 16, // slightly smaller
  },
  statLabel: {
    ...Typography.caption,
    color: Colors.text.secondary,
  },
  progressBarBg: {
    height: 6,
    backgroundColor: Colors.bg.primary,
    borderRadius: 3,
    width: '100%',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Colors.accent,
    borderRadius: 3,
  },
});
