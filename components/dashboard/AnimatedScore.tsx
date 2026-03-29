import React, { useEffect, useState, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withSpring,
  withTiming,
  interpolateColor,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useAppTheme } from '../../hooks/use-app-theme';
import { useColorScheme } from '../../hooks/use-color-scheme';

interface Props {
  score: number;
  pulseTrigger?: number; // Whenever this increments, trigger the pulse effect
}

export function AnimatedScore({ score, pulseTrigger = 0 }: Props) {
  const theme = useAppTheme();
  const colorScheme = useColorScheme();
  const [displayScore, setDisplayScore] = useState(score);
  const scale = useSharedValue(1);
  const colorProgress = useSharedValue(0);
  const prevScore = useRef(score);
  const prevPulse = useRef(pulseTrigger);

  useEffect(() => {
    let start = displayScore;
    let end = score;
    if (start === end) return;

    // Simple tween for the score number over 1s
    const diff = end - start;
    const dur = 1000;
    const steps = 20;
    const stepTime = dur / steps;
    let currentStep = 0;

    const interval = setInterval(() => {
      currentStep++;
      setDisplayScore(Math.floor(start + (diff * (currentStep / steps))));
      if (currentStep >= steps) {
        clearInterval(interval);
        setDisplayScore(end);
      }
    }, stepTime);

    // Trigger explosive visual feedback if score increased OR external pulse triggered
    if (score > prevScore.current || pulseTrigger > prevPulse.current) {
      scale.value = withSequence(
        withSpring(1.15, { damping: 10, stiffness: 200 }),
        withSpring(1, { damping: 12, stiffness: 100 })
      );
      colorProgress.value = withSequence(
        withTiming(1, { duration: 150 }),
        withTiming(0, { duration: 500 })
      );
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }
    
    prevScore.current = score;
    prevPulse.current = pulseTrigger;

    return () => clearInterval(interval);
  }, [score, displayScore, scale, colorProgress, pulseTrigger]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
      color: interpolateColor(
        colorProgress.value,
        [0, 1],
        [theme.text.primary, theme.accent]
      ) as string,
      textShadowColor: interpolateColor(
        colorProgress.value,
        [0, 1],
        [colorScheme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.5)', theme.accent]
      ) as string,
      textShadowRadius: interpolateColor(
        colorProgress.value,
        [0, 1],
        [10, 20]
      ) as number,
      textShadowOffset: { width: 0, height: 4 },
    };
  });

  return (
    <View style={styles.container}>
      <Animated.Text style={[styles.heroScore, animatedStyle]} numberOfLines={1} adjustsFontSizeToFit>
        {displayScore.toLocaleString()}
      </Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    // Keep container fixed size to avoid layout jumps
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  heroScore: {
    fontSize: 96,
    fontWeight: '900',
    letterSpacing: -5,
    lineHeight: 100,
    marginLeft: -4,
  },
});
