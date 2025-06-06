import { StoredShareIntent } from '@/types/share-intents';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface ShareIntentCardProps {
  data: StoredShareIntent;
  onDelete?: (timestamp: number) => void;
  showDeleteButton?: boolean;
}

export function ShareIntentCard({ data, onDelete, showDeleteButton }: ShareIntentCardProps) {
  const { url, title, author, thumbnail, tags, timestamp } = data;
  console.log(">> data", JSON.stringify(data));

  return (
    <View style={styles.container}>
      {thumbnail && (
        <Image
          source={{ uri: thumbnail }}
          style={styles.image}
          resizeMode="cover"
        />
      )}

      <View style={styles.content}>
        {title && (
          <Text numberOfLines={4} style={styles.title}>
            {title}
          </Text>
        )}

        {author && <Text style={styles.author}>by {author}</Text>}

        <Text style={styles.url} numberOfLines={2}>
          {url}
        </Text>

        {tags?.length > 0 && (
          <View style={styles.tagsContainer}>
            {tags.map((tag, index) => (
              <View key={index} style={styles.tag}>
                <Text style={styles.tagText}>#{tag}</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      {showDeleteButton && onDelete && (
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => onDelete(timestamp)}
        >
          <Ionicons name="trash-outline" size={24} color="#ff4444" />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  image: {
    width: '100%',
    height: 200,
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  author: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  url: {
    fontSize: 14,
    color: '#0066cc',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
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
    fontSize: 12,
    color: '#666',
  },
  deleteButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 20,
    padding: 8,
  },
}); 