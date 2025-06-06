import { ShareIntentCard } from '@/common/components/ShareIntentCard';
import { useAuth } from '@/config/contexts/auth.context';
import { removeShareIntent, storage } from '@/config/storage/persistent';
import { signOut } from '@/services/google-auth.service';
import { StoredShareIntent } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import { useShareIntentContext } from 'expo-share-intent';
import React, { useEffect, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function HomeScreen() {
  const { hasShareIntent } = useShareIntentContext();
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [shareIntents, setShareIntents] = useState<StoredShareIntent[]>([]);
  const { user, isLoading, isAuthenticated } = useAuth();
  
  const loadShareIntents = () => {
    const storedIntents = storage.getString('share_intents');
    if (storedIntents) {
      setShareIntents(JSON.parse(storedIntents));
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadShareIntents();
    setRefreshing(false);
  };

  const handleLogout = async () => {
    try {
      await signOut();
      router.replace('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  useEffect(() => {
    if (hasShareIntent) {
      router.replace('/share-intent');
    }
  }, [hasShareIntent]);

  useEffect(() => {
    loadShareIntents();
  }, []);

  const handleDelete = (timestamp: number) => {
    removeShareIntent(timestamp);
    loadShareIntents();
  };

  if (!isAuthenticated) {
    return (
      <View style={styles.container}>
        <Stack.Screen
          options={{
            title: "Saved Content",
            headerShown: true,
          }}
        />
        <View style={styles.loginContainer}>
          <Ionicons name="lock-closed" size={64} color="#666" />
          <Text style={styles.loginTitle}>
            Sign in to view your saved content
          </Text>
          <Text style={styles.loginSubtitle}>
            Your saved content will be synced across devices
          </Text>
          <TouchableOpacity
            style={styles.loginButton}
            onPress={() => router.push("/login")}
          >
            <Ionicons
              name="logo-google"
              size={24}
              color="#4285F4"
              style={styles.googleIcon}
            />
            <Text style={styles.loginButtonText}>Sign in with Google</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{
          title: 'Saved Content',
          headerShown: true,
          headerRight: () => (
            <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
              <Ionicons name="log-out-outline" size={24} color="#666" />
            </TouchableOpacity>
          ),
        }} 
      />
      
      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
          />
        }
      >
        {shareIntents.map((intent: StoredShareIntent) => (
          <ShareIntentCard
            key={intent.timestamp}
            data={intent}
            onDelete={handleDelete}
            showDeleteButton
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  loginContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loginTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 24,
    textAlign: 'center',
  },
  loginSubtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
    marginBottom: 32,
  },
  loginButton: {
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
  loginButtonText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  logoutButton: {
    marginRight: 16,
    padding: 8,
  },
}); 