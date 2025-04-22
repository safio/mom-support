import { Stack, Slot } from 'expo-router';
import { AuthProvider } from './contexts/AuthContext';
import { DatabaseProvider } from './contexts/DatabaseContext'; 
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';

// Prevent auto-hide of splash screen
SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  useEffect(() => {
    // Hide splash screen after a brief delay
    const hideSplash = async () => {
      await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay
      await SplashScreen.hideAsync().catch(() => {});
    };
    
    hideSplash();
  }, []);

  return (
    <AuthProvider>
      <DatabaseProvider>
        <StatusBar style="dark" />
        <Stack 
          screenOptions={{ 
            headerShown: false,
            contentStyle: { backgroundColor: '#fff' },
            animation: 'slide_from_right',
          }}
        >
          <Stack.Screen name="index" options={{ gestureEnabled: false }} />
          <Stack.Screen name="onboarding" options={{ gestureEnabled: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false, gestureEnabled: false }} />
          <Stack.Screen name="(auth)" options={{ headerShown: false, gestureEnabled: false }} />
          <Stack.Screen name="(subscription)" options={{ headerShown: false }} />
        </Stack>
      </DatabaseProvider>
    </AuthProvider>
  );
} 