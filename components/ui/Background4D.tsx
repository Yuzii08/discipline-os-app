import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { useAppTheme } from '../../hooks/use-app-theme';
import { useColorScheme } from '../../hooks/use-color-scheme';

const { width, height } = Dimensions.get('window');

// A premium "4D" living background using blurred animated orbs
export function Background4D() {
  const theme = useAppTheme();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const orb1X = useSharedValue(-100);
  const orb1Y = useSharedValue(-100);
  const orb2X = useSharedValue(width);
  const orb2Y = useSharedValue(height / 2);
  const orb3X = useSharedValue(width / 2);
  const orb3Y = useSharedValue(height + 100);

  useEffect(() => {
    // Slow, breathing organic movements
    orb1X.value = withRepeat(
      withSequence(
        withTiming(width * 0.8, { duration: 15000, easing: Easing.inOut(Easing.ease) }),
        withTiming(-100, { duration: 18000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
    orb1Y.value = withRepeat(
      withSequence(
        withTiming(height * 0.5, { duration: 20000, easing: Easing.inOut(Easing.ease) }),
        withTiming(-100, { duration: 22000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    orb2X.value = withRepeat(
      withSequence(
        withTiming(-50, { duration: 18000, easing: Easing.inOut(Easing.ease) }),
        withTiming(width + 50, { duration: 15000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
    orb2Y.value = withRepeat(
      withSequence(
        withTiming(height * 0.9, { duration: 25000, easing: Easing.inOut(Easing.ease) }),
        withTiming(height * 0.2, { duration: 20000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    orb3X.value = withRepeat(
      withSequence(
        withTiming(width * 0.1, { duration: 22000, easing: Easing.inOut(Easing.ease) }),
        withTiming(width * 0.9, { duration: 19000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
    orb3Y.value = withRepeat(
      withSequence(
        withTiming(-100, { duration: 24000, easing: Easing.inOut(Easing.ease) }),
        withTiming(height + 100, { duration: 26000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, []); // eslint-disable-line react-hooks/exhaustive-deps -- orb* are stable Reanimated shared values

  const orb1Style = useAnimatedStyle(() => ({
    transform: [{ translateX: orb1X.value }, { translateY: orb1Y.value }],
  }));
  const orb2Style = useAnimatedStyle(() => ({
    transform: [{ translateX: orb2X.value }, { translateY: orb2Y.value }],
  }));
  const orb3Style = useAnimatedStyle(() => ({
    transform: [{ translateX: orb3X.value }, { translateY: orb3Y.value }],
  }));

  const bgStyle = { backgroundColor: isDark ? '#020617' : theme.bg.primary };
  const overlayStyle = { backgroundColor: isDark ? 'rgba(2, 6, 23, 0.4)' : 'rgba(249, 247, 242, 0.3)' };

  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
      <View style={[StyleSheet.absoluteFillObject, bgStyle]} />
      {/* Heavy Blur Container applied at parent level if needed, but per-orb blurRadius is safer natively */}
      <Animated.View style={[styles.orb, isDark ? styles.orb1Dark : styles.orb1Light, orb1Style]} />
      <Animated.View style={[styles.orb, isDark ? styles.orb2Dark : styles.orb2Light, orb2Style]} />
      <Animated.View style={[styles.orb, isDark ? styles.orb3Dark : styles.orb3Light, orb3Style]} />
      {/* Noise or absolute dark overlay to blend them smoothly */}
      <View style={[StyleSheet.absoluteFillObject, overlayStyle]} />
    </View>
  );
}

const styles = StyleSheet.create({
  orb: {
    position: 'absolute',
    borderRadius: 9999,
  },
  orb1Dark: {
    width: 300,
    height: 300,
    backgroundColor: 'rgba(56, 189, 248, 0.15)', // Light blue
    shadowColor: '#38bdf8',
    elevation: 20,
  },
  orb2Dark: {
    width: 400,
    height: 400,
    backgroundColor: 'rgba(129, 140, 248, 0.12)', // Indigo
    shadowColor: '#818cf8',
    elevation: 20,
  },
  orb3Dark: {
    width: 350,
    height: 350,
    backgroundColor: 'rgba(99, 102, 241, 0.1)', // Violet-blue
    shadowColor: '#6366f1',
    elevation: 20,
  },
  orb1Light: {
    width: 300,
    height: 300,
    backgroundColor: 'rgba(224, 122, 95, 0.15)', // Soft terracotta
    shadowColor: '#E07A5F',
    elevation: 20,
  },
  orb2Light: {
    width: 400,
    height: 400,
    backgroundColor: 'rgba(129, 178, 154, 0.12)', // Soft sage
    shadowColor: '#81B29A',
    elevation: 20,
  },
  orb3Light: {
    width: 350,
    height: 350,
    backgroundColor: 'rgba(242, 204, 143, 0.15)', // Soft mustard
    shadowColor: '#F2CC8F',
    elevation: 20,
  },
});
