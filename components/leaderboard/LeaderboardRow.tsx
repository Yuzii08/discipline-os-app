import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface Props {
  rank: number;
  username: string;
  score: number;
  tier: string;
  isCurrentUser: boolean;
  streak: number;
}

export const LeaderboardRow = ({ rank, username, score, tier, isCurrentUser, streak }: Props) => {
  return (
    <View style={[styles.container, isCurrentUser && styles.currentUserContainer]}>
      <View style={styles.rankBadge}>
        <Text style={[styles.rankText, isCurrentUser && styles.currentUserText]}>
          #{rank}
        </Text>
      </View>

      <View style={styles.userInfo}>
        <View style={styles.nameRow}>
          <Text style={[styles.username, isCurrentUser && styles.currentUserText]}>
            {username}
          </Text>
          {isCurrentUser && <Text style={styles.youIndicator}>(You)</Text>}
        </View>
        <Text style={styles.metaRow}>
          {tier} • 🔥 {streak}
        </Text>
      </View>

      <View style={styles.scoreContainer}>
        <Text style={[styles.score, isCurrentUser && styles.currentUserText]}>
          {score.toLocaleString()}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A1A',
  },
  currentUserContainer: {
    backgroundColor: 'rgba(0, 229, 255, 0.1)', // Subtle neon cyan tint
    borderLeftWidth: 4,
    borderLeftColor: '#00E5FF',
    paddingLeft: 12, // Offset for the border
  },
  rankBadge: {
    width: 40,
    alignItems: 'center',
    marginRight: 12,
  },
  rankText: {
    color: '#888',
    fontSize: 16,
    fontWeight: 'bold',
  },
  currentUserText: {
    color: '#00E5FF', // Cyan highlight for the active user
  },
  userInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  username: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  youIndicator: {
    color: '#00E5FF',
    fontSize: 12,
    marginLeft: 6,
    fontWeight: '600',
  },
  metaRow: {
    color: '#666',
    fontSize: 12,
    marginTop: 4,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  scoreContainer: {
    alignItems: 'flex-end',
  },
  score: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '900',
  },
});
