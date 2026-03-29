import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Spacing, Typography, Radius, create3DCardStyle } from '../../constants/theme';
import { IconSymbol } from '../ui/icon-symbol';

interface Props {
  multiplier: number;
  membersCompleted: number;
  totalMembers: number;
}

export function SquadPressurePanel({ multiplier, membersCompleted, totalMembers }: Props) {
  const isAtRisk = membersCompleted < totalMembers;
  
  // Render chain links
  const links = Array.from({ length: totalMembers }).map((_, i) => i < membersCompleted);

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <IconSymbol name="link" size={14} color={Colors.text.primary} />
        <Text style={styles.headerText}>SQUAD TACTICS</Text>
      </View>
      
      <View style={styles.contentRow}>
        <View style={styles.statGroup}>
          <Text style={styles.statValue}>{multiplier.toFixed(1)}x</Text>
          <Text style={styles.statLabel}>TACTICAL MULTIPLIER</Text>
        </View>

        <View style={styles.chainRow}>
          {links.map((isActive, i) => (
            <View 
              key={i} 
              style={[
                styles.chainLink, 
                isActive ? styles.chainLinkActive : styles.chainLinkBroken
              ]} 
            />
          ))}
        </View>
      </View>
      {isAtRisk && (
        <Text style={styles.riskWarning}>CHAIN BROKEN: MULTIPLIER OFFLINE.</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...create3DCardStyle(),
    padding: Spacing.lg,
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
    justifyContent: 'space-between',
  },
  statGroup: {
    alignItems: 'flex-start',
  },
  statValue: {
    ...Typography.h2,
    color: Colors.text.primary,
    letterSpacing: -0.5,
  },
  statLabel: {
    ...Typography.caption,
    color: Colors.text.secondary,
    letterSpacing: 1,
  },
  chainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  chainLink: {
    width: 14,
    height: 28,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  chainLinkActive: {
    borderColor: Colors.accentBorder,
    backgroundColor: Colors.accent, 
    borderBottomWidth: 3,
    borderBottomColor: '#265BC7', // Depth shadow
  },
  chainLinkBroken: {
    borderColor: Colors.borderLight,
    backgroundColor: Colors.bg.primary,
    borderBottomWidth: 2,
    borderBottomColor: Colors.borderDark,
  },
  riskWarning: {
    ...Typography.caption,
    color: Colors.danger,
    marginTop: Spacing.md,
    textAlign: 'center',
    fontWeight: '900',
  }
});
