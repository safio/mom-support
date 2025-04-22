import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import Colors from '../constants/colors';

export default function VerifyEmail() {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [timer, setTimer] = useState(0);
  
  const { verifyEmail, resendVerificationEmail, user } = useAuth();
  const params = useLocalSearchParams();
  const email = params.email || user?.email || '';
  
  useEffect(() => {
    // Countdown timer for resend button
    if (timer > 0) {
      const interval = setInterval(() => {
        setTimer(prevTimer => prevTimer - 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [timer]);
  
  const handleVerify = async () => {
    if (!code.trim()) {
      setError('Please enter the verification code');
      return;
    }
    
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      const { error } = await verifyEmail(email, code);
      
      if (error) {
        setError(error.message || 'Invalid verification code. Please try again.');
        setLoading(false);
        return;
      }
      
      setSuccess('Email verified successfully!');
      
      // Redirect to login page after successful verification
      setTimeout(() => {
        router.replace('/(auth)/login');
      }, 2000);
    } catch (err) {
      console.error('Verification error:', err);
      setError('An unexpected error occurred. Please try again.');
      setLoading(false);
    }
  };
  
  const handleResend = async () => {
    setResendLoading(true);
    setError('');
    setSuccess('');
    
    try {
      const { error } = await resendVerificationEmail(email);
      
      if (error) {
        setError(error.message || 'Failed to resend verification code. Please try again.');
        setResendLoading(false);
        return;
      }
      
      setSuccess('A new verification code has been sent to your email.');
      setTimer(60); // Set 60 seconds cooldown
      setResendLoading(false);
    } catch (err) {
      console.error('Resend verification error:', err);
      setError('An unexpected error occurred. Please try again.');
      setResendLoading(false);
    }
  };
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Verify Your Email</Text>
      
      <Text style={styles.description}>
        We've sent a verification code to:
      </Text>
      <Text style={styles.emailText}>{email}</Text>
      <Text style={styles.instructionText}>
        Enter the code below to verify your email address.
      </Text>
      
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      {success ? <Text style={styles.successText}>{success}</Text> : null}
      
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Verification Code</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter verification code"
          value={code}
          onChangeText={setCode}
          keyboardType="number-pad"
          autoCapitalize="none"
          maxLength={6}
        />
      </View>
      
      <TouchableOpacity
        style={styles.button}
        onPress={handleVerify}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <Text style={styles.buttonText}>Verify Email</Text>
        )}
      </TouchableOpacity>
      
      <View style={styles.resendContainer}>
        <Text style={styles.resendText}>Didn't receive the code?</Text>
        {timer > 0 ? (
          <Text style={styles.timerText}>Resend in {timer}s</Text>
        ) : (
          <TouchableOpacity 
            onPress={handleResend}
            disabled={resendLoading}
            style={styles.resendButton}
          >
            {resendLoading ? (
              <ActivityIndicator size="small" color={Colors.primary} />
            ) : (
              <Text style={styles.resendButtonText}>Resend Code</Text>
            )}
          </TouchableOpacity>
        )}
      </View>
      
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => router.back()}
      >
        <Text style={styles.backButtonText}>Back</Text>
      </TouchableOpacity>
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
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
    color: Colors.primary,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: Colors.textLight,
    textAlign: 'center',
    marginBottom: 5,
  },
  emailText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 20,
  },
  instructionText: {
    fontSize: 16,
    color: Colors.textLight,
    textAlign: 'center',
    marginBottom: 25,
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
    fontSize: 20,
    backgroundColor: '#f9f9f9',
    textAlign: 'center',
    letterSpacing: 5,
  },
  button: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonText: {
    color: Colors.textWhite,
    fontSize: 16,
    fontWeight: 'bold',
  },
  errorText: {
    color: Colors.error,
    marginBottom: 15,
    textAlign: 'center',
  },
  successText: {
    color: Colors.success,
    marginBottom: 15,
    textAlign: 'center',
  },
  resendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  resendText: {
    fontSize: 16,
    color: Colors.textLight,
    marginRight: 5,
  },
  resendButton: {
    padding: 5,
  },
  resendButtonText: {
    color: Colors.primary,
    fontSize: 16,
    fontWeight: 'bold',
  },
  timerText: {
    color: Colors.textMuted,
    fontSize: 16,
  },
  backButton: {
    padding: 10,
    alignItems: 'center',
  },
  backButtonText: {
    color: Colors.primary,
    fontSize: 16,
  },
}); 