'use client';
import { useState, useEffect } from 'react';
import { newsApi, News } from '@/lib/api/news';
import Image from 'next/image';
import { FiSearch } from "react-icons/fi";


export default function NewsPage() {
  const [news, setNews] = useState<News[]>([]);
  const [filteredNews, setFilteredNews] = useState<News[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewNews, setPreviewNews] = useState<News | null>(null);
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [editingNews, setEditingNews] = useState<News | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'published' | 'draft'>('all');
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

  // Filter and search effect
  useEffect(() => {
    let filtered = [...news];

    // Apply status filter
    if (filterStatus === 'published') {
      filtered = filtered.filter(item => item.isPublished);
    } else if (filterStatus === 'draft') {
      filtered = filtered.filter(item => !item.isPublished);
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(item => 
        item.title.toLowerCase().includes(query) ||
        (item.summary && item.summary.toLowerCase().includes(query)) ||
        (item.content && item.content.toLowerCase().includes(query))
      );
    }

    setFilteredNews(filtered);
  }, [news, searchQuery, filterStatus]);

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

  const handleEdit = async (item: News) => {
    try {
      setShowEditModal(true);
      setEditingNews(item);
      
      // Show loading state in form
      setEditFormData({
        title: '',
        slug: '',
        summary: '',
        content: '',
        coverImage: '',
        isPublished: false,
      });
      
      // Fetch full news data from API
      const fullNewsData = await newsApi.getById(item.id);
      
      if (fullNewsData) {
        setEditingNews(fullNewsData);
        setEditFormData({
          title: fullNewsData.title || '',
          slug: fullNewsData.slug || '',
          summary: fullNewsData.summary || '',
          content: fullNewsData.content || '',
          coverImage: fullNewsData.coverImage || '',
          isPublished: fullNewsData.isPublished || false,
        });
      } else {
        alert('Failed to load news data');
        setShowEditModal(false);
        setEditingNews(null);
      }
    } catch (error) {
      console.error('Error fetching news data:', error);
      alert('Failed to load news data');
      setShowEditModal(false);
      setEditingNews(null);
    }
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

  const handlePreview = async (item: News) => {
    try {
      setShowPreviewModal(true);
      setPreviewNews(null); // Clear previous preview
      
      // Fetch full news data from API
      const fullNewsData = await newsApi.getById(item.id);
      
      if (fullNewsData) {
        setPreviewNews(fullNewsData);
      } else {
        alert('Failed to load news preview');
        setShowPreviewModal(false);
      }
    } catch (error) {
      console.error('Error fetching news preview:', error);
      alert('Failed to load news preview');
      setShowPreviewModal(false);
    }
  };

  const insertFormatting = (tag: string, isCreateModal = false) => {
    const textareaId = isCreateModal ? 'create-content' : 'edit-content';
    const textarea = document.getElementById(textareaId) as HTMLTextAreaElement;
    if (!textarea) return;

    const currentFormData = isCreateModal ? formData : editFormData;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = currentFormData.content.substring(start, end);
    
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
      currentFormData.content.substring(0, start) + 
      formattedText + 
      currentFormData.content.substring(end);
    
    if (isCreateModal) {
      setFormData(prev => ({ ...prev, content: newContent }));
    } else {
      setEditFormData(prev => ({ ...prev, content: newContent }));
    }
    
    // Restore focus and selection
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start, start + formattedText.length);
    }, 0);
  };

  const renderMarkdown = (content: string) => {
    // Simple markdown rendering
    let html = content;
    
    // Headers
    html = html.replace(/^### (.*$)/gim, '<h3 class="text-xl font-bold text-gray-900 mb-3 mt-6">$1</h3>');
    html = html.replace(/^## (.*$)/gim, '<h2 class="text-2xl font-bold text-gray-900 mb-4 mt-6">$1</h2>');
    html = html.replace(/^# (.*$)/gim, '<h1 class="text-3xl font-bold text-gray-900 mb-4 mt-6">$1</h1>');
    
    // Bold
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold">$1</strong>');
    
    // Italic
    html = html.replace(/\*(.+?)\*/g, '<em class="italic">$1</em>');
    
    // Links
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">$1</a>');
    
    // Lists
    html = html.replace(/^- (.+)$/gim, '<li class="ml-4">• $1</li>');
    
    // Line breaks
    html = html.replace(/\n/g, '<br />');
    
    return html;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-gray-200 border-t-gray-900 rounded-full animate-spin" />
          <div className="text-gray-600 text-sm">Loading news...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-4xl font-bold text-gray-900">News and Events</h1>
          <div className="flex items-center gap-3">
            <button 
              onClick={fetchNews}
              className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors text-sm"
            >
              <span className="mr-2">↻</span>
              Refresh
            </button>
            <button 
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-all font-medium text-sm"
            >
              <span className="text-lg leading-none">+</span>
              <span>Add New</span>
            </button>
          </div>
        </div>

        {/* Search and Filter Bar */}
        <div className="mb-6 flex items-center gap-4">
          {/* Search Input */}
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Search by title, summary, or content..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2.5 pl-10 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent placeholder:text-gray-400 text-gray-900 transition-all"
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <FiSearch />
            </span>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            )}
          </div>

          {/* Filter Buttons */}
          <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                filterStatus === 'all'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilterStatus('published')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                filterStatus === 'published'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Published
            </button>
            <button
              onClick={() => setFilterStatus('draft')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                filterStatus === 'draft'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Drafts
            </button>
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-4 text-sm text-gray-600">
          Showing {filteredNews.length} of {news.length} articles
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Cover</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Title</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredNews && filteredNews.length > 0 ? (
                filteredNews.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      {item.coverImage ? (
                        <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
                          <Image 
                            src={item.coverImage} 
                            alt={item.title}
                            width={64}
                            height={64}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-16 h-16 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center">
                          <span className="text-gray-400 text-xs">No image</span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{item.title}</div>
                      {item.summary && (
                        <div className="text-xs text-gray-500 mt-1 line-clamp-2">{item.summary}</div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => togglePublish(item.id, item.isPublished || false)}
                        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                          item.isPublished
                            ? 'text-green-700 bg-green-50 border border-green-200 hover:bg-green-100'
                            : 'text-gray-600 bg-gray-100 border border-gray-200 hover:bg-gray-200'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            item.isPublished ? 'bg-green-500' : 'bg-gray-400'
                          }`}
                        />
                        {item.isPublished ? 'Published' : 'Draft'}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => handlePreview(item)}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                          title="Preview"
                        >
                          <Image src="/view.png" alt="View" width={18} height={18} className="opacity-60 hover:opacity-100 transition-opacity" />
                        </button>
                        <button 
                          onClick={() => handleEdit(item)}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                          title="Edit"
                        >
                          <Image src="/edit.png" alt="Edit" width={18} height={18} className="opacity-60 hover:opacity-100 transition-opacity" />
                        </button>
                        {item.isPublished ? (
                          <button 
                            onClick={() => togglePublish(item.id, true)}
                            className="px-3 py-1.5 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors cursor-pointer"
                            title="Unpublish"
                          >
                            Unpublish
                          </button>
                        ) : (
                          <button 
                            onClick={() => togglePublish(item.id, false)}
                            className="px-3 py-1.5 text-xs font-medium text-green-700 bg-green-50 hover:bg-green-100 border border-green-200 rounded-lg transition-colors"
                            title="Publish"
                          >
                            Publish
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-16 text-center text-gray-500">
                    <div className="flex flex-col items-center gap-2">
                      <div className="text-4xl mb-2">📰</div>
                      <div>
                        {searchQuery || filterStatus !== 'all' 
                          ? 'No articles match your search or filter'
                          : 'No news found'
                        }
                      </div>
                      {(searchQuery || filterStatus !== 'all') && (
                        <button
                          onClick={() => {
                            setSearchQuery('');
                            setFilterStatus('all');
                          }}
                          className="mt-2 text-sm text-gray-600 hover:text-gray-900 underline"
                        >
                          Clear filters
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create News Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl border border-gray-200 shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">Create New Article</h2>
            </div>
            
            <div className="p-6 space-y-5">
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
                  className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent placeholder:text-gray-400 text-gray-900 transition-all"
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
                  className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent placeholder:text-gray-400 text-gray-900 transition-all"
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
                  className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent placeholder:text-gray-400 text-gray-900 transition-all resize-none"
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
                    onClick={() => insertFormatting('bold', true)}
                    className="px-3 py-1.5 text-sm font-bold hover:bg-gray-200 rounded transition-colors text-gray-900"
                    title="Bold"
                  >
                    B
                  </button>
                  <button
                    type="button"
                    onClick={() => insertFormatting('italic', true)}
                    className="px-3 py-1.5 text-sm italic hover:bg-gray-200 rounded transition-colors text-gray-900"
                    title="Italic"
                  >
                    I
                  </button>
                  <div className="w-px h-6 bg-gray-300 mx-1" />
                  <button
                    type="button"
                    onClick={() => insertFormatting('h1', true)}
                    className="px-3 py-1.5 text-sm font-bold hover:bg-gray-200 rounded transition-colors text-gray-900"
                    title="Heading 1"
                  >
                    H1
                  </button>
                  <button
                    type="button"
                    onClick={() => insertFormatting('h2', true)}
                    className="px-3 py-1.5 text-sm font-bold hover:bg-gray-200 rounded transition-colors text-gray-900"
                    title="Heading 2"
                  >
                    H2
                  </button>
                  <button
                    type="button"
                    onClick={() => insertFormatting('h3', true)}
                    className="px-3 py-1.5 text-sm font-bold hover:bg-gray-200 rounded transition-colors text-gray-900"
                    title="Heading 3"
                  >
                    H3
                  </button>
                  <div className="w-px h-6 bg-gray-300 mx-1" />
                  <button
                    type="button"
                    onClick={() => insertFormatting('link', true)}
                    className="px-3 py-1.5 text-sm hover:bg-gray-200 rounded transition-colors text-gray-900"
                    title="Link"
                  >
                    🔗
                  </button>
                  <button
                    type="button"
                    onClick={() => insertFormatting('list', true)}
                    className="px-3 py-1.5 text-sm hover:bg-gray-200 rounded transition-colors text-gray-900"
                    title="List"
                  >
                    •
                  </button>
                </div>
                
                <textarea
                  id="create-content"
                  name="content"
                  value={formData.content}
                  onChange={handleInputChange}
                  rows={12}
                  className="w-full px-4 py-2.5 bg-white border border-gray-300 border-t-0 rounded-b-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent font-mono text-sm placeholder:text-gray-400 text-gray-900 transition-all resize-none"
                  placeholder="Full article content (supports Markdown formatting)"
                  required
                />
                <p className="mt-2 text-xs text-gray-500">
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
                  value={formData.coverImage}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent placeholder:text-gray-400 text-gray-900 transition-all"
                  placeholder="https://example.com/image.jpg"
                />
              </div>

              {/* Is Published */}
              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="create-publish"
                    name="isPublished"
                    checked={formData.isPublished}
                    onChange={handleInputChange}
                    className="w-4 h-4 bg-white border-gray-300 rounded text-gray-900 focus:ring-2 focus:ring-gray-900 focus:ring-offset-0"
                  />
                  <label htmlFor="create-publish" className="text-sm font-medium text-gray-700 cursor-pointer">
                    Publish immediately
                  </label>
                </div>
                
                {/* Quick Toggle Buttons */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, isPublished: false }))}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                      !formData.isPublished
                        ? 'text-gray-700 bg-gray-100 border border-gray-300'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Save as Draft
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, isPublished: true }))}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                      formData.isPublished
                        ? 'text-green-700 bg-green-50 border border-green-200'
                        : 'text-gray-500 hover:text-green-700 hover:bg-green-50'
                    }`}
                  >
                    Publish Now
                  </button>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-5 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-all text-sm font-medium"
                disabled={creating}
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={creating || !formData.title || !formData.content}
                className="px-5 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-all disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed text-sm font-medium"
              >
                {creating ? 'Creating...' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit News Modal */}
      {showEditModal && editingNews && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl border border-gray-200 shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">Edit Article</h2>
            </div>
            
            {!editFormData.title && !editFormData.content ? (
              // Loading state
              <div className="p-16 flex flex-col items-center justify-center">
                <div className="w-8 h-8 border-2 border-gray-200 border-t-gray-900 rounded-full animate-spin mb-4" />
                <div className="text-gray-600 text-sm">Loading article data...</div>
              </div>
            ) : (
              // Edit form
              <>
                <div className="p-6 space-y-5">
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
                      className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent placeholder:text-gray-400 text-gray-900 transition-all"
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
                      className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent placeholder:text-gray-400 text-gray-900 transition-all"
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
                      className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent placeholder:text-gray-400 text-gray-900 transition-all resize-none"
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
                        onClick={() => insertFormatting('bold', false)}
                        className="px-3 py-1.5 text-sm font-bold hover:bg-gray-200 rounded transition-colors text-gray-900"
                        title="Bold"
                      >
                        B
                      </button>
                      <button
                        type="button"
                        onClick={() => insertFormatting('italic', false)}
                        className="px-3 py-1.5 text-sm italic hover:bg-gray-200 rounded transition-colors text-gray-900"
                        title="Italic"
                      >
                        I
                      </button>
                      <div className="w-px h-6 bg-gray-300 mx-1" />
                      <button
                        type="button"
                        onClick={() => insertFormatting('h1', false)}
                        className="px-3 py-1.5 text-sm font-bold hover:bg-gray-200 rounded transition-colors text-gray-900"
                        title="Heading 1"
                      >
                        H1
                      </button>
                      <button
                        type="button"
                        onClick={() => insertFormatting('h2', false)}
                        className="px-3 py-1.5 text-sm font-bold hover:bg-gray-200 rounded transition-colors text-gray-900"
                        title="Heading 2"
                      >
                        H2
                      </button>
                      <button
                        type="button"
                        onClick={() => insertFormatting('h3', false)}
                        className="px-3 py-1.5 text-sm font-bold hover:bg-gray-200 rounded transition-colors text-gray-900"
                        title="Heading 3"
                      >
                        H3
                      </button>
                      <div className="w-px h-6 bg-gray-300 mx-1" />
                      <button
                        type="button"
                        onClick={() => insertFormatting('link', false)}
                        className="px-3 py-1.5 text-sm hover:bg-gray-200 rounded transition-colors text-gray-900"
                        title="Link"
                      >
                        🔗
                      </button>
                      <button
                        type="button"
                        onClick={() => insertFormatting('list', false)}
                        className="px-3 py-1.5 text-sm hover:bg-gray-200 rounded transition-colors text-gray-900"
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
                      className="w-full px-4 py-2.5 bg-white border border-gray-300 border-t-0 rounded-b-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent font-mono text-sm placeholder:text-gray-400 text-gray-900 transition-all resize-none"
                      placeholder="Full article content (supports Markdown formatting)"
                      required
                    />
                    <p className="mt-2 text-xs text-gray-500">
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
                      className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent placeholder:text-gray-400 text-gray-900 transition-all"
                      placeholder="https://example.com/image.jpg"
                    />
                  </div>

                  {/* Is Published */}
                  <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="edit-publish"
                        name="isPublished"
                        checked={editFormData.isPublished}
                        onChange={handleEditInputChange}
                        className="w-4 h-4 bg-white border-gray-300 rounded text-gray-900 focus:ring-2 focus:ring-gray-900 focus:ring-offset-0"
                      />
                      <label htmlFor="edit-publish" className="text-sm font-medium text-gray-700 cursor-pointer">
                        Published
                      </label>
                    </div>
                    
                    {/* Quick Toggle Buttons */}
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setEditFormData(prev => ({ ...prev, isPublished: false }))}
                        className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                          !editFormData.isPublished
                            ? 'text-gray-700 bg-gray-100 border border-gray-300'
                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        Set as Draft
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditFormData(prev => ({ ...prev, isPublished: true }))}
                        className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                          editFormData.isPublished
                            ? 'text-green-700 bg-green-50 border border-green-200'
                            : 'text-gray-500 hover:text-green-700 hover:bg-green-50'
                        }`}
                      >
                        Set as Published
                      </button>
                    </div>
                  </div>
                </div>

                <div className="p-6 border-t border-gray-200 flex items-center justify-end gap-3">
                  <button
                    onClick={() => {
                      setShowEditModal(false);
                      setEditingNews(null);
                    }}
                    className="px-5 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-all text-sm font-medium cursor-pointer"
                    disabled={updating}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpdate}
                    disabled={updating || !editFormData.title || !editFormData.content}
                    className="px-5 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-all disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed text-sm font-medium cursor-pointer"
                  >
                    {updating ? 'Updating...' : 'Update'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {showPreviewModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl border border-gray-200 shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white p-6 border-b border-gray-200 flex items-center justify-between z-10">
              <h2 className="text-2xl font-bold text-gray-900">Preview</h2>
              <button
                onClick={() => {
                  setShowPreviewModal(false);
                  setPreviewNews(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
              >
                <span className="text-2xl text-gray-500">×</span>
              </button>
            </div>
            
            {!previewNews ? (
              // Loading state
              <div className="p-16 flex flex-col items-center justify-center">
                <div className="w-8 h-8 border-2 border-gray-200 border-t-gray-900 rounded-full animate-spin mb-4" />
                <div className="text-gray-600 text-sm">Loading preview...</div>
              </div>
            ) : (
              // Preview content
              <div className="p-8">
                {/* Cover Image */}
                {previewNews.coverImage && (
                  <div className="mb-8 rounded-xl overflow-hidden">
                    <Image 
                      src={previewNews.coverImage} 
                      alt={previewNews.title}
                      width={800}
                      height={400}
                      className="w-full h-auto object-cover"
                    />
                  </div>
                )}

                {/* Status Badge */}
                <div className="mb-4">
                  <span
                    className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium ${
                      previewNews.isPublished
                        ? 'text-green-700 bg-green-50 border border-green-200'
                        : 'text-gray-600 bg-gray-100 border border-gray-200'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        previewNews.isPublished ? 'bg-green-500' : 'bg-gray-400'
                      }`}
                    />
                    {previewNews.isPublished ? 'Published' : 'Draft'}
                  </span>
                </div>

                {/* Title */}
                <h1 className="text-4xl font-bold text-gray-900 mb-4">
                  {previewNews.title}
                </h1>

                {/* Slug */}
                {previewNews.slug && (
                  <div className="text-sm text-gray-500 mb-4">
                    <span className="font-medium">Slug:</span> {previewNews.slug}
                  </div>
                )}

                {/* Summary */}
                {previewNews.summary && (
                  <p className="text-lg text-gray-600 mb-6 pb-6 border-b border-gray-200">
                    {previewNews.summary}
                  </p>
                )}

                {/* Content */}
                <div 
                  className="prose prose-gray max-w-none leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: renderMarkdown(previewNews.content || '') }}
                />

                {/* Metadata */}
                <div className="mt-8 pt-6 border-t border-gray-200 space-y-2">
                  {previewNews.publishedAt && (
                    <div className="text-sm text-gray-500">
                      <span className="font-medium">Published:</span>{' '}
                      {new Date(previewNews.publishedAt).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  )}
                  {previewNews.createdAt && (
                    <div className="text-sm text-gray-500">
                      <span className="font-medium">Created:</span>{' '}
                      {new Date(previewNews.createdAt).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  )}
                  {previewNews.author && (
                    <div className="text-sm text-gray-500">
                      <span className="font-medium">Author:</span> {previewNews.author.email}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}