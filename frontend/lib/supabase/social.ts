import { supabase } from './client';

export interface SupabaseSocialPost {
  id: string;
  platform: 'INSTAGRAM' | 'X';
  postUrl: string;
  caption?: string;
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export const supabaseSocialApi = {
  // Get all Instagram posts from Supabase
  getInstagramPosts: async (): Promise<SupabaseSocialPost[]> => {
    try {
      const { data, error } = await supabase
        .from('SocialPost')
        .select('*')
        .eq('platform', 'INSTAGRAM')
        .order('createdAt', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching Instagram posts from Supabase:', error);
      return [];
    }
  },

  // Get all X posts from Supabase
  getXPosts: async (): Promise<SupabaseSocialPost[]> => {
    try {
      const { data, error } = await supabase
        .from('SocialPost')
        .select('*')
        .eq('platform', 'X')
        .order('createdAt', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching X posts from Supabase:', error);
      return [];
    }
  },

  // Get all posts from Supabase
  getAllPosts: async (): Promise<SupabaseSocialPost[]> => {
    try {
      const { data, error } = await supabase
        .from('SocialPost')
        .select('*')
        .order('createdAt', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching posts from Supabase:', error);
      return [];
    }
  },
};
