import { Injectable } from '@nestjs/common';
import axios from 'axios';

// External API configuration
const EXTERNAL_API_URL = 'https://str-admin.vercel.app/api/v1';
const EXTERNAL_API_CREDENTIALS = {
  email: 'manojkumararumainathan@gmail.com',
  password: '12345678',
};

// Mock data storage
const mockInstagramPosts: any[] = [
  {
    id: 'ig-mock-1',
    platform: 'INSTAGRAM',
    postUrl: 'https://www.instagram.com/p/mock1/',
    caption: 'Beautiful sunset at the beach 🌅 (Mock)',
    isActive: true,
    createdBy: 'admin-123',
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
  },
  {
    id: 'ig-mock-2',
    platform: 'INSTAGRAM',
    postUrl: 'https://www.instagram.com/p/mock2/',
    caption: 'Team meeting highlights 💼 (Mock)',
    isActive: true,
    createdBy: 'admin-123',
    createdAt: '2024-01-16T11:00:00Z',
    updatedAt: '2024-01-16T11:00:00Z',
  },
];

const mockXPosts: any[] = [
  {
    id: 'x-mock-1',
    platform: 'X',
    postUrl: 'https://twitter.com/user/status/mock1',
    caption: 'Exciting news coming soon! Stay tuned 🚀 (Mock)',
    isActive: true,
    createdBy: 'admin-123',
    createdAt: '2024-01-15T12:00:00Z',
    updatedAt: '2024-01-15T12:00:00Z',
  },
  {
    id: 'x-mock-2',
    platform: 'X',
    postUrl: 'https://twitter.com/user/status/mock2',
    caption: 'Check out our latest blog post 📝 (Mock)',
    isActive: false,
    createdBy: 'admin-123',
    createdAt: '2024-01-16T13:00:00Z',
    updatedAt: '2024-01-16T13:00:00Z',
  },
];

@Injectable()
export class SocialRepository {
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;

  // Get access token from external API
  private async getAccessToken(): Promise<string> {
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    try {
      const response = await axios.post(
        `${EXTERNAL_API_URL}/auth/login`,
        EXTERNAL_API_CREDENTIALS,
      );
      this.accessToken = response.data.accessToken;
      this.tokenExpiry = Date.now() + 14 * 60 * 1000;
      return this.accessToken!;
    } catch (error) {
      console.error('Failed to get access token:', error);
      throw new Error('Failed to authenticate with external API');
    }
  }

  // Fetch from external API
  private async fetchFromExternalAPI(
    platform: 'INSTAGRAM' | 'X',
  ): Promise<any[]> {
    try {
      const token = await this.getAccessToken();
      const endpoint =
        platform === 'INSTAGRAM'
          ? '/admin/social-posts/instagram'
          : '/admin/social-posts/x';
      const response = await axios.get(`${EXTERNAL_API_URL}${endpoint}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch from external API:', error);
      return [];
    }
  }

  // -------------------------
  // COUNT ACTIVE
  // -------------------------
  async countActive(platform: 'INSTAGRAM' | 'X') {
    const mockData =
      platform === 'INSTAGRAM' ? mockInstagramPosts : mockXPosts;
    const externalData = await this.fetchFromExternalAPI(platform);
    const allData = [...mockData, ...externalData];
    return allData.filter((post) => post.isActive).length;
  }

  // -------------------------
  // CREATE
  // -------------------------
  create(
    platform: 'INSTAGRAM' | 'X',
    data: {
      postUrl: string;
      caption?: string;
      isActive: boolean;
    },
    userId: string,
  ) {
    const newPost = {
      id: Math.random().toString(36).substring(7),
      platform,
      postUrl: data.postUrl,
      caption: data.caption,
      isActive: data.isActive,
      createdBy: userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (platform === 'INSTAGRAM') {
      mockInstagramPosts.push(newPost);
    } else {
      mockXPosts.push(newPost);
    }

    return newPost;
  }

  // -------------------------
  // UPDATE BY ID
  // -------------------------
  async update(
    id: string,
    data: {
      postUrl?: string;
      caption?: string;
      isActive?: boolean;
    },
  ) {
    // Check if it's a mock post
    const instagramPost = mockInstagramPosts.find((p) => p.id === id);
    const xPost = mockXPosts.find((p) => p.id === id);
    const post = instagramPost || xPost;

    if (post) {
      // Update mock post
      if (data.postUrl !== undefined) post.postUrl = data.postUrl;
      if (data.caption !== undefined) post.caption = data.caption;
      if (data.isActive !== undefined) post.isActive = data.isActive;
      post.updatedAt = new Date().toISOString();
      return post;
    }

    // If not a mock post, try to update via external API
    try {
      const token = await this.getAccessToken();
      
      // Determine platform by fetching both and checking which has this ID
      const [instagramData, xData] = await Promise.all([
        this.fetchFromExternalAPI('INSTAGRAM'),
        this.fetchFromExternalAPI('X'),
      ]);

      const isInstagram = instagramData.some((p) => p.id === id);
      const endpoint = isInstagram
        ? `/admin/social-posts/${id}/instagram`
        : `/admin/social-posts/${id}/x`;

      const response = await axios.put(
        `${EXTERNAL_API_URL}${endpoint}`,
        data,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      return response.data;
    } catch (error) {
      console.error('Failed to update external post:', error);
      throw error;
    }
  }

  // -------------------------
  // ADMIN LIST - COMBINES MOCK + EXTERNAL API
  // -------------------------
  async findAdmin(platform: 'INSTAGRAM' | 'X') {
    const mockData =
      platform === 'INSTAGRAM' ? mockInstagramPosts : mockXPosts;
    const externalData = await this.fetchFromExternalAPI(platform);
    return [...mockData, ...externalData];
  }

  // -------------------------
  // PUBLIC (MAX 3 ACTIVE)
  // -------------------------
  async findActive(platform: 'INSTAGRAM' | 'X') {
    const allData = await this.findAdmin(platform);
    return allData
      .filter((post) => post.isActive)
      .slice(0, 3)
      .map((post) => ({
        postUrl: post.postUrl,
        caption: post.caption,
      }));
  }
}
