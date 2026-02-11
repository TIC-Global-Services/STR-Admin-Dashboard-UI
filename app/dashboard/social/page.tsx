'use client';

import { useState, useEffect } from 'react';
import { socialApi, SocialPost } from '@/lib/api/social';
import { supabaseSocialApi, SupabaseSocialPost } from '@/lib/supabase/social';
import Image from 'next/image';

interface MergedPost extends SocialPost {
  supabaseId?: string; // The ID from Supabase to use for updates
}

export default function SocialPage() {
  const [instagramPosts, setInstagramPosts] = useState<MergedPost[]>([]);
  const [xPosts, setXPosts] = useState<MergedPost[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      // Fetch from both Supabase and external API
      const [supabasePosts, externalInstagram, externalX] = await Promise.all([
        supabaseSocialApi.getAllPosts(),
        socialApi.getInstagramAdmin(),
        socialApi.getXAdmin(),
      ]);

      // Match external posts with Supabase posts by URL and merge
      const mergeWithSupabase = (externalPosts: SocialPost[], platform: 'INSTAGRAM' | 'X'): MergedPost[] => {
        return externalPosts.map((externalPost) => {
          // Find matching Supabase post by URL
          const supabaseMatch = supabasePosts.find(
            (sp) => sp.postUrl === externalPost.postUrl && sp.platform === platform
          );

          return {
            ...externalPost,
            supabaseId: supabaseMatch?.id, // Store Supabase ID for updates
          };
        });
      };

      setInstagramPosts(mergeWithSupabase(externalInstagram, 'INSTAGRAM'));
      setXPosts(mergeWithSupabase(externalX, 'X'));
    } catch (error) {
      console.error('Error fetching posts:', error);
      setInstagramPosts([]);
      setXPosts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const toggleActive = async (post: MergedPost, platform: 'INSTAGRAM' | 'X') => {
    // Use Supabase ID if available, otherwise use the post's own ID
    const idToUse = post.supabaseId || post.id;

    try {
      // Call external API directly
      const externalApiUrl = 'https://str-admin.vercel.app/api/v1';
      const endpoint = platform === 'INSTAGRAM' 
        ? `${externalApiUrl}/admin/social-posts/${idToUse}/instagram`
        : `${externalApiUrl}/admin/social-posts/${idToUse}/x`;

      // Get token from localStorage (set during login)
      const token = localStorage.getItem('accessToken');
      
      if (!token) {
        alert('Please login first');
        return;
      }

      const response = await fetch(endpoint, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ isActive: !post.isActive }),
      });

      if (!response.ok) {
        throw new Error(`Failed to update: ${response.status}`);
      }

      // Refresh posts after successful update
      fetchPosts();
    } catch (error) {
      console.error('Failed to toggle status:', error);
      alert('Failed to toggle status. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading social posts...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-4xl font-bold text-gray-900">Social Settings</h1>
        </div>

        {/* Instagram Posts Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <span>📷</span> Instagram Posts
            </h2>
          </div>
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Post URL</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Caption</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Status</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {instagramPosts && instagramPosts.length > 0 ? (
                instagramPosts.map((post) => (
                  <tr key={post.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-blue-600 hover:underline">
                      <a href={post.postUrl} target="_blank" rel="noopener noreferrer">
                        {post.postUrl.length > 50 ? `${post.postUrl.substring(0, 50)}...` : post.postUrl}
                      </a>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {post.caption ? (
                        post.caption.length > 60 ? `${post.caption.substring(0, 60)}...` : post.caption
                      ) : (
                        <span className="text-gray-400 italic">No caption</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => toggleActive(post, 'INSTAGRAM')}
                        className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium transition-colors cursor-pointer ${
                          post.isActive
                            ? 'text-green-700 bg-green-50 hover:bg-green-100'
                            : 'text-gray-700 bg-gray-100 hover:bg-gray-200'
                        }`}
                      >
                        <span
                          className={`w-2 h-2 rounded-full ${
                            post.isActive ? 'bg-green-500' : 'bg-gray-400'
                          }`}
                        />
                        {post.isActive ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                          <Image src="/view.png" alt="View" width={20} height={20} />
                        </button>
                        <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                          <Image src="/edit.png" alt="Edit" width={20} height={20} />
                        </button>
                        <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                          <Image src="/delete.png" alt="Delete" width={20} height={20} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                    No Instagram posts found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* X (Twitter) Posts Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <span>𝕏</span> X (Twitter) Posts
            </h2>
          </div>
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Post URL</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Caption</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Status</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {xPosts && xPosts.length > 0 ? (
                xPosts.map((post) => (
                  <tr key={post.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-blue-600 hover:underline">
                      <a href={post.postUrl} target="_blank" rel="noopener noreferrer">
                        {post.postUrl.length > 50 ? `${post.postUrl.substring(0, 50)}...` : post.postUrl}
                      </a>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {post.caption ? (
                        post.caption.length > 60 ? `${post.caption.substring(0, 60)}...` : post.caption
                      ) : (
                        <span className="text-gray-400 italic">No caption</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => toggleActive(post, 'X')}
                        className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium transition-colors cursor-pointer ${
                          post.isActive
                            ? 'text-green-700 bg-green-50 hover:bg-green-100'
                            : 'text-gray-700 bg-gray-100 hover:bg-gray-200'
                        }`}
                      >
                        <span
                          className={`w-2 h-2 rounded-full ${
                            post.isActive ? 'bg-green-500' : 'bg-gray-400'
                          }`}
                        />
                        {post.isActive ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                          <Image src="/view.png" alt="View" width={20} height={20} />
                        </button>
                        <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                          <Image src="/edit.png" alt="Edit" width={20} height={20} />
                        </button>
                        <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                          <Image src="/delete.png" alt="Delete" width={20} height={20} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                    No X (Twitter) posts found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
