'use client';

import { useEffect, useState } from 'react';
import { auditApi, type AuditLog } from '@/lib/api/audit';

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [filter, setFilter] = useState({
    email: '',
    action: '',
  });

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await auditApi.getLogs({
        page,
        limit,
        email: filter.email || undefined,
        action: filter.action || undefined,
      });

      setLogs(res.data);
      setTotal(res.meta.total);
      setTotalPages(res.meta.totalPages);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const applyFilters = () => {
    setPage(1);
    fetchData();
  };

  const clearFilters = () => {
    setFilter({ email: '', action: '' });
    setPage(1);
  };

  const getActionBadgeColor = (action: string) => {
    if (action.includes('CREATE')) return 'bg-green-50 text-green-700';
    if (action.includes('DELETE')) return 'bg-red-50 text-red-700';
    return 'bg-gray-100 text-gray-900';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin w-10 h-10 border-4 border-gray-200 border-t-black rounded-full" />
          <p className="text-sm text-gray-600">Loading audit logs...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="max-w-md text-center">
          <p className="text-red-600 mb-6 text-lg">{error}</p>
          <button
            onClick={fetchData}
            className="px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-900 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Compute simple stats from loaded page
  const uniqueUsers = new Set(logs.map((l) => l.email)).size;

  return (
    <div className="min-h-screen bg-white w-screen md:w-full">
      <div className="max-w-7xl mx-auto px-8 py-12">

        {/* Header */}
        <div className="mb-12">
          <div className="flex justify-between items-center">
            <h1 className="text-4xl font-bold tracking-tight">Audit Logs</h1>
            <button
              onClick={fetchData}
              className="px-5 py-2.5 text-sm bg-black text-white rounded-lg hover:bg-gray-900 transition-colors"
            >
              Refresh
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          <div className="bg-gray-50 p-8 rounded-2xl border border-gray-200">
            <p className="text-sm text-gray-500 mb-2 uppercase tracking-wide">Total Logs</p>
            <p className="text-4xl font-bold">{total.toLocaleString()}</p>
          </div>
          <div className="bg-gray-50 p-8 rounded-2xl border border-gray-200">
            <p className="text-sm text-gray-500 mb-2 uppercase tracking-wide">Unique Users</p>
            <p className="text-4xl font-bold">{uniqueUsers}</p>
          </div>
          <div className="bg-gray-50 p-8 rounded-2xl border border-gray-200">
            <p className="text-sm text-gray-500 mb-2 uppercase tracking-wide">Current Page</p>
            <p className="text-4xl font-bold">{page}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-gray-50 p-6 rounded-2xl flex flex-wrap gap-4 mb-8 border border-gray-200">
          <input
            type="text"
            value={filter.action}
            onChange={(e) =>
              setFilter({ ...filter, action: e.target.value })
            }
            placeholder="Filter by action"
            className="flex-1 min-w-[200px] bg-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
          />
          <input
            type="text"
            value={filter.email}
            onChange={(e) =>
              setFilter({ ...filter, email: e.target.value })
            }
            placeholder="Filter by Email"
            className="flex-1 min-w-[200px] bg-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
          />
          <button
            onClick={applyFilters}
            className="px-8 py-3 bg-black text-white rounded-lg hover:bg-gray-900 transition-colors font-medium"
          >
            Apply
          </button>
          <button
            onClick={clearFilters}
            className="px-8 py-3 bg-white rounded-lg hover:bg-gray-100 transition-colors font-medium"
          >
            Clear
          </button>
        </div>

        {/* Logs Table */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden ">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Time</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Action</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Entity</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">IP Address</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Metadata</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {logs.length > 0 ? (
                  logs.map((log, index) => (
                    <tr 
                      key={log.id} 
                      className={`hover:bg-gray-50 transition-colors ${
                        index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                      }`}
                    >
                      <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {log.email || 'System'}
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
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <div className="font-medium">{log.entity}</div>
                        {log.entityId && (
                          <div className="text-xs text-gray-500 mt-1 font-mono">
                            {log.entityId.slice(0, 12)}...
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 font-mono">
                        {log.ipAddress || 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {log.metadata ? (
                          <button
                            onClick={() =>
                              alert(
                                JSON.stringify(log.metadata, null, 2)
                              )
                            }
                            className="text-black font-medium hover:underline"
                          >
                            View
                          </button>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-16 text-center">
                      <div className="text-gray-400">
                        <svg className="mx-auto h-12 w-12 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <p className="text-lg font-medium">No logs found</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        <div className="flex justify-center items-center gap-6 mt-8">
          <button
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
            className="px-6 py-3 bg-black text-white rounded-lg disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-900 transition-colors font-medium"
          >
            Previous
          </button>
          <span className="text-sm font-medium text-gray-700">
            Page {page} of {totalPages}
          </span>
          <button
            disabled={page === totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="px-6 py-3 bg-black text-white rounded-lg disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-900 transition-colors font-medium"
          >
            Next
          </button>
        </div>

      </div>
    </div>
  );
}