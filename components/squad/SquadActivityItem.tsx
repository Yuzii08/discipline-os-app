import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface Props {
  username: string;
  action: string;
  points: number;
  timeAgo: string;
  isNegative?: boolean; // True for broken streaks or failures
}

export const SquadActivityItem = ({ username, action, points, timeAgo, isNegative = false }: Props) => {
  return (
    <View style={[styles.container, isNegative && styles.negativeContainer]}>
      <View style={styles.content}>
        <Text style={styles.textBlock}>
          <Text style={[styles.username, isNegative && styles.negativeText]}>{username}</Text>
          <Text style={styles.action}> {action}</Text>
          {points > 0 && <Text style={styles.points}> +{points} PTS</Text>}
        </Text>
        <Text style={styles.timeAgo}>{timeAgo}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#111',
    borderRadius: 8,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#333',
  },
  negativeContainer: {
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
    borderLeftColor: '#FF3B30',
  },
  content: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  textBlock: {
    flex: 1,
    marginRight: 10,
  },
  username: {
    color: '#00E5FF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  negativeText: {
    color: '#FF3B30',
  },
  action: {
    color: '#CCC',
    fontSize: 14,
  },
  points: {
    color: '#00E5FF',
    fontWeight: '800',
    fontSize: 14,
  },
  timeAgo: {
    color: '#666',
    fontSize: 12,
  },
});
