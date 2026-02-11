import { Injectable } from '@nestjs/common';
import { CreateNewsDto } from './dto/create-news.dto';
import { UpdateNewsDto } from './dto/update-news.dto';
import axios from 'axios';

// External API configuration
const EXTERNAL_API_URL = 'https://str-admin.vercel.app/api/v1';
const EXTERNAL_API_CREDENTIALS = {
  email: 'manojkumararumainathan@gmail.com',
  password: '12345678',
};

@Injectable()
export class NewsService {
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

  async create(dto: CreateNewsDto, authorId: string) {
    try {
      const token = await this.getAccessToken();
      const response = await axios.post(
        `${EXTERNAL_API_URL}/admin/news`,
        dto,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      return response.data;
    } catch (error) {
      console.error('Failed to create news:', error);
      throw error;
    }
  }

  async update(id: string, dto: UpdateNewsDto, userId: string) {
    try {
      const token = await this.getAccessToken();
      const response = await axios.put(
        `${EXTERNAL_API_URL}/admin/news/${id}`,
        dto,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      return response.data;
    } catch (error) {
      console.error('Failed to update news:', error);
      throw error;
    }
  }

  async findById(id: string) {
    try {
      const token = await this.getAccessToken();
      const response = await axios.get(
        `${EXTERNAL_API_URL}/admin/news/${id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      return response.data;
    } catch (error) {
      console.error('Failed to fetch news by id:', error);
      throw error;
    }
  }

  async findAllAdmin() {
    try {
      const token = await this.getAccessToken();
      const response = await axios.get(`${EXTERNAL_API_URL}/admin/news`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch all news:', error);
      return [];
    }
  }

  async findPublished() {
    try {
      const token = await this.getAccessToken();
      const response = await axios.get(`${EXTERNAL_API_URL}/news`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch published news:', error);
      return [];
    }
  }
}
