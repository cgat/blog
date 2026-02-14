export interface ContentSource {
  id: string;
  label: string;
  tag: string;
  site: string;
}

export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
}

export const contentSources: ContentSource[] = [
  {
    id: 'movie-review',
    label: 'Movie',
    tag: 'Movie Review',
    site: 'letterboxd.com',
  },
];
