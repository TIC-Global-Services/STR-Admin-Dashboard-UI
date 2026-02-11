'use client';

import { useState, useEffect } from 'react';
import { newsApi, News } from '@/lib/api/news';
import Image from 'next/image';

export default function NewsPage() {
  const [news, setNews] = useState<News[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [editingNews, setEditingNews] = useState<News | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    summary: '',
    content: '',
    coverImage: '',
    isPublished: false,
  });

  const [editFormData, setEditFormData] = useState({
    title: '',
    slug: '',
    summary: '',
    content: '',
    coverImage: '',
    isPublished: false,
  });

  const fetchNews = async () => {
    setLoading(true);
    try {
      console.log('Fetching news...');
      const data = await newsApi.getAll();
      console.log('News data received:', data);
      setNews(data);
    } catch (error) {
      console.error('Error fetching news:', error);
      setNews([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Check if user is authenticated before fetching
    const token = localStorage.getItem('accessToken');
    if (token) {
      fetchNews();
    } else {
      console.error('No access token found');
      setLoading(false);
    }
  }, []);

  const togglePublish = async (id: string, currentStatus: boolean) => {
    try {
      if (currentStatus) {
        await newsApi.unpublish(id);
      } else {
        await newsApi.publish(id);
      }
      fetchNews();
    } catch (error) {
      console.error('Failed to toggle publish status:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleCreate = async () => {
    setCreating(true);
    try {
      await newsApi.create({
        title: formData.title,
        summary: formData.summary,
        content: formData.content,
        coverImage: formData.coverImage || undefined,
      });
      
      // Reset form and close modal
      setFormData({
        title: '',
        slug: '',
        summary: '',
        content: '',
        coverImage: '',
        isPublished: false,
      });
      setShowModal(false);
      
      // Refresh news list
      fetchNews();
    } catch (error) {
      console.error('Failed to create news:', error);
      alert('Failed to create news. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  const handleEdit = (item: News) => {
    setEditingNews(item);
    setEditFormData({
      title: item.title || '',
      slug: item.slug || '',
      summary: item.summary || '',
      content: item.content || '',
      coverImage: item.coverImage || '',
      isPublished: item.isPublished || false,
    });
    setShowEditModal(true);
  };

  const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleUpdate = async () => {
    if (!editingNews) return;
    
    setUpdating(true);
    try {
      await newsApi.update(editingNews.id, {
        title: editFormData.title,
        summary: editFormData.summary,
        content: editFormData.content,
        coverImage: editFormData.coverImage || undefined,
        isPublished: editFormData.isPublished,
      });
      
      // Close modal and refresh
      setShowEditModal(false);
      setEditingNews(null);
      fetchNews();
    } catch (error) {
      console.error('Failed to update news:', error);
      alert('Failed to update news. Please try again.');
    } finally {
      setUpdating(false);
    }
  };

  const insertFormatting = (tag: string) => {
    const textarea = document.getElementById('edit-content') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = editFormData.content.substring(start, end);
    
    let formattedText = '';
    switch (tag) {
      case 'bold':
        formattedText = `**${selectedText}**`;
        break;
      case 'italic':
        formattedText = `*${selectedText}*`;
        break;
      case 'h1':
        formattedText = `# ${selectedText}`;
        break;
      case 'h2':
        formattedText = `## ${selectedText}`;
        break;
      case 'h3':
        formattedText = `### ${selectedText}`;
        break;
      case 'link':
        formattedText = `[${selectedText}](url)`;
        break;
      case 'list':
        formattedText = `- ${selectedText}`;
        break;
      default:
        formattedText = selectedText;
    }

    const newContent = 
      editFormData.content.substring(0, start) + 
      formattedText + 
      editFormData.content.substring(end);
    
    setEditFormData(prev => ({ ...prev, content: newContent }));
    
    // Restore focus and selection
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start, start + formattedText.length);
    }, 0);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading news...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold text-gray-900">News and Events</h1>
          <div className="flex items-center gap-4">
            <button 
              onClick={fetchNews}
              className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              🔄 Refresh
            </button>
            <button 
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 px-6 py-3 bg-white border-2 border-green-500 text-green-600 rounded-full hover:bg-green-50 transition-colors"
            >
              <span className="text-xl">+</span>
              <span className="font-medium">ADD NEW</span>
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">ID</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Title</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Published Status</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {news && news.length > 0 ? (
                news.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-600 font-mono">
                      {item.id.slice(0, 8)}...
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {item.title}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => togglePublish(item.id, item.isPublished || false)}
                        className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium transition-colors cursor-pointer ${
                          item.isPublished
                            ? 'text-green-700 bg-green-50 hover:bg-green-100'
                            : 'text-gray-700 bg-gray-100 hover:bg-gray-200'
                        }`}
                      >
                        <span
                          className={`w-2 h-2 rounded-full ${
                            item.isPublished ? 'bg-green-500' : 'bg-gray-400'
                          }`}
                        />
                        {item.isPublished ? 'Published' : 'Draft'}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                          <Image src="/view.png" alt="View" width={20} height={20} />
                        </button>
                        <button 
                          onClick={() => handleEdit(item)}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
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
                    No news found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create News Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">Create New Article</h2>
            </div>
            
            <div className="p-6 space-y-4">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-700 text-gray-900"
                  placeholder="Enter article title"
                  required
                />
              </div>

              {/* Slug */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Slug
                </label>
                <input
                  type="text"
                  name="slug"
                  value={formData.slug}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-700 text-gray-900"
                  placeholder="article-url-slug (auto-generated if empty)"
                />
              </div>

              {/* Summary */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Summary
                </label>
                <textarea
                  name="summary"
                  value={formData.summary}
                  onChange={handleInputChange}
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-700 text-gray-900"
                  placeholder="Brief summary of the article"
                />
              </div>

              {/* Content */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Content <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="content"
                  value={formData.content}
                  onChange={handleInputChange}
                  rows={6}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-700 text-gray-900"
                  placeholder="Full article content"
                  required
                />
              </div>

              {/* Cover Image */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cover Image URL
                </label>
                <input
                  type="text"
                  name="coverImage"
                  value={formData.coverImage}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-700 text-gray-900"
                  placeholder="https://example.com/image.jpg"
                />
              </div>

              {/* Is Published */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="isPublished"
                  checked={formData.isPublished}
                  onChange={handleInputChange}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label className="text-sm font-medium text-gray-700">
                  Publish immediately
                </label>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                disabled={creating}
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={creating || !formData.title || !formData.content}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {creating ? 'Creating...' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit News Modal */}
      {showEditModal && editingNews && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">Edit Article</h2>
            </div>
            
            <div className="p-6 space-y-4">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="title"
                  value={editFormData.title}
                  onChange={handleEditInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-700 text-gray-900"
                  placeholder="Enter article title"
                  required
                />
              </div>

              {/* Slug */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Slug
                </label>
                <input
                  type="text"
                  name="slug"
                  value={editFormData.slug}
                  onChange={handleEditInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-700 text-gray-900"
                  placeholder="article-url-slug"
                />
              </div>

              {/* Summary */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Summary
                </label>
                <textarea
                  name="summary"
                  value={editFormData.summary}
                  onChange={handleEditInputChange}
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-700 text-gray-900"
                  placeholder="Brief summary of the article"
                />
              </div>

              {/* Content with Rich Text Toolbar */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Content <span className="text-red-500">*</span>
                </label>
                
                {/* Formatting Toolbar */}
                <div className="flex items-center gap-1 p-2 bg-gray-50 border border-gray-300 rounded-t-lg">
                  <button
                    type="button"
                    onClick={() => insertFormatting('bold')}
                    className="px-3 py-1 text-sm font-bold hover:bg-gray-200 rounded transition-colors text-gray-900"
                    title="Bold"
                  >
                    B
                  </button>
                  <button
                    type="button"
                    onClick={() => insertFormatting('italic')}
                    className="px-3 py-1 text-sm italic hover:bg-gray-200 rounded transition-colors text-gray-900"
                    title="Italic"
                  >
                    I
                  </button>
                  <div className="w-px h-6 bg-gray-300 mx-1" />
                  <button
                    type="button"
                    onClick={() => insertFormatting('h1')}
                    className="px-3 py-1 text-sm font-bold hover:bg-gray-200 rounded transition-colors text-gray-900"
                    title="Heading 1"
                  >
                    H1
                  </button>
                  <button
                    type="button"
                    onClick={() => insertFormatting('h2')}
                    className="px-3 py-1 text-sm font-bold hover:bg-gray-200 rounded transition-colors text-gray-900"
                    title="Heading 2"
                  >
                    H2
                  </button>
                  <button
                    type="button"
                    onClick={() => insertFormatting('h3')}
                    className="px-3 py-1 text-sm font-bold hover:bg-gray-200 rounded transition-colors text-gray-900"
                    title="Heading 3"
                  >
                    H3
                  </button>
                  <div className="w-px h-6 bg-gray-300 mx-1" />
                  <button
                    type="button"
                    onClick={() => insertFormatting('link')}
                    className="px-3 py-1 text-sm hover:bg-gray-200 rounded transition-colors text-gray-900"
                    title="Link"
                  >
                    🔗
                  </button>
                  <button
                    type="button"
                    onClick={() => insertFormatting('list')}
                    className="px-3 py-1 text-sm hover:bg-gray-200 rounded transition-colors text-gray-900"
                    title="List"
                  >
                    •
                  </button>
                </div>
                
                <textarea
                  id="edit-content"
                  name="content"
                  value={editFormData.content}
                  onChange={handleEditInputChange}
                  rows={12}
                  className="w-full px-4 py-2 border border-gray-300 rounded-b-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm placeholder:text-gray-700 text-gray-900"
                  placeholder="Full article content (supports Markdown formatting)"
                  required
                />
                <p className="mt-1 text-xs text-gray-500">
                  Tip: Select text and use toolbar buttons to format. Supports Markdown syntax.
                </p>
              </div>

              {/* Cover Image */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cover Image URL
                </label>
                <input
                  type="text"
                  name="coverImage"
                  value={editFormData.coverImage}
                  onChange={handleEditInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-700 text-gray-900"
                  placeholder="https://example.com/image.jpg"
                />
              </div>

              {/* Is Published */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="isPublished"
                  checked={editFormData.isPublished}
                  onChange={handleEditInputChange}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label className="text-sm font-medium text-gray-700">
                  Published
                </label>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex items-center justify-end gap-3">
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingNews(null);
                }}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                disabled={updating}
              >
                Cancel
              </button>
              <button
                onClick={handleUpdate}
                disabled={updating || !editFormData.title || !editFormData.content}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {updating ? 'Updating...' : 'Update'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
