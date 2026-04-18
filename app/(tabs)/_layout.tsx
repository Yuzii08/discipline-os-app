import React, { useRef } from 'react';
import { Tabs } from 'expo-router';
import { LayoutGrid, Users, Activity, Trophy } from 'lucide-react-native';
import { StyleSheet, Platform, View } from 'react-native';
import { DrawerLayout } from 'react-native-gesture-handler';
import SettingsScreen from './settings';

const ACTIVE   = '#E07A5F';
const INACTIVE = 'rgba(61,64,91,0.35)';

export const GlobalDrawerContext = React.createContext({
  openDrawer: () => {},
  closeDrawer: () => {}
});

export default function TabLayout() {
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
            <Tabs.Screen name="leaderboard"   options={{ href: null }} />
            <Tabs.Screen name="profile"       options={{ href: null }} />
            <Tabs.Screen name="edit-profile"  options={{ href: null }} />
          </Tabs>
        </View>
      </DrawerLayout>
    </GlobalDrawerContext.Provider>
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
