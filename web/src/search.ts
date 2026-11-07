// A Post as a Visitor sees it.
export type VisitorPost = { url: string; title: string; author: string; tags: string[]; thumbnailUrl?: string; timestamp: number };

// searchPosts keeps the Posts whose title, author or a Tag contains the query, ignoring case.
export function searchPosts(posts: VisitorPost[], query: string): VisitorPost[] {
  const q = query.trim().toLowerCase();
  if (!q) return posts;
  return posts.filter((p) => [p.title, p.author, ...p.tags].some((field) => field.toLowerCase().includes(q)));
}
