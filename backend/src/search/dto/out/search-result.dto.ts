export interface SearchResultTagDto {
  id: string;
  name: string;
  color: string;
}

export interface SearchResultDto {
  pageId: string;
  slug: string;
  title: string;
  excerpt: string;
  score: number;
  tags: SearchResultTagDto[];
}
