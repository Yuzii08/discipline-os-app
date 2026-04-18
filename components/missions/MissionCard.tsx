import React from 'react';
import { Text, Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Colors, Spacing, Typography, Radius, CategoryConfig, create3DCardStyle, Elevation } from '../../constants/theme';
import { IconSymbol } from '../ui/icon-symbol';

interface Props {
  title: string;
  category: 'BODY' | 'MIND' | 'WORK';
  objectiveDesc: string;
  points: number;
  onAction: () => void;
}

export const MissionCard = ({ title, category, objectiveDesc, points, onAction }: Props) => {
  const cfg = CategoryConfig[category] ?? CategoryConfig.WORK;

  const scale = useSharedValue(1);
  const progress = useSharedValue(0);
  const completed = useSharedValue(false);

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: completed.value ? 0.3 : 1, // Dimmed out when done
  }));

  const fillStyle = useAnimatedStyle(() => ({
    width: `${progress.value}%`,
  }));

   const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onAction();
  };

  return (
    <Pressable onPress={handlePress}>
      <Animated.View style={[styles.card, cardStyle]}>
        
        {/* Subtle, sharp left indicator line, NOT a huge block */}
        <View style={[styles.leftBorder, { backgroundColor: cfg.color }]} />

        {/* Aggressive press-fill overlay */}
        <Animated.View
          style={[styles.fillOverlay, fillStyle, { backgroundColor: cfg.dim }]}
        />

        <View style={styles.inner}>
          
          <View style={styles.contentRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>{title}</Text>
              <View style={styles.metaRow}>
                <Text style={[styles.categoryText, { color: cfg.color }]}>{cfg.label}</Text>
                <View style={styles.dot} />
                <Text style={styles.durationText}>{objectiveDesc}</Text>
              </View>
            </View>

            <View style={styles.ptsBox}>
              <Text style={styles.pointsText}>+{points}</Text>
              <Text style={styles.ptsLabel}>PTS</Text>
            </View>
          </View>

          {/* Huge, unmissable Snap Button - 3D Pill style */}
          <View style={[styles.hugeSnapBtn, { 
            backgroundColor: cfg.color,
            borderBottomColor: '#900000' // General heavy shadow, can dynamically map to cfg if needed
          }]}>
            <IconSymbol name="camera.viewfinder" size={20} color="#000" />
            <Text style={styles.hugeSnapText}>TAP TO SNAP PROOF</Text>
          </View>

        </View>
      </Animated.View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    ...create3DCardStyle(),
    marginBottom: Spacing.md,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  leftBorder: {
    width: 6, // Thicker left border for 3D accenting
    height: '100%',
  },
  inner: {
    flex: 1,
    padding: Spacing.lg,
    zIndex: 2,
  },
  fillOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    ...Typography.h2,
    color: Colors.text.primary,
    marginBottom: 6,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryText: {
    ...Typography.label,
  },
  dot: {
    width: 3, height: 3, borderRadius: 1.5,
    backgroundColor: Colors.borderLight,
    marginHorizontal: 8,
  },
  durationText: {
    ...Typography.body,
    fontSize: 14,
    color: Colors.text.secondary,
  },
  ptsBox: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  pointsText: {
    ...Typography.h2,
    color: Colors.text.primary,
  },
  ptsLabel: {
    ...Typography.label,
    color: Colors.text.tertiary,
    marginTop: 2,
  },
  hugeSnapBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: Radius.full,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.4)',
    borderBottomWidth: 4,
    gap: Spacing.sm,
    ...Elevation.soft,
  },
  hugeSnapText: {
    ...Typography.bodyBold,
    color: '#000',
    letterSpacing: 1,
  },
});
