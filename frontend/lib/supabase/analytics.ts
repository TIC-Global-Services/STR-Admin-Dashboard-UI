import { supabase } from './client';

export interface DashboardData {
  memberships: {
    summary: {
      total: number;
      pending: number;
      approved: number;
      rejected: number;
    };
  };
  news: {
    total: number;
    published: number;
    drafts: number;
  };
  social: Array<{
    platform: 'INSTAGRAM' | 'X';
    total: number;
    active: number;
    inactive: number;
  }>;
}

export async function getDashboardData(): Promise<DashboardData> {
  try {
    // Fetch memberships data
    const { data: memberships, error: membershipError } = await supabase
      .from('Membership')
      .select('status');

    if (membershipError) throw membershipError;

    const membershipSummary = {
      total: memberships?.length || 0,
      pending: memberships?.filter(m => m.status === 'PENDING').length || 0,
      approved: memberships?.filter(m => m.status === 'APPROVED').length || 0,
      rejected: memberships?.filter(m => m.status === 'REJECTED').length || 0,
    };

    // Fetch news data
    const { data: news, error: newsError } = await supabase
      .from('News')
      .select('isPublished');

    if (newsError) throw newsError;

    const newsData = {
      total: news?.length || 0,
      published: news?.filter(n => n.isPublished).length || 0,
      drafts: news?.filter(n => !n.isPublished).length || 0,
    };

    // Fetch social posts data
    const { data: socialPosts, error: socialError } = await supabase
      .from('SocialPost')
      .select('platform, isActive');

    if (socialError) throw socialError;

    const instagramPosts = socialPosts?.filter(p => p.platform === 'INSTAGRAM') || [];
    const xPosts = socialPosts?.filter(p => p.platform === 'X') || [];

    const socialData = [
      {
        platform: 'INSTAGRAM' as const,
        total: instagramPosts.length,
        active: instagramPosts.filter(p => p.isActive).length,
        inactive: instagramPosts.filter(p => !p.isActive).length,
      },
      {
        platform: 'X' as const,
        total: xPosts.length,
        active: xPosts.filter(p => p.isActive).length,
        inactive: xPosts.filter(p => !p.isActive).length,
      },
    ];

    return {
      memberships: { summary: membershipSummary },
      news: newsData,
      social: socialData,
    };
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    // Return zeros if there's an error
    return {
      memberships: {
        summary: { total: 0, pending: 0, approved: 0, rejected: 0 },
      },
      news: { total: 0, published: 0, drafts: 0 },
      social: [
        { platform: 'INSTAGRAM', total: 0, active: 0, inactive: 0 },
        { platform: 'X', total: 0, active: 0, inactive: 0 },
      ],
    };
  }
}
