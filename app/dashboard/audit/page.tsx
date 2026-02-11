'use client';

import { useState, useEffect } from 'react';
import { getAuditLogs, getAuditStats, type AuditLogWithUser } from '@/lib/supabase/audit';

// Alternative: Use Backend API (requires AUDIT_VIEW permission)
// import { auditApi, type AuditLog, type AuditStats } from '@/lib/api/audit';

interface AuditStats {
  total: number;
  uniqueUsers: number;
  topActions: {
    action: string;
    count: number;
  }[];
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLogWithUser[]>([]);
  const [stats, setStats] = useState<AuditStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState({
    userId: '',
    action: '',
  });

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      console.log('Fetching audit logs from Supabase...');
      
      const [logsResult, statsResult] = await Promise.all([
        getAuditLogs({
          limit: 100,
          offset: 0,
          userId: filter.userId || undefined,
          action: filter.action || undefined,
        }),
        getAuditStats(),
      ]);

      console.log('Audit logs response:', logsResult);
      console.log('Audit stats response:', statsResult);

      setLogs(logsResult.logs || []);
      setStats(statsResult);
    } catch (err) {
      console.error('Error fetching audit logs:', err);
      setError(err instanceof Error ? err.message : 'Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    fetchData();
  };

  const clearFilters = () => {
    setFilter({ userId: '', action: '' });
    setTimeout(() => fetchData(), 0);
  };

  const getActionBadgeColor = (action: string) => {
    if (action.includes('CREATE')) return 'bg-green-100 text-green-800';
    if (action.includes('UPDATE')) return 'bg-blue-100 text-blue-800';
    if (action.includes('DELETE')) return 'bg-red-100 text-red-800';
    if (action.includes('LOGIN')) return 'bg-purple-100 text-purple-800';
    if (action.includes('APPROVE')) return 'bg-teal-100 text-teal-800';
    if (action.includes('REJECT')) return 'bg-orange-100 text-orange-800';
    return 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <div className="text-gray-600">Loading audit logs...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md">
          <div className="text-red-600 text-xl font-semibold mb-4">
            ⚠️ Error Loading Audit Logs
          </div>
          <div className="text-gray-700 mb-4">{error}</div>
          <button
            onClick={fetchData}
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">Audit Logs</h1>
            <p className="text-gray-600 mt-2">Track all system activities and user actions</p>
          </div>
          <button
            onClick={fetchData}
            className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors flex items-center gap-2"
          >
            <span>🔄</span>
            Refresh
          </button>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="text-gray-500 text-sm font-medium mb-2">Total Actions</div>
              <div className="text-3xl font-bold text-gray-900">{stats.total}</div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="text-gray-500 text-sm font-medium mb-2">Active Users</div>
              <div className="text-3xl font-bold text-blue-600">{stats.uniqueUsers}</div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="text-gray-500 text-sm font-medium mb-2">Top Action</div>
              <div className="text-xl font-bold text-purple-600">
                {stats.topActions[0]?.action || 'N/A'}
              </div>
              <div className="text-sm text-gray-500 mt-1">
                {stats.topActions[0]?.count || 0} times
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
          <div className="flex items-end gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Action
              </label>
              <input
                type="text"
                value={filter.action}
                onChange={(e) => setFilter({ ...filter, action: e.target.value })}
                placeholder="e.g., LOGIN, CREATE, UPDATE"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter by User ID
              </label>
              <input
                type="text"
                value={filter.userId}
                onChange={(e) => setFilter({ ...filter, userId: e.target.value })}
                placeholder="Enter user ID"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button
              onClick={applyFilters}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Apply
            </button>
            <button
              onClick={clearFilters}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Clear
            </button>
          </div>
        </div>

        {/* Logs Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                    Timestamp
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                    User
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                    Action
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                    Entity
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                    IP Address
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                    Details
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {logs.length > 0 ? (
                  logs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleString('en-GB', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="px-6 py-4">
                        {log.User ? (
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {log.User.email}
                            </div>
                            <div className="text-xs text-gray-500">
                              {log.User.UserRole?.[0]?.role?.name || 'No Role'}
                            </div>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">System</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${getActionBadgeColor(
                            log.action
                          )}`}
                        >
                          {log.action}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{log.entity}</div>
                        {log.entityId && (
                          <div className="text-xs text-gray-500 font-mono">
                            {log.entityId.slice(0, 8)}...
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {log.ipAddress || 'N/A'}
                      </td>
                      <td className="px-6 py-4">
                        {log.metadata && Object.keys(log.metadata).length > 0 ? (
                          <button
                            onClick={() => {
                              alert(JSON.stringify(log.metadata, null, 2));
                            }}
                            className="text-sm text-blue-600 hover:text-blue-800"
                          >
                            View
                          </button>
                        ) : (
                          <span className="text-sm text-gray-400">-</span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center gap-4">
                        <div className="text-6xl">📋</div>
                        <div className="text-gray-500 text-lg">No audit logs found</div>
                        <div className="text-gray-400 text-sm">
                          Actions will appear here as users interact with the system
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination Info */}
        {logs.length > 0 && (
          <div className="mt-4 text-sm text-gray-600 text-center">
            Showing {logs.length} of {stats?.total || 0} total logs
          </div>
        )}
      </div>
    </div>
  );
}
