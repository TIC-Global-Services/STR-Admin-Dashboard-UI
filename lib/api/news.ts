import { apiClient } from './client';

export interface News {
  id: string;
  title: string;
  slug?: string;
  summary?: string;
  content?: string;
  coverImage?: string;
  bannerImage?: string;
  isPublished?: boolean;
  publishedAt?: string;
  authorId?: string;
  createdAt?: string;
  updatedAt?: string;
  author?: {
    id: string;
    email: string;
  };
}

export interface CreateNewsDto {
  title: string;
  summary?: string;
  content: string;
  coverImage?: string;
  bannerImage?: string;
  isPublished?: boolean;
}

export interface UpdateNewsDto {
  title?: string;
  summary?: string;
  content?: string;
  coverImage?: string;
  bannerImage?: string;
  isPublished?: boolean;
}

export const newsApi = {
  // Public - Get published news
  getPublished: async (): Promise<News[]> => {
    try {
      const { data } = await apiClient.get('/news');
      return data;
    } catch {
      return [];
    }
  },

  // Admin - Get all news
  getAll: async (): Promise<News[]> => {
    try {
      const { data } = await apiClient.get('/admin/news');
      return data;
    } catch {
      return [];
    }
  },

  // Admin - Get news by ID
  getById: async (id: string): Promise<News | null> => {
    try {
      const { data } = await apiClient.get(`/admin/news/${id}`);
      return data;
    } catch {
      return null;
    }
  },

  // Admin - Create news
  create: async (newsData: CreateNewsDto): Promise<News> => {
    const { data } = await apiClient.post('/admin/news', newsData);
    return data;
  },

  // Admin - Update news
  update: async (id: string, newsData: UpdateNewsDto): Promise<News> => {
    const { data } = await apiClient.put(`/admin/news/${id}`, newsData);
    return data;
  },

  // Admin - Publish news
  publish: async (id: string): Promise<News> => {
    const { data } = await apiClient.put(`/admin/news/${id}`, { isPublished: true });
    return data;
  },


  // Admin - Unpublish news
  unpublish: async (id: string): Promise<News> => {
    const { data } = await apiClient.put(`/admin/news/${id}`, { isPublished: false });
    return data;
  },
};
