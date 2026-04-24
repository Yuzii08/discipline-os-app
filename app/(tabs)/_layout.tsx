import React, { useRef } from 'react';
import { Tabs } from 'expo-router';
import { LayoutGrid, Users, Activity, Trophy } from 'lucide-react-native';
import { StyleSheet, Platform, View } from 'react-native';
import { DrawerLayout } from 'react-native-gesture-handler';
import SettingsScreen from './settings';

import { useThemeStyles } from '../../hooks/use-theme-styles';
export const GlobalDrawerContext = React.createContext({
  openDrawer: () => {},
  closeDrawer: () => {}
});

export default function TabLayout() {
  const { tokens, styles, clay } = useThemeStyles(createStyles);
  const { BG, TERR, isDark } = tokens;
  const drawerRef = useRef<DrawerLayout>(null);

  const renderDrawer = () => <SettingsScreen />;

  return (
    <GlobalDrawerContext.Provider value={{
      openDrawer: () => drawerRef.current?.openDrawer(),
      closeDrawer: () => drawerRef.current?.closeDrawer()
    }}>
      <DrawerLayout
        ref={drawerRef}
        drawerWidth={320}
        drawerPosition="left"
        renderNavigationView={renderDrawer}
      >
        <View style={{ flex: 1, backgroundColor: BG }}>
          <Tabs
            screenOptions={{
              sceneStyle: { backgroundColor: 'transparent' },
              headerShown: false,
              tabBarStyle: styles.tabBar,
              tabBarActiveTintColor: TERR,
              tabBarInactiveTintColor: isDark ? 'rgba(255,255,255,0.35)' : 'rgba(61,64,91,0.35)',
              tabBarLabelStyle: styles.label,
              tabBarBackground: () => <View style={[StyleSheet.absoluteFillObject, clay.clayCard, { borderRadius: 28 }]} />,
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
                tabBarIcon: ({ color }) => <Trophy size={24} color={color} strokeWidth={2.5} />,
              }}
            />
            <Tabs.Screen
              name="community"
              options={{
                title: 'Community',
                tabBarIcon: ({ color }) => <Users size={24} color={color} strokeWidth={2.5} />,
              }}
            />

            {/* Hidden tabs — kept for routing but not shown in bar */}
            <Tabs.Screen name="settings"      options={{ href: null }} />
            <Tabs.Screen name="profile"       options={{ href: null }} />
            <Tabs.Screen name="edit-profile"  options={{ href: null }} />
          </Tabs>
        </View>
      </DrawerLayout>
    </GlobalDrawerContext.Provider>
  );
}

const createStyles = (tokens: any, isDark: boolean) => {
  return StyleSheet.create({
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
  label: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginTop: 2,
  },
});
};
