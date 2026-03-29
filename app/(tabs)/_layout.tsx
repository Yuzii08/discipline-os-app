import React from 'react';
import { Tabs } from 'expo-router';
import { LayoutGrid, Users, Settings, Activity } from 'lucide-react-native';
import { StyleSheet, Platform, View } from 'react-native';

const ACTIVE   = '#E07A5F';
const INACTIVE = 'rgba(61,64,91,0.35)';

export default function TabLayout() {
  return (
    <View style={{ flex: 1, backgroundColor: '#F9F7F2' }}>
      <Tabs
        screenOptions={{
          sceneStyle: { backgroundColor: 'transparent' },
          headerShown: false,
          tabBarStyle: styles.tabBar,
          tabBarActiveTintColor: ACTIVE,
          tabBarInactiveTintColor: INACTIVE,
          tabBarLabelStyle: styles.label,
          tabBarBackground: () => <View style={styles.tabBg} />,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Dashboard',
            tabBarIcon: ({ color }) => <LayoutGrid size={24} color={color} strokeWidth={2.5} />,
          }}
        />
        <Tabs.Screen
          name="oracle"
          options={{
            title: 'Oracle',
            tabBarIcon: ({ color }) => <Activity size={24} color={color} strokeWidth={2.5} />,
          }}
        />
        <Tabs.Screen
          name="arena"
          options={{
            title: 'Arena',
            tabBarIcon: ({ color }) => <Users size={24} color={color} strokeWidth={2.5} />,
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: 'Settings',
            tabBarIcon: ({ color }) => <Settings size={24} color={color} strokeWidth={2.5} />,
          }}
        />

        {/* Hidden tabs — kept for routing but not shown in bar */}
        <Tabs.Screen name="leaderboard"   options={{ href: null }} />
        <Tabs.Screen name="profile"        options={{ href: null }} />
        <Tabs.Screen name="edit-profile"   options={{ href: null }} />
        <Tabs.Screen name="community"      options={{ href: null }} />
      </Tabs>
    </View>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 28 : 16,
    left: 24,
    right: 24,
    height: 72,
    backgroundColor: 'transparent',
    borderTopWidth: 0,
    elevation: 0,
  },
  tabBg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#FDFCF9',
    borderRadius: 28,
    shadowColor: '#B8ACA0',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.7)',
  },
  label: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginTop: 2,
  },
});
