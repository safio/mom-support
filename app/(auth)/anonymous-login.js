import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { Link, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '../contexts/AuthContext';

export default function AnonymousLogin() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { anonymousLogin } = useAuth();

  const handleAnonymousLogin = async () => {
    try {
      setLoading(true);
      setError('');
      
      const { error } = await anonymousLogin();
      
      if (error) {
        setError(error.message);
        return;
      }
      
      router.replace('/(tabs)/getting-started');
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      console.error('Anonymous login error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      
      <View style={styles.headerContainer}>
        <Image 
          source={require('../../assets/icon.png')} 
          style={styles.logo} 
          resizeMode="contain"
        />
        <Text style={styles.title}>Mom Support</Text>
        <Text style={styles.subtitle}>Anonymous Support for Mothers</Text>
      </View>
      
      <View style={styles.infoContainer}>
        <Text style={styles.infoText}>
          Welcome to Mom Support, a safe space for mothers to track parenting challenges, 
          receive guidance, and practice positive parenting techniques.
        </Text>
        
        <Text style={styles.privacyText}>
          Your privacy is our priority. No personal information is required.
        </Text>
      </View>
      
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      
      <TouchableOpacity 
        style={styles.anonymousButton} 
        onPress={handleAnonymousLogin}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Start Anonymously</Text>
        )}
      </TouchableOpacity>
      
      <View style={styles.footer}>
        <Text style={styles.footerText}>Already have an account? </Text>
        <Link href="/(auth)/login" asChild>
          <TouchableOpacity>
            <Text style={styles.link}>Sign In</Text>
          </TouchableOpacity>
        </Link>
      </View>
      
      <Link href="/(auth)/signup" asChild>
        <TouchableOpacity style={styles.createAccountButton}>
          <Text style={styles.createAccountText}>Create Account</Text>
        </TouchableOpacity>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
    justifyContent: 'center',
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#4B6D9B',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
  },
  infoContainer: {
    marginBottom: 32,
    backgroundColor: '#F5F7FA',
    padding: 16,
    borderRadius: 8,
  },
  infoText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 16,
    lineHeight: 24,
  },
  privacyText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#4B6D9B',
  },
  errorText: {
    color: '#E53935',
    marginBottom: 16,
    textAlign: 'center',
  },
  anonymousButton: {
    backgroundColor: '#4B6D9B',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
    marginBottom: 16,
  },
  footerText: {
    color: '#666',
    fontSize: 16,
  },
  link: {
    color: '#4B6D9B',
    fontSize: 16,
    fontWeight: '600',
  },
  createAccountButton: {
    borderWidth: 1,
    borderColor: '#4B6D9B',
    backgroundColor: 'transparent',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  createAccountText: {
    color: '#4B6D9B',
    fontSize: 18,
    fontWeight: '600',
  },
}); 