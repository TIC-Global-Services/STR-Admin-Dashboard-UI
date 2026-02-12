'use client';

import { useState, useEffect } from 'react';
import { newsApi } from '@/lib/api/news';
import { membershipApi } from '@/lib/api/membership';
import { analyticsApi } from '@/lib/api/analytics';
import { Newspaper, Users, UserCheck, UserPlus, Instagram } from 'lucide-react';

export default function DashboardPage() {
  const [newsCount, setNewsCount] = useState(0);
  const [approvedCount, setApprovedCount] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [instagramCount, setInstagramCount] = useState(0);
  const [xCount, setXCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [news, approved, pending, socialData] = await Promise.all([
          newsApi.getPublished(),
          membershipApi.getApproved(),
          membershipApi.getPending(),
          analyticsApi.getSocial(),
        ]);

        const instagram = socialData.find((s: { platform: string }) => s.platform === 'INSTAGRAM');
        const x = socialData.find((s: { platform: string }) => s.platform === 'X');

        setNewsCount(news.length);
        setApprovedCount(approved.length);
        setPendingCount(pending.length);
        setInstagramCount(instagram?.total || 0);
        setXCount(x?.total || 0);
      } catch {
        // Silently handle errors - counts remain at 0
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-gray-500 text-sm">Loading dashboard...</div>
      </div>
    );
  }

  const stats = [
    {
      title: 'News Published',
      value: newsCount,
      subtitle: 'Total published articles',
      icon: Newspaper,
      iconBg: 'bg-blue-50',
      iconColor: 'text-blue-600',
    },
    {
      title: 'Active Memberships',
      value: approvedCount,
      subtitle: 'Approved members',
      icon: UserCheck,
      iconBg: 'bg-green-50',
      iconColor: 'text-green-600',
    },
    {
      title: 'Pending Memberships',
      value: pendingCount,
      subtitle: 'Awaiting approval',
      icon: UserPlus,
      iconBg: 'bg-amber-50',
      iconColor: 'text-amber-600',
    },
  ];

  const socialStats = [
    {
      title: 'Instagram Posts',
      value: instagramCount,
      subtitle: 'Total posts',
      icon: Instagram,
      iconBg: 'bg-pink-50',
      iconColor: 'text-pink-600',
    },
    {
      title: 'X (Twitter) Posts',
      value: xCount,
      subtitle: 'Total posts',
      icon: Users,
      iconBg: 'bg-gray-100',
      iconColor: 'text-gray-700',
    },
  ];

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome to your Dashboard
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Here&apos;s a quick overview of your account.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.title} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-gray-500">{stat.title}</h3>
                <div className={`${stat.iconBg} p-2 rounded-lg`}>
                  <Icon size={18} className={stat.iconColor} />
                </div>
              </div>
              <div className="text-3xl font-bold text-gray-900">
                {stat.value.toString().padStart(2, '0')}
              </div>
              <p className="text-gray-400 text-xs mt-1">
                {stat.subtitle}
              </p>
            </div>
          );
        })}
      </div>

      {/* Social Media Stats */}
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Social Media</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {socialStats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.title} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-gray-500">{stat.title}</h3>
                <div className={`${stat.iconBg} p-2 rounded-lg`}>
                  <Icon size={18} className={stat.iconColor} />
                </div>
              </div>
              <div className="text-3xl font-bold text-gray-900">
                {stat.value.toString().padStart(2, '0')}
              </div>
              <p className="text-gray-400 text-xs mt-1">
                {stat.subtitle}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
