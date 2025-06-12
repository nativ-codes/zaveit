import { MAX_CONTENT_LENGTH } from '@/common/constants';
import { generateTags } from '@/services/llm';
import { savePostService } from '@/services/posts.service';
import { PostType, StoredPost } from '@/types/share-intents';
import { MMKV } from 'react-native-mmkv';

export const storage = new MMKV({
  id: "zaveit-storage",
  encryptionKey: process.env.EXPO_PUBLIC_MMKV_ENCRYPTON_KEY,
});

export function getPosts(): StoredPost[] {
  const posts = storage.getString('posts');
  return posts ? JSON.parse(posts) : [];
}

export async function savePost(post: Omit<PostType, 'tags'>): Promise<void> {
  const posts = getPosts();
  
  // Generate tags for the content
  const content = post.title?.substring(0, MAX_CONTENT_LENGTH) || "";
  
  const tags = await generateTags(content);
  console.log(">> tags", JSON.stringify(tags));
  
  const newPost = {
    ...post,
    tags,
  };

  posts.unshift(newPost);
  storage.set('posts', JSON.stringify(posts));
  console.log(">> newPost", JSON.stringify(newPost));
  await savePostService(newPost);
}

export function removePost(timestamp: number): void {
  const posts = getPosts();
  const updatedPosts = posts.filter(post => post.timestamp !== timestamp);
  storage.set('posts', JSON.stringify(updatedPosts));
}

export function savePosts(posts: StoredPost[]): void {
  storage.set('posts', JSON.stringify(posts));
} 