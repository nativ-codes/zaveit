import { getPosts } from '@/config/storage/persistent';
import { StoredPost } from '@/types/posts';

export function getPost(timestamp: number): StoredPost {
  const posts = getPosts();
  const post = posts.find((post: StoredPost) => post.timestamp === timestamp);
  
  if (!post) {
    throw new Error('Post not found');
  }

  return post;
} 