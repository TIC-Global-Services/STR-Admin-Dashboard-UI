import { apiClient } from './client';

export interface DashboardData {
  memberships: {
    summary: {
      total: number;
      pending: number;
      approved: number;
      rejected: number;
    };
    trends: {
      today: number;
      last7Days: number;
      last30Days: number;
    };
    daily: Array<{
      date: string;
      count: number;
    }>;
  };
  users: {
    total: number;
    active: number;
    inactive: number;
    createdToday: number;
    createdThisMonth: number;
  };
  news: {
    total: number;
    published: number;
    drafts: number;
    publishedToday: number;
  };
  social: Array<{
    platform: 'INSTAGRAM' | 'X';
    total: number;
    active: number;
    inactive: number;
  }>;
}

export interface MembershipAnalytics {
  summary: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
  };
  trends: {
    today: number;
    last7Days: number;
    last30Days: number;
  };
  daily: Array<{
    date: string;
    count: number;
  }>;
}

export interface MembershipDimensions {
  state: Array<{ label: string; count: number }>;
  district: Array<{ label: string; count: number }>;
  zone: Array<{ label: string; count: number }>;
  bloodGroup: Array<{ label: string; count: number }>;
  occupation: Array<{ label: string; count: number }>;
}

export interface UserAnalytics {
  total: number;
  active: number;
  inactive: number;
  createdToday: number;
  createdThisMonth: number;
}

export interface NewsAnalytics {
  total: number;
  published: number;
  drafts: number;
  publishedToday: number;
}

export interface SocialAnalytics {
  platform: 'INSTAGRAM' | 'X';
  total: number;
  active: number;
  inactive: number;
}

export const analyticsApi = {
  // Get dashboard overview
  getDashboard: async (): Promise<DashboardData> => {
    try {
      const { data } = await apiClient.get('/admin/analytics/dashboard');
      return data;
    } catch {
      return {
        memberships: {
          summary: { total: 0, pending: 0, approved: 0, rejected: 0 },
          trends: { today: 0, last7Days: 0, last30Days: 0 },
          daily: [],
        },
        users: { total: 0, active: 0, inactive: 0, createdToday: 0, createdThisMonth: 0 },
        news: { total: 0, published: 0, drafts: 0, publishedToday: 0 },
        social: [
          { platform: 'INSTAGRAM', total: 0, active: 0, inactive: 0 },
          { platform: 'X', total: 0, active: 0, inactive: 0 },
        ],
      };
    }
  },

  // Get membership analytics
  getMemberships: async (): Promise<MembershipAnalytics> => {
    try {
      const { data } = await apiClient.get('/admin/analytics/memberships');
      return data;
    } catch {
      return {
        summary: { total: 0, pending: 0, approved: 0, rejected: 0 },
        trends: { today: 0, last7Days: 0, last30Days: 0 },
        daily: [],
      };
    }
  },

  // Get membership dimension-wise analytics
  getMembershipDimensions: async (): Promise<MembershipDimensions> => {
    try {
      const { data } = await apiClient.get('/admin/analytics/memberships/dimensions');
      return data;
    } catch {
      return {
        state: [],
        district: [],
        zone: [],
        bloodGroup: [],
        occupation: [],
      };
    }
  },

  // Get user analytics
  getUsers: async (): Promise<UserAnalytics> => {
    try {
      const { data } = await apiClient.get('/admin/analytics/users');
      return data;
    } catch {
      return {
        total: 0,
        active: 0,
        inactive: 0,
        createdToday: 0,
        createdThisMonth: 0,
      };
    }
  },

  // Get news analytics
  getNews: async (): Promise<NewsAnalytics> => {
    try {
      const { data } = await apiClient.get('/admin/analytics/news');
      return data;
    } catch {
      return {
        total: 0,
        published: 0,
        drafts: 0,
        publishedToday: 0,
      };
    }
  },

  // Get social analytics
  getSocial: async (): Promise<SocialAnalytics[]> => {
    try {
      const { data } = await apiClient.get('/admin/analytics/social');
      return data;
    } catch (error) {
      console.error('Error fetching social analytics:', error);
      return [
        { platform: 'INSTAGRAM', total: 0, active: 0, inactive: 0 },
        { platform: 'X', total: 0, active: 0, inactive: 0 },
      ];
    }
  },
};
