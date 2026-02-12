'use client';

import { useEffect, useState } from 'react';
import { socialApi, SocialPost, CreateSocialPostDto, UpdateSocialPostDto } from '@/lib/api/social';
import { Loader2, Plus, X, Pencil, Instagram, Twitter, AlertCircle, CheckCircle2, XCircle } from 'lucide-react';

export default function SocialPage() {
  const [instagramPosts, setInstagramPosts] = useState<SocialPost[]>([]);
  const [xPosts, setXPosts] = useState<SocialPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [currentPlatform, setCurrentPlatform] = useState<'INSTAGRAM' | 'X'>('INSTAGRAM');
  const [editingPost, setEditingPost] = useState<SocialPost | null>(null);
  const [previewPost, setPreviewPost] = useState<SocialPost | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [createForm, setCreateForm] = useState<CreateSocialPostDto>({
    postUrl: '',
    caption: '',
    isActive: false,
  });

  const [editForm, setEditForm] = useState<UpdateSocialPostDto>({
    postUrl: '',
    caption: '',
    isActive: false,
  });

  const fetchPosts = async () => {
    setLoading(true);
    setError(null);
    try {
      const [insta, x] = await Promise.all([
        socialApi.getInstagramAdmin(),
        socialApi.getXAdmin(),
      ]);

      setInstagramPosts(insta);
      setXPosts(x);
    } catch (err) {
      console.error(err);
      setError('Failed to load posts. Please try again.');
      setInstagramPosts([]);
      setXPosts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  // Load Twitter widgets script and reload when posts change
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://platform.twitter.com/widgets.js';
    script.async = true;
    script.charset = 'utf-8';
    document.body.appendChild(script);
    
    return () => {
      // Cleanup script on unmount
      const scripts = document.querySelectorAll('script[src="https://platform.twitter.com/widgets.js"]');
      scripts.forEach(s => s.remove());
    };
  }, []);

  // Reload Twitter widgets when posts change
  useEffect(() => {
    if ((window as any).twttr?.widgets) {
      (window as any).twttr.widgets.load();
    }
  }, [xPosts, instagramPosts]);

  const getActivePosts = (platform: 'INSTAGRAM' | 'X') => {
    const posts = platform === 'INSTAGRAM' ? instagramPosts : xPosts;
    return posts.filter(p => p.isActive);
  };

  const canActivate = (platform: 'INSTAGRAM' | 'X', currentPostId?: string) => {
    const activePosts = getActivePosts(platform);
    // If editing a post that's already active, we can keep it active
    if (currentPostId && activePosts.some(p => p.id === currentPostId)) {
      return true;
    }
    return activePosts.length < 3;
  };

  const toggleActive = async (post: SocialPost) => {
    // Check if we can activate
    if (!post.isActive && !canActivate(post.platform, post.id)) {
      setError(`Cannot activate. Maximum 3 active ${post.platform === 'INSTAGRAM' ? 'Instagram' : 'X'} posts allowed.`);
      setTimeout(() => setError(null), 5000);
      return;
    }

    try {
      if (post.platform === 'INSTAGRAM') {
        await socialApi.toggleInstagramActive(post.id, !post.isActive);
      } else {
        await socialApi.toggleXActive(post.id, !post.isActive);
      }
      await fetchPosts();
    } catch (error: any) {
      setError(error?.response?.data?.message || 'Failed to toggle status');
      setTimeout(() => setError(null), 5000);
    }
  };

  const handleCreate = async () => {
    if (!createForm.postUrl.trim()) {
      setError('Post URL is required');
      setTimeout(() => setError(null), 3000);
      return;
    }

    // Check active post limit if trying to create as active
    if (createForm.isActive && !canActivate(currentPlatform)) {
      setError(`Cannot create as active. Maximum 3 active ${currentPlatform === 'INSTAGRAM' ? 'Instagram' : 'X'} posts allowed.`);
      setTimeout(() => setError(null), 5000);
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      if (currentPlatform === 'INSTAGRAM') {
        await socialApi.createInstagram(createForm);
      } else {
        await socialApi.createX(createForm);
      }
      
      setShowCreateModal(false);
      setCreateForm({ postUrl: '', caption: '', isActive: false });
      await fetchPosts();
    } catch (error: any) {
      setError(error?.response?.data?.message || 'Failed to create post');
      setTimeout(() => setError(null), 5000);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async () => {
    if (!editingPost) return;

    if (!editForm.postUrl?.trim()) {
      setError('Post URL is required');
      setTimeout(() => setError(null), 3000);
      return;
    }

    // Check active post limit if trying to activate
    if (editForm.isActive && !editingPost.isActive && !canActivate(editingPost.platform, editingPost.id)) {
      setError(`Cannot activate. Maximum 3 active ${editingPost.platform === 'INSTAGRAM' ? 'Instagram' : 'X'} posts allowed.`);
      setTimeout(() => setError(null), 5000);
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      if (editingPost.platform === 'INSTAGRAM') {
        await socialApi.updateInstagram(editingPost.id, editForm);
      } else {
        await socialApi.updateX(editingPost.id, editForm);
      }
      
      setShowEditModal(false);
      setEditingPost(null);
      await fetchPosts();
    } catch (error: any) {
      setError(error?.response?.data?.message || 'Failed to update post');
      setTimeout(() => setError(null), 5000);
    } finally {
      setSubmitting(false);
    }
  };

  const openCreateModal = (platform: 'INSTAGRAM' | 'X') => {
    setCurrentPlatform(platform);
    setCreateForm({ postUrl: '', caption: '', isActive: false });
    setShowCreateModal(true);
  };

  const openEditModal = (post: SocialPost) => {
    setEditingPost(post);
    setEditForm({
      postUrl: post.postUrl,
      caption: post.caption || '',
      isActive: post.isActive,
    });
    setShowEditModal(true);
  };

  const openPreviewModal = (post: SocialPost) => {
    setPreviewPost(post);
    setShowPreviewModal(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-gray-900 animate-spin" />
          <div className="text-gray-600 text-sm">Loading social posts...</div>
        </div>
      </div>
    );
  }

  const PostCard = ({ post }: { post: SocialPost }) => {
    // Reload Twitter widgets when posts change
    useEffect(() => {
      if (post.platform === 'X' && (window as any).twttr?.widgets) {
        (window as any).twttr.widgets.load();
      }
    }, [post]);

    return (
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
        {/* Preview Area - Show actual post */}
        <div className="relative bg-gray-50 border-b border-gray-200" style={{ minHeight: '400px' }}>
          {post.platform === 'INSTAGRAM' ? (
            <iframe
              src={`${post.postUrl}embed`}
              width="100%"
              height="500"
              frameBorder="0"
              scrolling="no"
              allowTransparency
              className="w-full"
            />
          ) : (
            <div className="p-4">
              <blockquote className="twitter-tweet" data-theme="light">
                <a href={post.postUrl}></a>
              </blockquote>
            </div>
          )}
          
          {/* Status Badge - Overlay on preview */}
          <div className="absolute top-3 right-3">
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium backdrop-blur-sm ${
                post.isActive
                  ? 'bg-green-100/90 text-green-700 border border-green-200'
                  : 'bg-gray-100/90 text-gray-600 border border-gray-200'
              }`}
            >
              {post.isActive ? (
                <CheckCircle2 className="w-3 h-3" />
              ) : (
                <XCircle className="w-3 h-3" />
              )}
              {post.isActive ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-3">
          {/* Caption */}
          {post.caption && (
            <div>
              <p className="text-sm text-gray-700 line-clamp-2">
                {post.caption}
              </p>
            </div>
          )}

          {/* URL */}
          <div>
            <a 
              href={post.postUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-600 hover:underline truncate block"
            >
              {post.postUrl}
            </a>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 pt-2">
            <button
              onClick={() => openEditModal(post)}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <Pencil className="w-4 h-4" />
              Edit
            </button>
            <button
              onClick={() => toggleActive(post)}
              className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                post.isActive
                  ? 'text-red-700 bg-red-50 hover:bg-red-100 border border-red-200'
                  : 'text-green-700 bg-green-50 hover:bg-green-100 border border-green-200'
              }`}
            >
              {post.isActive ? 'Deactivate' : 'Activate'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Social Media</h1>
          <p className="text-gray-600">Manage your Instagram and X (Twitter) posts. Maximum 3 active posts per platform.</p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-red-800">{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-red-600 hover:text-red-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Instagram Section */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Instagram className="w-6 h-6 text-gray-900" />
              <h2 className="text-2xl font-bold text-gray-900">Instagram Posts</h2>
              <span className="px-2.5 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-full">
                {getActivePosts('INSTAGRAM').length}/3 Active
              </span>
            </div>
            <button
              onClick={() => openCreateModal('INSTAGRAM')}
              className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-all font-medium text-sm"
            >
              <Plus className="w-4 h-4" />
              Add Instagram Post
            </button>
          </div>

          {instagramPosts.length === 0 ? (
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-12 text-center">
              <Instagram className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">No Instagram posts yet</p>
              <button
                onClick={() => openCreateModal('INSTAGRAM')}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-all font-medium text-sm"
              >
                <Plus className="w-4 h-4" />
                Add Your First Post
              </button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {instagramPosts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          )}
        </section>

        {/* X (Twitter) Section */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Twitter className="w-6 h-6 text-gray-900" />
              <h2 className="text-2xl font-bold text-gray-900">X (Twitter) Posts</h2>
              <span className="px-2.5 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-full">
                {getActivePosts('X').length}/3 Active
              </span>
            </div>
            <button
              onClick={() => openCreateModal('X')}
              className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-all font-medium text-sm"
            >
              <Plus className="w-4 h-4" />
              Add X Post
            </button>
          </div>

          {xPosts.length === 0 ? (
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-12 text-center">
              <Twitter className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">No X posts yet</p>
              <button
                onClick={() => openCreateModal('X')}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-all font-medium text-sm"
              >
                <Plus className="w-4 h-4" />
                Add Your First Post
              </button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {xPosts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Create Post Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl border border-gray-200 shadow-2xl max-w-lg w-full">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {currentPlatform === 'INSTAGRAM' ? (
                  <Instagram className="w-6 h-6 text-gray-900" />
                ) : (
                  <Twitter className="w-6 h-6 text-gray-900" />
                )}
                <h2 className="text-2xl font-bold text-gray-900">
                  Add {currentPlatform === 'INSTAGRAM' ? 'Instagram' : 'X'} Post
                </h2>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Post URL <span className="text-red-500">*</span>
                </label>
                <input
                  type="url"
                  value={createForm.postUrl}
                  onChange={(e) => setCreateForm({ ...createForm, postUrl: e.target.value })}
                  className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent placeholder:text-gray-400 text-gray-900 transition-all"
                  placeholder={currentPlatform === 'INSTAGRAM' ? 'https://www.instagram.com/p/...' : 'https://twitter.com/user/status/...'}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Caption (Optional)
                </label>
                <textarea
                  value={createForm.caption}
                  onChange={(e) => setCreateForm({ ...createForm, caption: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent placeholder:text-gray-400 text-gray-900 transition-all resize-none"
                  placeholder="Add a caption for this post..."
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="create-active"
                    checked={createForm.isActive}
                    onChange={(e) => setCreateForm({ ...createForm, isActive: e.target.checked })}
                    className="w-4 h-4 bg-white border-gray-300 rounded text-gray-900 focus:ring-2 focus:ring-gray-900 focus:ring-offset-0"
                    disabled={!canActivate(currentPlatform)}
                  />
                  <label htmlFor="create-active" className="text-sm font-medium text-gray-700 cursor-pointer">
                    Set as Active
                  </label>
                </div>
                
                {!canActivate(currentPlatform) && (
                  <span className="text-xs text-red-600">Max 3 active posts reached</span>
                )}
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-5 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-all text-sm font-medium"
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={submitting || !createForm.postUrl.trim()}
                className="px-5 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-all disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed text-sm font-medium"
              >
                {submitting ? 'Creating...' : 'Create Post'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Post Modal */}
      {showEditModal && editingPost && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl border border-gray-200 shadow-2xl max-w-lg w-full">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {editingPost.platform === 'INSTAGRAM' ? (
                  <Instagram className="w-6 h-6 text-gray-900" />
                ) : (
                  <Twitter className="w-6 h-6 text-gray-900" />
                )}
                <h2 className="text-2xl font-bold text-gray-900">Edit Post</h2>
              </div>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Post URL <span className="text-red-500">*</span>
                </label>
                <input
                  type="url"
                  value={editForm.postUrl}
                  onChange={(e) => setEditForm({ ...editForm, postUrl: e.target.value })}
                  className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent placeholder:text-gray-400 text-gray-900 transition-all"
                  placeholder="https://..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Caption (Optional)
                </label>
                <textarea
                  value={editForm.caption}
                  onChange={(e) => setEditForm({ ...editForm, caption: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent placeholder:text-gray-400 text-gray-900 transition-all resize-none"
                  placeholder="Add a caption for this post..."
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="edit-active"
                    checked={editForm.isActive}
                    onChange={(e) => setEditForm({ ...editForm, isActive: e.target.checked })}
                    className="w-4 h-4 bg-white border-gray-300 rounded text-gray-900 focus:ring-2 focus:ring-gray-900 focus:ring-offset-0"
                    disabled={!editForm.isActive && !canActivate(editingPost.platform, editingPost.id)}
                  />
                  <label htmlFor="edit-active" className="text-sm font-medium text-gray-700 cursor-pointer">
                    Active
                  </label>
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditForm(prev => ({ ...prev, isActive: false }))}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                      !editForm.isActive
                        ? 'text-gray-700 bg-gray-100 border border-gray-300'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Inactive
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (canActivate(editingPost.platform, editingPost.id)) {
                        setEditForm(prev => ({ ...prev, isActive: true }));
                      }
                    }}
                    disabled={!canActivate(editingPost.platform, editingPost.id)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                      editForm.isActive
                        ? 'text-green-700 bg-green-50 border border-green-200'
                        : 'text-gray-500 hover:text-green-700 hover:bg-green-50 disabled:opacity-50 disabled:cursor-not-allowed'
                    }`}
                  >
                    Active
                  </button>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-5 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-all text-sm font-medium"
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                onClick={handleUpdate}
                disabled={submitting || !editForm.postUrl?.trim()}
                className="px-5 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-all disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed text-sm font-medium"
              >
                {submitting ? 'Updating...' : 'Update Post'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {showPreviewModal && previewPost && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl border border-gray-200 shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white p-6 border-b border-gray-200 flex items-center justify-between z-10">
              <h2 className="text-2xl font-bold text-gray-900">Post Preview</h2>
              <button
                onClick={() => {
                  setShowPreviewModal(false);
                  setPreviewPost(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            <div className="p-6">
              {/* Embed */}
              <div className="rounded-lg overflow-hidden border border-gray-200 mb-6">
                {previewPost.platform === 'INSTAGRAM' ? (
                  <iframe
                    src={`${previewPost.postUrl}embed`}
                    width="100%"
                    height="600"
                    frameBorder="0"
                    allowFullScreen
                  />
                ) : (
                  <blockquote className="twitter-tweet">
                    <a href={previewPost.postUrl}></a>
                  </blockquote>
                )}
              </div>

              {/* Info */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Platform</label>
                  <div className="flex items-center gap-2">
                    {previewPost.platform === 'INSTAGRAM' ? (
                      <>
                        <Instagram className="w-5 h-5" />
                        <span className="font-medium">Instagram</span>
                      </>
                    ) : (
                      <>
                        <Twitter className="w-5 h-5" />
                        <span className="font-medium">X (Twitter)</span>
                      </>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Post URL</label>
                  <a 
                    href={previewPost.postUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline break-all"
                  >
                    {previewPost.postUrl}
                  </a>
                </div>

                {previewPost.caption && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Caption</label>
                    <p className="text-sm text-gray-900">{previewPost.caption}</p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Status</label>
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium ${
                      previewPost.isActive
                        ? 'bg-green-100 text-green-700 border border-green-200'
                        : 'bg-gray-100 text-gray-600 border border-gray-200'
                    }`}
                  >
                    {previewPost.isActive ? (
                      <CheckCircle2 className="w-3 h-3" />
                    ) : (
                      <XCircle className="w-3 h-3" />
                    )}
                    {previewPost.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}