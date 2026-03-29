import '../global.css';
import React, { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { AuthService } from '../services/authService';
import { useNotifications } from '../hooks/useNotifications';
import { useUserStore } from '../store/useUserStore';

import { useAppTheme } from '../hooks/use-app-theme';
import { useColorScheme } from '../hooks/use-color-scheme';

function AuthGuard() {
  const { profile, isInitializing } = useUserStore();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    // Wait until auth has fully resolved before making routing decisions
    if (isInitializing) return;

    const inAuthGroup = segments[0] === '(auth)';
    if (!profile && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (profile && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [profile, segments, isInitializing]);

  return null;
}

export default function RootLayout() {
  const { isInitializing } = useUserStore();
  useNotifications();

  useEffect(() => {
    AuthService.initializeAuth();
  }, []);

  const theme = useAppTheme();
  const colorScheme = useColorScheme();
  
  // Show a clean loading screen while we determine auth state
  if (isInitializing) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.bg.primary, alignItems: 'center', justifyContent: 'center' }}>
        <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} backgroundColor={theme.bg.primary} />
        <ActivityIndicator size="large" color={theme.accent} />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthGuard />
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} backgroundColor={theme.bg.primary} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: theme.bg.primary },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="genesis" options={{ headerShown: false, animation: 'fade' }} />
        <Stack.Screen
          name="snap"
          options={{
            headerShown: false,
            animation: 'slide_from_bottom',
            presentation: 'fullScreenModal',
          }}
        />
        <Stack.Screen name="+not-found" options={{ title: 'Oops!' }} />
      </Stack>
    </GestureHandlerRootView>
  );
}
