import { getPost } from '@/common/utils/shareIntents';
import { StoredPost } from '@/types/share-intents';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useNavigation } from 'expo-router';
import React from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';

export default function ShareIntentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const navigation = useNavigation();
  const [post, setPost] = React.useState<StoredPost | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    try {
      const data = getPost(parseInt(id));
      setPost(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load share intent');
    }
  }, [id]);

  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: 'Share Intent Details',
      headerRight: () => (
        <Ionicons name="share-outline" size={24} color="#0066cc" />
      ),
    });
  }, [navigation]);

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  if (!post) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Share intent not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {post.thumbnail && (
        <Image
          source={{ uri: post.thumbnail }}
          style={styles.image}
          resizeMode="cover"
        />
      )}

      <View style={styles.content}>
        {post.title && (
          <Text style={styles.title}>{post.title}</Text>
        )}

        {post.author && (
          <Text style={styles.author}>by {post.author}</Text>
        )}

        <Text style={styles.url}>{post.url}</Text>

        {post.tags?.length > 0 && (
          <View style={styles.tagsContainer}>
            {post.tags.map((tag, index) => (
              <View key={index} style={styles.tag}>
                <Text style={styles.tagText}>#{tag}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
  },
  errorText: {
    fontSize: 16,
    color: '#666',
  },
  image: {
    width: '100%',
    height: 300,
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  author: {
    fontSize: 16,
    color: '#666',
    marginBottom: 12,
  },
  url: {
    fontSize: 16,
    color: '#0066cc',
    marginBottom: 16,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  tag: {
    backgroundColor: '#f0f0f0',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: {
    fontSize: 14,
    color: '#666',
  },
}); 