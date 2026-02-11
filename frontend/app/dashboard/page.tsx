'use client';

import { useState, useEffect } from 'react';
import { newsApi } from '@/lib/api/news';
import { membershipApi } from '@/lib/api/membership';
import { analyticsApi } from '@/lib/api/analytics';
import Image from 'next/image';

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

        const instagram = socialData.find(s => s.platform === 'INSTAGRAM');
        const x = socialData.find(s => s.platform === 'X');

        console.log('Dashboard Data:', {
          news: news.length,
          approved: approved.length,
          pending: pending.length,
          instagram: instagram?.total || 0,
          x: x?.total || 0,
        });

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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Welcome to your Dashboard
          </h1>
          <p className="text-gray-600 text-lg">
            Here&apos;s a quick overview of your account.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* News Card */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-gray-700 font-medium">News published</h3>
              <div className="bg-gray-100 p-2 rounded-lg">
                <Image 
                  src="/newsandevents.png" 
                  alt="News" 
                  width={24} 
                  height={24}
                />
              </div>
            </div>
            <div className="text-5xl font-bold text-gray-900 mb-2">
              {newsCount.toString().padStart(2, '0')}
            </div>
            <p className="text-gray-500 text-sm">
              Total published articles
            </p>
          </div>

          {/* Memberships Card */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-gray-700 font-medium">Active memberships</h3>
              <div className="bg-gray-100 p-2 rounded-lg">
                <Image 
                  src="/usermanagement.png" 
                  alt="Memberships" 
                  width={24} 
                  height={24}
                />
              </div>
            </div>
            <div className="text-5xl font-bold text-gray-900 mb-2">
              {approvedCount.toString().padStart(2, '0')}
            </div>
            <p className="text-gray-500 text-sm">
              Approved members
            </p>
          </div>

          {/* Pending Memberships Card */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-gray-700 font-medium">Pending memberships</h3>
              <div className="bg-gray-100 p-2 rounded-lg">
                <Image 
                  src="/usermanagement.png" 
                  alt="Pending" 
                  width={24} 
                  height={24}
                />
              </div>
            </div>
            <div className="text-5xl font-bold text-gray-900 mb-2">
              {pendingCount.toString().padStart(2, '0')}
            </div>
            <p className="text-gray-500 text-sm">
              Awaiting approval
            </p>
          </div>
        </div>

        {/* Social Media Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Instagram Card */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-gray-700 font-medium">Instagram Posts</h3>
              <div className="bg-gray-100 p-2 rounded-lg">
                <Image 
                  src="/socialsettings.png" 
                  alt="Instagram" 
                  width={24} 
                  height={24}
                />
              </div>
            </div>
            <div className="text-5xl font-bold text-gray-900 mb-2">
              {instagramCount.toString().padStart(2, '0')}
            </div>
            <p className="text-gray-500 text-sm">
              Total posts
            </p>
          </div>

          {/* Twitter/X Card */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-gray-700 font-medium">X (Twitter) Posts</h3>
              <div className="bg-gray-100 p-2 rounded-lg">
                <Image 
                  src="/socialsettings.png" 
                  alt="Twitter" 
                  width={24} 
                  height={24}
                />
              </div>
            </div>
            <div className="text-5xl font-bold text-gray-900 mb-2">
              {xCount.toString().padStart(2, '0')}
            </div>
            <p className="text-gray-500 text-sm">
              Total posts
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
