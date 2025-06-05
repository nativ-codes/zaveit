import { ShareIntentCard } from '@/common/components/ShareIntentCard';
import { saveShareIntent } from '@/config/storage/persistent';
import { OEmbedData, PlatformConfig, SocialPlatform } from '@/types';
import { Stack, useRouter } from 'expo-router';
import { useShareIntentContext } from 'expo-share-intent';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const PLATFORM_CONFIGS: PlatformConfig[] = [
  {
    platform: SocialPlatform.TIKTOK,
    domains: ['tiktok.com'],
    oembedEndpoint: 'https://www.tiktok.com/oembed'
  },
  {
    platform: SocialPlatform.REDDIT,
    domains: ['reddit.com'],
    oembedEndpoint: 'https://www.reddit.com/oembed'
  },
  {
    platform: SocialPlatform.YOUTUBE,
    domains: ['youtube.com', 'youtu.be'],
    oembedEndpoint: 'https://www.youtube.com/oembed'
  }
];

const checkSocialPlatform = (url: string): PlatformConfig | undefined => {
  if (!url) return undefined;
  
  try {
    const urlObj = new URL(url);
    const domain = urlObj.hostname.toLowerCase().replace('www.', '');
    
    return PLATFORM_CONFIGS.find(config => 
      config.domains.some(platformDomain => domain === platformDomain)
    );
  } catch (error) {
    return undefined;
  }
};

export default function ShareIntentScreen() {
  const { shareIntent, resetShareIntent } = useShareIntentContext();
  const router = useRouter();
  const [oembedData, setOembedData] = useState<OEmbedData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const platformConfig = shareIntent?.webUrl ? checkSocialPlatform(shareIntent.webUrl) : undefined;

  useEffect(() => {
    const fetchOEmbedData = async () => {
      if (!platformConfig || !shareIntent?.webUrl) return;

      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `${platformConfig.oembedEndpoint}?url=${encodeURIComponent(shareIntent.webUrl)}&format=json`
        );
        
        if (!response.ok) {
          throw new Error('Failed to fetch metadata');
        }

        const data = await response.json();
        setOembedData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch metadata');
      } finally {
        setIsLoading(false);
      }
    };

    fetchOEmbedData();
  }, [platformConfig, shareIntent?.webUrl]);

  const handleSave = () => {
    if (shareIntent?.webUrl && platformConfig && oembedData) {
      saveShareIntent({
        url: shareIntent.webUrl,
        platform: platformConfig.platform,
        title: oembedData.title,
        author: oembedData.author_name,
        thumbnail: oembedData.thumbnail_url,
        metadata: oembedData
      });
    }
    resetShareIntent();
    router.replace('/');
  };

  return (
    <ScrollView style={styles.container}>
      <Stack.Screen 
        options={{
          title: 'Shared Content',
          headerShown: true,
        }} 
      />
      
      <View style={styles.content}>
        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
          </View>
        )}

        {error && (
          <Text style={styles.errorText}>Error: {error}</Text>
        )}

        {oembedData && platformConfig && shareIntent?.webUrl && (
          <ShareIntentCard
            data={{
              url: shareIntent.webUrl,
              platform: platformConfig.platform,
              title: oembedData.title,
              author: oembedData.author_name,
              thumbnail: oembedData.thumbnail_url,
              timestamp: Date.now(),
              metadata: oembedData
            }}
          />
        )}

        <TouchableOpacity style={styles.button} onPress={handleSave}>
          <Text style={styles.buttonText}>Save</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 20,
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  errorText: {
    color: 'red',
    marginTop: 10,
    marginBottom: 10,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 