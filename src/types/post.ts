export interface PostImage {
  id: string;
  url: string;
  alt?: string;
  width: number;
  height: number;
}

export interface PostTag {
  id: string;
  name: string;
  slug: string;
}

export interface Post {
  id: string;
  content: string;
  type: 'text' | 'photo';
  images: PostImage[];
  tags: PostTag[];
  createdAt: Date;
  publishedAt: Date | null;
}
