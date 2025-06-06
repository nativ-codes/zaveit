import { ShareIntentCard } from '@/common/components/ShareIntentCard';
import { IMAGE_PLACEHOLDER } from '@/common/constants';
import { useAuth } from '@/config/contexts/auth.context';
import { saveShareIntent } from '@/config/storage/persistent';
import { savePost } from '@/services/posts.service';
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
  const { user } = useAuth();
  const [metadata, setMetadata] = useState<OEmbedData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
console.log(">> metadata", JSON.stringify(metadata));
  const platformConfig = shareIntent?.webUrl ? checkSocialPlatform(shareIntent.webUrl) : undefined;

  console.log(">> shareIntent", JSON.stringify(shareIntent));

  useEffect(() => {
    const fetchOEmbedData = async () => {
      if (!shareIntent?.webUrl) return;

      setIsLoading(true);
      setError(null);
      console.log(">> shareIntent", JSON.stringify(platformConfig));
      // If no platform config is found, use shareIntent metadata directly
      if (!platformConfig) {
        if (shareIntent.meta) {

          setMetadata({
            title: shareIntent.meta.title || shareIntent.webUrl,
            author_name: shareIntent.meta.author || "Unknown",
            thumbnail_url: shareIntent.meta["og:image"] || IMAGE_PLACEHOLDER
          });
        } else {
          setError('No metadata available for this URL');
        }
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(
          `${platformConfig.oembedEndpoint}?url=${encodeURIComponent(shareIntent.webUrl)}&format=json`
        );
        
        if (!response.ok) {
          throw new Error('Failed to fetch metadata');
        }

        const data = await response.json();
        console.log(">> data", JSON.stringify(data));
        setMetadata(data);
      } catch (err) {
        console.log(">> oEmbed failed, falling back to shareIntent metadata");
        // Fallback to shareIntent metadata if available
        if (shareIntent.meta) {
          setMetadata({
            title: shareIntent.meta.title || shareIntent.webUrl,
            author_name: shareIntent.meta.author || "Unknown",
            thumbnail_url: shareIntent.meta["og:image"] || IMAGE_PLACEHOLDER
          });
        } else {
          setError(err instanceof Error ? err.message : 'Failed to fetch metadata');
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchOEmbedData();
  }, [platformConfig, shareIntent?.webUrl]);

  const handleSave = async () => {
    if (shareIntent?.webUrl) {
      // Save to local storage
      saveShareIntent({
        url: shareIntent.webUrl,
        platform: platformConfig?.platform || '',
        title: metadata.title,
        author: metadata.author_name,
        thumbnail: metadata.thumbnail_url,
        timestamp: Date.now()
      });

      // Save to Firestore
      try {
        await savePost(user.id, {
          url: shareIntent.webUrl,
          title: metadata.title,
          thumbnail: metadata.thumbnail_url
        });
      } catch (err) {
        console.error('Failed to save post to Firestore:', err);
        // Continue with the flow even if Firestore save fails
      }
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

        {metadata && shareIntent?.webUrl && (
          <ShareIntentCard
            data={{
              url: shareIntent.webUrl,
              title: metadata.title,
              author: metadata.author_name,
              thumbnail: metadata.thumbnail_url,
              timestamp: Date.now(),
              metadata: metadata,
              tags: []
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