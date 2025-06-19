import { getPosts } from '@/config/storage/persistent';
import { PostType } from '@/types/posts';

export function getPost(timestamp: number): PostType {
  const posts = getPosts();
  const post = posts.find((post: PostType) => post.timestamp === timestamp);
  
  if (!post) {
    throw new Error('Post not found');
  }

  return post;
} 