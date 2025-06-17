import { getSortedTags } from '@/screens/search/search.util';
import { savePostService } from '@/services/posts.service';
import { PostType, StoredPost } from '@/types/posts';
import { useMemo } from 'react';
import { MMKV, useMMKVString } from 'react-native-mmkv';

export const storage = new MMKV({
  id: "zaveit-storage",
  encryptionKey: process.env.EXPO_PUBLIC_MMKV_ENCRYPTON_KEY,
});

export const getPosts = (): StoredPost[] => {
  const posts = storage.getString('posts');
  return posts ? JSON.parse(posts) : [];
}

export const getTags = (): string[] => {
  const posts = getPosts();
  return getSortedTags(posts);
}

export const savePost = async (post: PostType): Promise<void> => {
  const posts = getPosts();

  posts.unshift(post);
  storage.set("posts", JSON.stringify(posts));

  await savePostService(post);
}

export const removePost = (timestamp: number): void => {
  const posts = getPosts();
  const updatedPosts = posts.filter(post => post.timestamp !== timestamp);
  storage.set('posts', JSON.stringify(updatedPosts));
}

export const savePosts = (posts: StoredPost[]): void => {
  storage.set('posts', JSON.stringify(posts));
} 

export const usePosts = (): StoredPost[] => {
  const [posts] = useMMKVString("posts", storage);

  return useMemo(() => JSON.parse(posts || "[]"), [posts]);
};
