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
  createdAt: Date;
  publishedAt: Date | null;
}
