import { ACTIVITY_OPACITY } from '@/common/constants/ui';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { GestureResponderEvent, Image, Text, TouchableOpacity, View } from 'react-native';
import { styles } from './share-intent-row.style';
import { ShareIntentRowType } from './share-intent-row.type';

const ShareIntentRow: React.FC<ShareIntentRowType> = ({ 
  data, 
  onDelete, 
  showDeleteButton 
}) => {
  const { url, title, author, thumbnail, tags, timestamp } = data;
  const router = useRouter();

  const handlePress = () => {
    router.push({
      pathname: '/share-intent/[id]',
      params: { id: timestamp.toString() }
    });
  };

  const handleDelete = (e: GestureResponderEvent) => {
    e.stopPropagation();
    onDelete?.(timestamp);
  };

  return (
    <TouchableOpacity 
      style={styles.container} 
      onPress={handlePress}
      activeOpacity={ACTIVITY_OPACITY}
      accessibilityRole="button"
      accessibilityLabel={`View details for ${title || url}`}
    >
      {thumbnail && (
        <Image
          source={{ uri: thumbnail }}
          style={styles.image}
          resizeMode="cover"
          accessibilityLabel="Thumbnail image"
        />
      )}

      <View style={styles.content}>
        {title && (
          <Text 
            numberOfLines={4} 
            style={styles.title}
            accessibilityRole="header"
          >
            {title}
          </Text>
        )}

        <Text 
          style={styles.url} 
          numberOfLines={3}
          accessibilityLabel={`URL: ${url}`}
        >
          {url}
        </Text>

        {tags?.length > 0 && (
          <View 
            style={styles.tagsContainer}
            accessibilityLabel="Tags"
          >
            {tags.map((tag, index) => (
              <View 
                key={index} 
                style={styles.tag}
                accessibilityLabel={`Tag: ${tag}`}
              >
                <Text style={styles.tagText}>#{tag}</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      {false && onDelete && (
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={handleDelete}
          accessibilityRole="button"
          accessibilityLabel="Delete share intent"
        >
          <Ionicons name="trash-outline" size={20} color="#ff4444" />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
};

export default ShareIntentRow; 