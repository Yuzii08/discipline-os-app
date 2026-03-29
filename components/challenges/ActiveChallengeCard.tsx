import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Spacing, Typography, Radius, create3DCardStyle } from '../../constants/theme';
import { useUserStore } from '../../store/useUserStore';
import { useMissionStore } from '../../store/useMissionStore';

// Custom hook to calculate time until midnight
function useTimeUntilMidnight() {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const calculateTime = () => {
      const now = new Date();
      const midnight = new Date(now);
      midnight.setHours(24, 0, 0, 0); // Next midnight
      
      const diff = midnight.getTime() - now.getTime();
      const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((diff % (1000 * 60)) / 1000);
      
      setTimeLeft(
        `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
      );
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return timeLeft;
}

export function ActiveChallengeCard() {
  const timeLeft = useTimeUntilMidnight();
  const activeChallenge = useUserStore(state => state.activeChallenge);
  const { todayMissions } = useMissionStore();

  // If there is no active challenge fetched, render a placeholder or nothing
  if (!activeChallenge.challengeName) {
    return (
      <View style={styles.emptyContainer}>
         <Text style={styles.emptyText}>NO ACTIVE PROTOCOLS</Text>
      </View>
    );
  }

  const { challengeName, currentDay, totalDays, participantsRemain, riskLevel: baseRiskLevel } = activeChallenge;
  const progressPercent = Math.min((currentDay / totalDays) * 100, 100);

  // Check pending missions
  const missionsPending = todayMissions.length > 0;

  // Time Logic
  const hoursLeft = timeLeft ? parseInt(timeLeft.split(':')[0], 10) : 24;
  const forceCritical = missionsPending && hoursLeft < 2;

  const riskLevel = forceCritical ? 'CRITICAL' : baseRiskLevel;

  // Dynamic risk styling
  const isHighRisk = riskLevel === 'HIGH' || riskLevel === 'CRITICAL';
  const riskColor = riskLevel === 'CRITICAL' ? Colors.danger : 
                    riskLevel === 'HIGH' ? Colors.work : 
                    Colors.success;

  return (
    <View
      style={[
        styles.container, 
        isHighRisk && { 
          borderColor: Colors.danger, 
          borderBottomColor: '#600', // Deep red shadow 
          backgroundColor: '#2A1A1A' // Danger surface
        }
      ]}
    >
      <View style={styles.headerRow}>
        <View style={styles.titleWrapper}>
          <Text style={[styles.headerText, isHighRisk && { color: Colors.danger }]}>
            GAUNTLET PROTOCOL
          </Text>
        </View>
        <View style={[styles.timerBadge, isHighRisk && styles.timerBadgeRisk]}>
          <Text style={[styles.timerText, isHighRisk && { color: Colors.danger }]}>{timeLeft}</Text>
        </View>
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

      <View style={styles.riskRow}>
         <Text style={styles.riskLabel}>RISK LEVEL</Text>
         <Text style={[styles.riskIndicator, { color: riskColor }]}>{riskLevel}</Text>
      </View>

      <View style={styles.progressBarBg}>
        <View style={[styles.progressBarFill, { width: `${progressPercent}%`, backgroundColor: isHighRisk ? Colors.danger : Colors.accent }]} />
      </View>
      
      {isHighRisk && (
        <Text style={styles.warningText}>
          FAILURE INITIATES SCORE RESET.
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  emptyContainer: {
    padding: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.bg.card,
    borderRadius: Radius.lg,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  emptyText: {
    ...Typography.caption,
    color: Colors.text.tertiary,
  },
  container: {
    ...create3DCardStyle(),
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  titleWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  headerText: {
    ...Typography.caption,
    color: Colors.accent,
    fontWeight: '700',
  },
  timerBadge: {
    backgroundColor: Colors.bg.card,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderBottomWidth: 2,
    borderBottomColor: Colors.borderDark,
  },
  timerBadgeRisk: {
    borderColor: '#FF5A5A',
    borderBottomColor: '#600',
    backgroundColor: '#300000',
  },
  timerText: {
    ...Typography.h3, 
    color: Colors.text.primary,
    letterSpacing: 2,
  },
  challengeName: {
    ...Typography.h1,
    color: Colors.text.primary,
    marginBottom: Spacing.lg,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  statValue: {
    ...Typography.h2,
    color: Colors.text.primary,
  },
  statValueSub: {
    ...Typography.h3,
    color: Colors.text.secondary,
  },
  statLabel: {
    ...Typography.caption,
    color: Colors.text.secondary,
  },
  riskRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  riskLabel: {
    ...Typography.label,
    color: Colors.text.secondary,
  },
  riskIndicator: {
    ...Typography.label,
    fontWeight: '800',
  },
  progressBarBg: {
    height: 14,
    backgroundColor: Colors.bg.primary,
    width: '100%',
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.borderDark,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: Radius.full,
  },
  warningText: {
    ...Typography.caption,
    color: Colors.danger,
    marginTop: Spacing.md,
    textAlign: 'center',
  }
});
