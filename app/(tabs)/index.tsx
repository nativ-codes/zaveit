import backgroundImage from '@/assets/images/background.png';
import ShareIntentRow from '@/common/components/share-intent-row/share-intent-row';
import { useAuth } from '@/config/contexts/auth.context';
import { removeShareIntent, storage } from '@/config/storage/persistent';
import { signOut } from '@/services/google-auth.service';
import { StoredShareIntent } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useShareIntentContext } from 'expo-share-intent';
import React, { useEffect, useState } from 'react';
import { ImageBackground, RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function HomeScreen() {
  const { hasShareIntent } = useShareIntentContext();
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [shareIntents, setShareIntents] = useState<StoredShareIntent[]>([]);
  const { user, isLoading, isAuthenticated } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const insets = useSafeAreaInsets();
  
  const tabs = [
    { id: 'all', label: 'All' },
    { id: 'links', label: 'Links' },
    { id: 'images', label: 'Images' },
    { id: 'text', label: 'Text' },
    { id: 'files', label: 'Files' },
  ];

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

  return (
    <View style={styles.container}>
      <ImageBackground source={backgroundImage} style={styles.backgroundImage} resizeMode="cover">
        <View style={styles.backgroundOverlay} />
        {!isAuthenticated ? (
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
        ) : (
          <View style={[styles.mainContent, { paddingTop: insets.top }]}>
            <View style={styles.searchContainer}>
              <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search your saved content..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholderTextColor="#666"
              />
            </View>
            
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.tabsContainer}
              contentContainerStyle={styles.tabsContent}
            >
              {tabs.map((tab) => (
                <TouchableOpacity
                  key={tab.id}
                  style={[
                    styles.tabButton,
                    activeTab === tab.id && styles.activeTabButton
                  ]}
                  onPress={() => setActiveTab(tab.id)}
                >
                  <Text style={[
                    styles.tabText,
                    activeTab === tab.id && styles.activeTabText
                  ]}>
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

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
                <ShareIntentRow
                  key={intent.timestamp}
                  data={intent}
                  onDelete={handleDelete}
                  showDeleteButton
                />
              ))}
              <TouchableOpacity style={styles.logoutListButton} onPress={handleLogout}>
                <Ionicons name="log-out-outline" size={24} color="#666" style={styles.logoutListIcon} />
                <Text style={styles.logoutListButtonText}>Log out</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        )}
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f4ea",
  },
  backgroundImage: {
    flex: 1,
    width: "100%",
    height: 300,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  backgroundOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  loginContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loginTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginTop: 24,
    textAlign: "center",
  },
  loginSubtitle: {
    fontSize: 16,
    color: "#666",
    marginTop: 8,
    textAlign: "center",
    marginBottom: 32,
  },
  loginButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    shadowColor: "#000",
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
    color: "#333",
    fontWeight: "500",
  },
  logoutButton: {
    marginRight: 16,
    padding: 8,
  },
  logoutListButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    paddingVertical: 16,
    borderRadius: 8,
    marginTop: 24,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: "#ddd",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  logoutListIcon: {
    marginRight: 12,
  },
  logoutListButtonText: {
    fontSize: 16,
    color: "#333",
    fontWeight: "500",
  },
  mainContent: {
    flex: 1,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    margin: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#333",
  },
  tabsContainer: {
    maxHeight: 50,
    marginBottom: 8,
  },
  tabsContent: {
    paddingHorizontal: 16,
  },
  tabButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: "#f0f0f0",
  },
  activeTabButton: {
    backgroundColor: "#4285F4",
  },
  tabText: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  activeTabText: {
    color: "#fff",
  },
});

export const options = {
  headerShown: false,
}; 