'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Newspaper, 
  Users, 
  UserCheck, 
  UserPlus, 
  Instagram, 
  Twitter, 
  FileText, 
  CheckSquare, 
  RefreshCw,
  AlertCircle 
} from 'lucide-react';
import { newsApi } from '@/lib/api/news';
import { membershipApi } from '@/lib/api/membership';
import { analyticsApi } from '@/lib/api/analytics';

export default function DashboardPage() {
  const [newsCount, setNewsCount] = useState(0);
  const [approvedCount, setApprovedCount] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [instagramCount, setInstagramCount] = useState(0);
  const [xCount, setXCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setError(null);
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
      } catch (err) {
        console.error(err);
        setError("Failed to load some dashboard data. Showing available information.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Quick action links
  const quickLinks = [
    {
      title: "View All Members",
      href: "/dashboard/membership",
      icon: Users,
      color: "text-blue-600",
      bg: "bg-blue-50 hover:bg-blue-100"
    },
    {
      title: "Approve Pending",
      href: "/dashboard/membership",
      icon: CheckSquare,
      color: "text-green-600",
      bg: "bg-green-50 hover:bg-green-100"
    },
    {
      title: "Create News Article",
      href: "/dashboard/news",
      icon: FileText,
      color: "text-indigo-600",
      bg: "bg-indigo-50 hover:bg-indigo-100"
    },
    {
      title: "Manage Instagram",
      href: "/dashboard/social",
      icon: Instagram,
      color: "text-pink-600",
      bg: "bg-pink-50 hover:bg-pink-100"
    },
    {
      title: "Manage X (Twitter)",
      href: "/dashboard/social",
      icon: Twitter,
      color: "text-gray-700",
      bg: "bg-gray-100 hover:bg-gray-200"
    },
    {
      title: "Refresh Dashboard",
      href: "#",
      icon: RefreshCw,
      color: "text-cyan-600",
      bg: "bg-cyan-50 hover:bg-cyan-100",
      onClick: (e: React.MouseEvent) => {
        e.preventDefault();
        window.location.reload();
      }
    }
  ];

  if (loading) {
    return (
      <div className="p-6 lg:p-8">
        <div className="animate-pulse space-y-8">
          <div className="h-8 w-64 bg-gray-200 rounded"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl p-6  border border-gray-100 h-40"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const stats = [
    {
      title: 'Published News',
      value: newsCount,
      subtitle: 'Total articles live',
      icon: Newspaper,
      iconBg: 'bg-blue-50',
      iconColor: 'text-blue-600',
    },
    {
      title: 'Approved Members',
      value: approvedCount,
      subtitle: 'Active memberships',
      icon: UserCheck,
      iconBg: 'bg-green-50',
      iconColor: 'text-green-600',
    },
    {
      title: 'Pending Approvals',
      value: pendingCount,
      subtitle: 'Awaiting review',
      icon: UserPlus,
      iconBg: 'bg-amber-50',
      iconColor: 'text-amber-600',
    },
  ];

  const socialStats = [
    {
      title: 'Instagram Reach',
      value: instagramCount,
      subtitle: 'Total posts',
      icon: Instagram,
      iconBg: 'bg-pink-50',
      iconColor: 'text-pink-600',
    },
    {
      title: 'X (Twitter) Activity',
      value: xCount,
      subtitle: 'Total posts',
      icon: Twitter,
      iconBg: 'bg-gray-100',
      iconColor: 'text-gray-700',
    },
  ];

  return (
    <div className="p-6 lg:p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
            Dashboard
          </h1>
          <p className="text-gray-600 mt-1">
            Quick overview of your platform activity
          </p>
        </div>

        {error && (
          <div className="flex items-center gap-2 text-amber-600 bg-amber-50 px-4 py-2 rounded-lg text-sm">
            <AlertCircle size={18} />
            {error}
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div 
              key={stat.title} 
              className="bg-white rounded-xl p-6  border border-gray-200 hover:shadow-md transition-shadow duration-200"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-gray-600">{stat.title}</h3>
                <div className={`${stat.iconBg} p-3 rounded-xl`}>
                  <Icon size={24} className={stat.iconColor} />
                </div>
              </div>
              <div className="text-4xl font-bold text-gray-900 mb-1">
                {stat.value.toString().padStart(2, '0')}
              </div>
              <p className="text-gray-500 text-sm">{stat.subtitle}</p>
            </div>
          );
        })}
      </div>

      {/* Social Stats */}
      <div className="bg-white rounded-xl p-6  border border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-3">
          <Instagram className="text-pink-600" size={24} />
          Social Media Overview
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {socialStats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div 
                key={stat.title} 
                className="flex items-center gap-5 p-5 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className={`${stat.iconBg} p-4 rounded-xl`}>
                  <Icon size={28} className={stat.iconColor} />
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-gray-900">{stat.value.toString().padStart(2, '0')}</h4>
                  <p className="text-gray-600">{stat.title}</p>
                  <p className="text-sm text-gray-500 mt-1">{stat.subtitle}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick Links */}
      <div className="bg-white rounded-xl p-6  border border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {quickLinks.map((link) => (
            <Link
              key={link.title}
              href={link.href}
              onClick={link.onClick}
              className={`flex items-center gap-4 p-5 rounded-xl border border-gray-200 transition-all duration-200 ${link.bg} hover: group`}
            >
              <div className={`p-3 rounded-lg ${link.bg}`}>
                <link.icon size={24} className={link.color} />
              </div>
              <div>
                <h4 className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                  {link.title}
                </h4>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

// Quick links configuration
const quickLinks = [
  {
    title: "View All Members",
    href: "/dashboard/memberships",
    icon: Users,
    color: "text-blue-600",
    bg: "bg-blue-50"
  },
  {
    title: "Pending Approvals",
    href: "/dashboard/memberships",
    icon: CheckSquare,
    color: "text-green-600",
    bg: "bg-green-50"
  },
  {
    title: "Create New Article",
    href: "/dashboard/news",
    icon: FileText,
    color: "text-indigo-600",
    bg: "bg-indigo-50"
  },
  {
    title: "Instagram Management",
    href: "/dashboard/social",
    icon: Instagram,
    color: "text-pink-600",
    bg: "bg-pink-50"
  },
  {
    title: "X / Twitter Management",
    href: "/dashboard/social",
    icon: Twitter,
    color: "text-gray-700",
    bg: "bg-gray-100"
  },
  {
    title: "Refresh Dashboard",
    href: "#",
    icon: RefreshCw,
    color: "text-cyan-600",
    bg: "bg-cyan-50",
    onClick: (e: React.MouseEvent) => {
      e.preventDefault();
      window.location.reload();
    }
  }
];