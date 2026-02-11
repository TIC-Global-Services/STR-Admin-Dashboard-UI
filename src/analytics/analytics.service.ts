import { Injectable } from '@nestjs/common';
import axios from 'axios';

// External API configuration
const EXTERNAL_API_URL = 'https://str-admin.vercel.app/api/v1';
const EXTERNAL_API_CREDENTIALS = {
  email: 'manojkumararumainathan@gmail.com',
  password: '12345678',
};

@Injectable()
export class AnalyticsService {
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

  // ======================================================
  // MEMBERSHIP – DIMENSION ANALYTICS (FROM EXTERNAL API)
  // ======================================================
  async membershipDimensions() {
    try {
      const token = await this.getAccessToken();
      const response = await axios.get(
        `${EXTERNAL_API_URL}/admin/analytics/memberships/dimensions`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      return response.data;
    } catch (error) {
      console.error('Failed to fetch membership dimensions:', error);
      throw error;
    }
  }

  // ======================================================
  // MEMBERSHIP ANALYTICS (FROM EXTERNAL API)
  // ======================================================
  async membershipAnalytics() {
    try {
      const token = await this.getAccessToken();
      const response = await axios.get(
        `${EXTERNAL_API_URL}/admin/analytics/memberships`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      return response.data;
    } catch (error) {
      console.error('Failed to fetch membership analytics:', error);
      throw error;
    }
  }

  // ======================================================
  // USER ANALYTICS (FROM EXTERNAL API)
  // ======================================================
  async userAnalytics() {
    try {
      const token = await this.getAccessToken();
      const response = await axios.get(
        `${EXTERNAL_API_URL}/admin/analytics/users`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      return response.data;
    } catch (error) {
      console.error('Failed to fetch user analytics:', error);
      throw error;
    }
  }

  // ======================================================
  // NEWS ANALYTICS (FROM EXTERNAL API)
  // ======================================================
  async newsAnalytics() {
    try {
      const token = await this.getAccessToken();
      const response = await axios.get(
        `${EXTERNAL_API_URL}/admin/analytics/news`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      return response.data;
    } catch (error) {
      console.error('Failed to fetch news analytics:', error);
      throw error;
    }
  }

  // ======================================================
  // SOCIAL ANALYTICS (FROM EXTERNAL API)
  // ======================================================
  async socialAnalytics() {
    try {
      const token = await this.getAccessToken();
      const response = await axios.get(
        `${EXTERNAL_API_URL}/admin/analytics/social`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      return response.data;
    } catch (error) {
      console.error('Failed to fetch social analytics:', error);
      throw error;
    }
  }

  // ======================================================
  // OVERALL DASHBOARD (FROM EXTERNAL API)
  // ======================================================
  async dashboard() {
    try {
      const token = await this.getAccessToken();
      const response = await axios.get(
        `${EXTERNAL_API_URL}/admin/analytics/dashboard`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      return response.data;
    } catch (error) {
      console.error('Failed to fetch dashboard analytics:', error);
      throw error;
    }
  }
}
