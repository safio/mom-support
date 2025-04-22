import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import Colors from '../constants/colors';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [tokenChecking, setTokenChecking] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  const { token } = useLocalSearchParams();
  const { confirmResetPassword } = useAuth();
  
  useEffect(() => {
    // Simulate token validation
    setTimeout(() => {
      if (!token) {
        // If no token is provided, redirect to forgot password page
        router.replace('/(auth)/forgot-password');
      } else {
        setTokenChecking(false);
      }
    }, 1000);
  }, [token]);
  
  const validatePassword = (password) => {
    // Password must be at least 8 characters and contain both letters and numbers
    return password.length >= 8 && /[A-Za-z]/.test(password) && /[0-9]/.test(password);
  };
  
  const handleResetPassword = async () => {
    // Reset previous error
    setError('');
    
    // Validate password
    if (!password) {
      setError('Please enter a new password');
      return;
    }
    
    if (!validatePassword(password)) {
      setError('Password must be at least 8 characters and contain both letters and numbers');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    setLoading(true);
    
    try {
      const { error } = await confirmResetPassword(token, password);
      
      if (error) {
        setError(error.message || 'Failed to reset password. Please try again.');
        setLoading(false);
        return;
      }
      
      setSuccess(true);
      setLoading(false);
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.replace('/(auth)/login');
      }, 3000);
      
    } catch (err) {
      console.error('Password reset error:', err);
      setError('An unexpected error occurred. Please try again.');
      setLoading(false);
    }
  };
  
  // Show loading indicator while checking token
  if (tokenChecking) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Verifying your reset link...</Text>
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create New Password</Text>
      
      {success ? (
        <View style={styles.successContainer}>
          <Text style={styles.successText}>
            Password reset successful!
          </Text>
          <Text style={styles.instructionText}>
            Your password has been changed. You will be redirected to the login screen in a moment.
          </Text>
          <ActivityIndicator color={Colors.primary} style={styles.loadingIndicator} />
        </View>
      ) : (
        <>
          <Text style={styles.subtitle}>
            Enter your new password below. Choose a strong password that you don't use elsewhere.
          </Text>
          
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          
          <View style={styles.inputContainer}>
            <Text style={styles.label}>New Password</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter new password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              editable={!loading}
            />
          </View>
          
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Confirm Password</Text>
            <TextInput
              style={styles.input}
              placeholder="Confirm new password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              editable={!loading}
            />
          </View>
          
          <Text style={styles.passwordHint}>
            Password must be at least 8 characters and include both letters and numbers.
          </Text>
          
          <TouchableOpacity
            style={styles.button}
            onPress={handleResetPassword}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.buttonText}>Reset Password</Text>
            )}
          </TouchableOpacity>
        </>
      )}
      
      <View style={styles.footer}>
        <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
          <Text style={styles.footerLink}>Return to Login</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
    justifyContent: 'center',
  },
  centered: {
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 15,
    color: Colors.primary,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textLight,
    marginBottom: 30,
    lineHeight: 22,
  },
  inputContainer: {
    marginBottom: 25,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    color: Colors.text,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  passwordHint: {
    fontSize: 14,
    color: Colors.textMuted,
    marginBottom: 20,
    fontStyle: 'italic',
  },
  button: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginTop: 5,
  },
  buttonText: {
    color: Colors.textWhite,
    fontSize: 16,
    fontWeight: 'bold',
  },
  errorText: {
    color: Colors.error,
    marginBottom: 15,
  },
  successContainer: {
    backgroundColor: '#E8F5E9',
    borderRadius: 8,
    padding: 20,
    marginVertical: 20,
    alignItems: 'center',
  },
  successText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 10,
  },
  instructionText: {
    fontSize: 15,
    color: Colors.text,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 20,
  },
  footer: {
    alignItems: 'center',
    marginTop: 30,
  },
  footerLink: {
    fontSize: 16,
    color: Colors.primary,
    fontWeight: 'bold',
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: Colors.textLight,
  },
  loadingIndicator: {
    marginTop: 10,
  },
}); 