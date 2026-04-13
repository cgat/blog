export interface PostImage {
  id: string;
  url: string;
  alt?: string;
  caption?: string;
  featured?: boolean;
  width: number;
  height: number;
  mimeType?: string;
  likeCount: number;
  likedByMe: boolean;
}

export interface PostTag {
  id: string;
  name: string;
  slug: string;
}

export interface LinkPreviewData {
  url: string;
  title: string | null;
  description: string | null;
  imageUrl: string | null;
  domain: string;
}

export interface Post {
  id: string;
  content: string;
  type: 'text' | 'photo';
  images: PostImage[];
  tags: PostTag[];
  linkPreviews: Record<string, LinkPreviewData>;
  isPrivate: boolean;
  likeCount: number;
  likedByMe: boolean;
  commentCount: number;
  createdAt: Date;
  updatedAt: Date;
  publishedAt: Date | null;
}
