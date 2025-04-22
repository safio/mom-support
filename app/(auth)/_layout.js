import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function AuthLayout() {
  return (
    <>
      <StatusBar style="dark" />
      <Stack 
        initialRouteName="anonymous-login"
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#fff' },
          // Prevent going back to previous screens
          gestureEnabled: false,
        }}
      >
        <Stack.Screen name="anonymous-login" options={{ gestureEnabled: false }} />
        <Stack.Screen name="login" options={{ gestureEnabled: false }} />
        <Stack.Screen name="signup" options={{ gestureEnabled: false }} />
        <Stack.Screen name="forgot-password" options={{ gestureEnabled: false }} />
        <Stack.Screen name="reset-password" options={{ gestureEnabled: false }} />
        <Stack.Screen name="verify-email" options={{ gestureEnabled: false }} />
      </Stack>
    </>
  );
} 