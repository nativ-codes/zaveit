import { initializeGoogleSignIn, signInWithGoogle } from '@/services/google-auth.service';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function LoginScreen() {
  const router = useRouter();

  useEffect(() => {
    // Initialize Google Sign In
    initializeGoogleSignIn();
  }, []);

  const handleGoogleSignIn = async () => {
    try {
      const { user } = await signInWithGoogle();
      if (user) {
        // Navigate to home screen after successful login
        router.replace('/');
      }
    } catch (error) {
      console.error('Login error:', error);
      // You might want to show an error message to the user here
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{
          title: 'Login',
          headerShown: false,
        }} 
      />

      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <Ionicons name="bookmark" size={80} color="#0066cc" />
          <Text style={styles.title}>Zaveit</Text>
          <Text style={styles.subtitle}>Save and organize your content</Text>
        </View>

        <TouchableOpacity
          style={styles.googleButton}
          onPress={handleGoogleSignIn}
        >
          <Ionicons name="logo-google" size={24} color="#4285F4" style={styles.googleIcon} />
          <Text style={styles.googleButtonText}>Continue with Google</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 60,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 8,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  googleIcon: {
    marginRight: 12,
  },
  googleButtonText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
}); 