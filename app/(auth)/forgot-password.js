import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import Colors from '../constants/colors';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  const { sendPasswordResetEmail } = useAuth();
  
  const validateEmail = (email) => {
    return /^\S+@\S+\.\S+$/.test(email);
  };
  
  const handleResetRequest = async () => {
    // Reset states
    setError('');
    setSuccess(false);
    
    // Validate input
    if (!email) {
      setError('Please enter your email');
      return;
    }
    
    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }
    
    setLoading(true);
    
    try {
      const { error } = await sendPasswordResetEmail(email);
      
      if (error) {
        setError(error.message || 'Failed to send reset link. Please try again.');
        setLoading(false);
        return;
      }
      
      // If successful
      setSuccess(true);
      setLoading(false);
      
    } catch (err) {
      console.error('Password reset error:', err);
      setError('An unexpected error occurred. Please try again.');
      setLoading(false);
    }
  };
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Forgot Password</Text>
      
      {!success ? (
        <>
          <Text style={styles.subtitle}>
            Enter your email address and we'll send you a link to reset your password
          </Text>
          
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your email"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              editable={!loading}
            />
          </View>
          
          <TouchableOpacity
            style={styles.button}
            onPress={handleResetRequest}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.buttonText}>Send Reset Link</Text>
            )}
          </TouchableOpacity>
        </>
      ) : (
        <View style={styles.successContainer}>
          <Text style={styles.successText}>
            Password reset link sent!
          </Text>
          <Text style={styles.successDetail}>
            We've sent an email to <Text style={styles.emailHighlight}>{email}</Text> with instructions to reset your password.
          </Text>
          <Text style={styles.checkSpam}>
            If you don't see it in your inbox, please check your spam folder.
          </Text>
        </View>
      )}
      
      <View style={styles.footer}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.footerLink}>Back to Login</Text>
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
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
    color: Colors.primary,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textLight,
    marginBottom: 25,
  },
  inputContainer: {
    marginBottom: 20,
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
  button: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginTop: 10,
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
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 30,
  },
  footerLink: {
    fontSize: 16,
    color: Colors.primary,
    fontWeight: 'bold',
  },
  successContainer: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#F5F9FF',
    borderRadius: 12,
    marginVertical: 20,
  },
  successText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: 15,
  },
  successDetail: {
    fontSize: 16,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 10,
    lineHeight: 22,
  },
  emailHighlight: {
    fontWeight: 'bold',
  },
  checkSpam: {
    fontSize: 14,
    color: Colors.textMuted,
    textAlign: 'center',
    fontStyle: 'italic',
  },
}); 