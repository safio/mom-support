import { useEffect } from 'react';
import { Redirect } from 'expo-router';
import { useAuth } from './contexts/AuthContext';

export default function Index() {
  const { user, isAuthenticated, loading } = useAuth();
  
  // Wait for auth status to load
  if (loading) {
    return null;
  }
  
  // If the user is authenticated, redirect to tabs
  if (isAuthenticated) {
    return <Redirect href="/(tabs)" />;
  }
  
  // Otherwise, redirect to the anonymous login
  return <Redirect href="/(auth)/anonymous-login" />;
} 