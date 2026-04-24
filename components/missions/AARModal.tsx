import React from 'react';
import { Modal, View, Text, StyleSheet, Pressable, ScrollView, Animated } from 'react-native';
import { Zap, ShieldAlert, Award, Share2, X, Terminal, TrendingUp } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Reanimated, { useSharedValue, useAnimatedStyle, withSpring, withSequence, withDelay, withTiming } from 'react-native-reanimated';
import { useThemeStyles } from '../../hooks/use-theme-styles';

interface AARModalProps {
  isVisible: boolean;
  onClose: () => void;
  missionTitle: string;
  verdict: string;
  scoreMultiplier: number;
  pointsEarned: number;
  isSuccess: boolean;
  isRankUp?: boolean;
  onShare?: () => void;
}

export function AARModal({
  isVisible,
  onClose,
  missionTitle,
  verdict,
  scoreMultiplier,
  pointsEarned,
  isSuccess,
  isRankUp,
  onShare
}: AARModalProps) {
  const { tokens, clay } = useThemeStyles();
  const { BG, CHR, SAGE, TERR, isDark, EGSHELL, MUST } = tokens;

  const rankUpScale = useSharedValue(0);
  const rankUpOpacity = useSharedValue(0);

  React.useEffect(() => {
    if (isVisible) {
      if (isSuccess) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      if (isRankUp) {
        rankUpScale.value = withDelay(500, withSpring(1, { damping: 12 }));
        rankUpOpacity.value = withDelay(500, withTiming(1));
      }
    } else {
      rankUpScale.value = 0;
      rankUpOpacity.value = 0;
    }
  }, [isVisible, isSuccess, isRankUp]);

  const rankUpStyle = useAnimatedStyle(() => ({
    opacity: rankUpOpacity.value,
    transform: [{ scale: rankUpScale.value }]
  }));

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="fade"
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <View style={[styles.container, { backgroundColor: isDark ? 'rgba(0,0,0,0.92)' : 'rgba(255,255,255,0.95)' }]}>
          {/* Header */}
          <LinearGradient
            colors={isSuccess ? [SAGE, '#A8C69F'] : [TERR, '#B85C5C']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.header}
          >
            <View style={styles.headerContent}>
              <View style={styles.iconCircle}>
                {isSuccess ? (
                  <Award size={32} color={SAGE} strokeWidth={2.5} />
                ) : (
                  <ShieldAlert size={32} color={TERR} strokeWidth={2.5} />
                )}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.headerTag}>AFTER-ACTION REPORT</Text>
                <Text style={styles.headerTitle} numberOfLines={1}>{missionTitle}</Text>
              </View>
              <Pressable onPress={onClose} style={styles.closeBtn}>
                <X size={20} color="#fff" strokeWidth={2.5} />
              </Pressable>
            </View>

            {isRankUp && (
              <Reanimated.View style={[styles.rankUpBadge, rankUpStyle]}>
                <TrendingUp size={16} color="#000" strokeWidth={3} />
                <Text style={styles.rankUpText}>RANK UP</Text>
              </Reanimated.View>
            )}
          </LinearGradient>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Judge Persona */}
            <View style={styles.judgeSection}>
              <View style={styles.personaBadge}>
                <Terminal size={14} color={CHR} style={{ opacity: 0.6 }} />
                <Text style={[styles.personaText, { color: CHR }]}>THE COLD JUDGE // FORENSIC AUDITOR</Text>
              </View>
              <View style={[styles.verdictCard, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}>
                <Text style={[styles.verdictText, { color: CHR }]}>
                  "{verdict || 'No data captured in mission log.'}"
                </Text>
              </View>
            </View>

            {/* Metrics */}
            <View style={styles.metricsGrid}>
              <View style={[styles.metricItem, { borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }]}>
                <Text style={[styles.metricLabel, { color: CHR }]}>MULTIPLIER</Text>
                <Text style={[styles.metricValue, { color: isSuccess ? SAGE : TERR }]}>
                  {scoreMultiplier.toFixed(1)}x
                </Text>
              </View>
              <View style={[styles.metricItem, { borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }]}>
                <Text style={[styles.metricLabel, { color: CHR }]}>AWARDED</Text>
                <Text style={[styles.metricValue, { color: CHR }]}>
                  {Math.floor(pointsEarned)}DP
                </Text>
              </View>
            </View>

            <View style={{ height: 24 }} />
          </ScrollView>

          {/* Actions */}
          <View style={styles.footer}>
            <Pressable 
              style={[styles.actionBtn, styles.shareBtn, { backgroundColor: CHR }]}
              onPress={onShare}
            >
              <Share2 size={18} color={isDark ? '#000' : '#fff'} strokeWidth={2.5} />
              <Text style={[styles.actionBtnText, { color: isDark ? '#000' : '#fff' }]}>SHARE SNAP</Text>
            </Pressable>
            
            <Pressable 
              style={[styles.actionBtn, styles.dismissBtn, { borderColor: CHR, borderWidth: 1 }]}
              onPress={onClose}
            >
              <Text style={[styles.actionBtnText, { color: CHR }]}>DISMISS</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 32,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {
    paddingTop: 32,
    paddingBottom: 24,
    paddingHorizontal: 24,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTag: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '800',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: 24,
    maxHeight: 400,
  },
  judgeSection: {
    gap: 12,
  },
  personaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  personaText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    opacity: 0.7,
  },
  verdictCard: {
    padding: 20,
    borderRadius: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#333',
  },
  verdictText: {
    fontSize: 15,
    fontWeight: '500',
    fontStyle: 'italic',
    lineHeight: 22,
    opacity: 0.9,
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  metricItem: {
    flex: 1,
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
    opacity: 0.5,
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: '900',
  },
  footer: {
    padding: 24,
    gap: 12,
  },
  actionBtn: {
    height: 56,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  actionBtnText: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  shareBtn: {},
  dismissBtn: {},
  rankUpBadge: {
    position: 'absolute',
    bottom: -15,
    alignSelf: 'center',
    backgroundColor: '#F2CC8F',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 100,
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  rankUpText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#000',
    letterSpacing: 1,
  }
});
