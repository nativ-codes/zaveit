import { ShareIntentCard } from '@/common/components/ShareIntentCard';
import { removeShareIntent, storage } from '@/config/storage/persistent';
import { StoredShareIntent } from '@/types';
import { Stack, useRouter } from 'expo-router';
import { useShareIntentContext } from 'expo-share-intent';
import React, { useEffect, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';

export default function HomeScreen() {
  const { hasShareIntent } = useShareIntentContext();
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [shareIntents, setShareIntents] = useState<StoredShareIntent[]>([]);
  
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
      <Stack.Screen 
        options={{
          title: 'Saved Content',
          headerShown: true,
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
}); 