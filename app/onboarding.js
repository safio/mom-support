import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function Onboarding() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen 
        options={{
          headerShown: false,
        }} 
      />
      <StatusBar style="auto" />
      
      <View style={styles.content}>
        <Text style={styles.title}>Mom Support App</Text>
        <Text style={styles.subtitle}>Anonymous Support for Mothers</Text>
        
        <View style={styles.infoContainer}>
          <Text style={styles.infoText}>
            • Track daily parenting challenges
          </Text>
          <Text style={styles.infoText}>
            • Get personalized guidance
          </Text>
          <Text style={styles.infoText}>
            • Practice positive parenting techniques
          </Text>
          <Text style={styles.infoText}>
            • 100% anonymous - no personal data
          </Text>
        </View>
        
        <View style={styles.privacyInfo}>
          <Text style={styles.privacyTitle}>Your Privacy Matters</Text>
          <Text style={styles.privacyText}>
            We don't collect any personal identifiers. All your data stays on your device,
            with optional encrypted anonymous cloud backup.
          </Text>
        </View>
      </View>
      
      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.button}
          onPress={() => router.push('/(tabs)')}
        >
          <Text style={styles.buttonText}>Get Started</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#4B6D9B',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
    marginBottom: 40,
  },
  infoContainer: {
    width: '100%',
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  infoText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 12,
    lineHeight: 24,
  },
  privacyInfo: {
    width: '100%',
    backgroundColor: '#E6F2FF',
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
  },
  privacyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4B6D9B',
    marginBottom: 12,
  },
  privacyText: {
    fontSize: 15,
    color: '#333',
    lineHeight: 22,
  },
  footer: {
    padding: 24,
    backgroundColor: '#F8F9FA',
  },
  button: {
    backgroundColor: '#4B6D9B',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
  },
}); 