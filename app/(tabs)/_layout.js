import { Tabs } from 'expo-router';
import { FontAwesome, FontAwesome5, MaterialIcons } from '@expo/vector-icons';
import { useEffect } from 'react';
import { router } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';

export default function TabLayout() {
  const { user } = useAuth();

  // Redirect anonymous users to getting-started on first visit
  useEffect(() => {
    if (user?.isAnonymous) {
      // Check if this is their first visit
      const isFirstVisit = !user.hasViewedGetStarted;
      if (isFirstVisit) {
        router.replace('/(tabs)/getting-started');
      }
    }
  }, [user]);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#4B6D9B',
        tabBarInactiveTintColor: '#999',
        tabBarStyle: {
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        headerStyle: {
          backgroundColor: '#F8F9FA',
        },
        headerTitleStyle: {
          fontWeight: 'bold',
          color: '#4B6D9B',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <FontAwesome name="home" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="tracker"
        options={{
          title: 'Tracker',
          tabBarIcon: ({ color }) => <FontAwesome5 name="clipboard-list" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="guidance"
        options={{
          title: 'Guidance',
          tabBarIcon: ({ color }) => <FontAwesome name="book" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="self-care"
        options={{
          title: 'Self-Care',
          tabBarIcon: ({ color }) => <FontAwesome5 name="heartbeat" size={24} color={color} />,
        }}
      />
      {/* Progress tab temporarily disabled */}
      <Tabs.Screen
        name="progress"
        options={{
          title: 'Progress',
          tabBarIcon: ({ color }) => <FontAwesome name="bar-chart" size={24} color={color} />,
          tabBarButton: () => null, // Hide this tab from the tab bar
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color }) => <MaterialIcons size={28} name="settings" color={color} />,
        }}
      />
      <Tabs.Screen
        name="getting-started"
        options={{
          title: 'Getting Started',
          headerShown: true,
          tabBarButton: () => null, // Hide this tab from the tab bar
        }}
      />
    </Tabs>
  );
} 