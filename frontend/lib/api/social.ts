import { apiClient } from './client';

export interface SocialPost {
  id: string;
  platform: 'INSTAGRAM' | 'X';
  postUrl: string;
  caption?: string;
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  creator?: {
    id: string;
    email: string;
  };
}

export interface CreateSocialPostDto {
  postUrl: string;
  caption?: string;
  isActive: boolean;
}

export interface UpdateSocialPostDto {
  postUrl?: string;
  caption?: string;
  isActive?: boolean;
}

export const socialApi = {
  // Public - Get Instagram highlights
  getInstagramPublic: async (): Promise<SocialPost[]> => {
    try {
      const { data } = await apiClient.get('/social/instagram');
      return data;
    } catch {
      return [];
    }
  },

  // Public - Get X highlights
  getXPublic: async (): Promise<SocialPost[]> => {
    try {
      const { data } = await apiClient.get('/social/x');
      return data;
    } catch {
      return [];
    }
  },

  // Admin - Get Instagram posts (all)
  getInstagramAdmin: async (): Promise<SocialPost[]> => {
    try {
      const { data } = await apiClient.get('/admin/social-posts/instagram');
      return data;
    } catch {
      return [];
    }
  },

  // Admin - Get X posts (all)
  getXAdmin: async (): Promise<SocialPost[]> => {
    try {
      const { data } = await apiClient.get('/admin/social-posts/x');
      return data;
    } catch {
      return [];
    }
  },

  // Admin - Create Instagram post
  createInstagram: async (postData: CreateSocialPostDto): Promise<SocialPost> => {
    const { data } = await apiClient.post('/admin/social-posts/instagram', postData);
    return data;
  },

  // Admin - Create X post
  createX: async (postData: CreateSocialPostDto): Promise<SocialPost> => {
    const { data } = await apiClient.post('/admin/social-posts/x', postData);
    return data;
  },

  // Admin - Update Instagram post
  updateInstagram: async (id: string, postData: UpdateSocialPostDto): Promise<SocialPost> => {
    const { data } = await apiClient.put(`/admin/social-posts/${id}/instagram`, postData);
    return data;
  },

  // Admin - Update X post
  updateX: async (id: string, postData: UpdateSocialPostDto): Promise<SocialPost> => {
    const { data } = await apiClient.put(`/admin/social-posts/${id}/x`, postData);
    return data;
  },

  // Admin - Toggle Instagram post active status
  toggleInstagramActive: async (id: string, isActive: boolean): Promise<SocialPost> => {
    const { data } = await apiClient.put(`/admin/social-posts/${id}/instagram`, { isActive });
    return data;
  },

  // Admin - Toggle X post active status
  toggleXActive: async (id: string, isActive: boolean): Promise<SocialPost> => {
    const { data } = await apiClient.put(`/admin/social-posts/${id}/x`, { isActive });
    return data;
  },
};
