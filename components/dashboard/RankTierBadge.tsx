import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { Colors, Spacing, Typography, Radius, create3DCardStyle } from '../../constants/theme';

interface Props {
  tier: string;
  pointsToNext: number;
  progressPercent: number; 
}

export function RankTierBadge({ tier, pointsToNext, progressPercent }: Props) {
  const animatedWidth = useSharedValue(progressPercent);

  useEffect(() => {
    animatedWidth.value = withTiming(progressPercent, { duration: 800 });
  }, [progressPercent]);

  const progressStyle = useAnimatedStyle(() => {
    return {
      width: `${animatedWidth.value}%`,
    };
  });

  return (
    <View style={styles.container}>
      <View style={styles.textRow}>
        <View>
          <Text style={styles.label}>CURRENT RANK</Text>
          <Text style={styles.tierName}>{tier}</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={styles.label}>NEXT TIER</Text>
          <Text style={styles.pointsText}>{pointsToNext.toLocaleString()} pts</Text>
        </View>
      </View>
      
      <View style={styles.progressBarBg}>
        <Animated.View style={[styles.progressBarFill, progressStyle]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...create3DCardStyle(),
    padding: Spacing.xl,
    marginBottom: Spacing.xl,
  },
  textRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  label: {
    ...Typography.caption,
    color: Colors.text.secondary,
    marginBottom: 2,
  },
  tierName: {
    ...Typography.h3,
    color: Colors.text.primary,
  },
  pointsText: {
    ...Typography.bodyBold,
    color: Colors.accent,
  },
  progressBarBg: {
    height: 12,
    backgroundColor: Colors.bg.primary,
    borderRadius: Radius.full,
    width: '100%',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.borderDark,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Colors.accent,
    borderRadius: Radius.full,
  },
});
