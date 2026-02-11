'use client';

import { useState, useEffect } from 'react';

interface DimensionData {
  label: string;
  count: number;
}

interface AnalyticsData {
  state: DimensionData[];
  district: DimensionData[];
  zone: DimensionData[];
  bloodGroup: DimensionData[];
  occupation: DimensionData[];
}

interface Member {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  state: string;
  district: string;
  zone: string;
  bloodGroup: string;
  occupation: string;
  status: string;
}

interface FilterState {
  dimension: string;
  value: string;
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterState | null>(null);
  const [filteredMembers, setFilteredMembers] = useState<Member[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  useEffect(() => {
    if (filter) {
      fetchFilteredMembers();
    }
  }, [filter]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      
      if (!token) {
        console.error('No access token found');
        setLoading(false);
        return;
      }

      console.log('Fetching analytics from local backend...');
      
      const response = await fetch(
        'http://localhost:5001/api/v1/admin/analytics/memberships/dimensions',
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('Analytics response:', result);

      if (result) {
        setData(result);
      }
    } catch (error: any) {
      console.error('Failed to fetch analytics:', error);
      console.error('Error details:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchFilteredMembers = async () => {
    if (!filter) return;

    setLoadingMembers(true);
    try {
      const token = localStorage.getItem('accessToken');
      
      // Fetch all members and filter on frontend
      const response = await fetch(
        'http://localhost:5001/api/v1/admin/memberships/all',
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const allMembers = await response.json();
      
      // Filter members based on selected dimension
      const filtered = allMembers.filter((member: Member) => {
        const dimensionKey = filter.dimension as keyof Member;
        return member[dimensionKey] === filter.value;
      });

      setFilteredMembers(filtered);
    } catch (error: any) {
      console.error('Failed to fetch members:', error);
      setFilteredMembers([]);
    } finally {
      setLoadingMembers(false);
    }
  };

  const handleDimensionClick = (dimension: string, value: string) => {
    setFilter({ dimension, value });
  };

  const clearFilter = () => {
    setFilter(null);
    setFilteredMembers([]);
  };

  const getColorIntensity = (count: number, maxCount: number) => {
    const intensity = (count / maxCount) * 100;
    if (intensity >= 80) return 'bg-blue-600';
    if (intensity >= 60) return 'bg-blue-500';
    if (intensity >= 40) return 'bg-blue-400';
    if (intensity >= 20) return 'bg-blue-300';
    return 'bg-blue-200';
  };

  const renderHeatmapSection = (title: string, items: DimensionData[], dimensionKey: string) => {
    if (!items || items.length === 0) return null;

    const maxCount = Math.max(...items.map((item) => item.count));

    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
        <div className="space-y-3">
          {items.map((item, index) => (
            <div key={index} className="flex items-center gap-3">
              <div className="w-32 text-sm font-medium text-gray-700 truncate">
                {item.label}
              </div>
              <div className="flex-1 flex items-center gap-2">
                <button
                  onClick={() => handleDimensionClick(dimensionKey, item.label)}
                  className="flex-1 bg-gray-100 rounded-full h-8 overflow-hidden hover:ring-2 hover:ring-blue-300 transition-all cursor-pointer"
                >
                  <div
                    className={`h-full ${getColorIntensity(item.count, maxCount)} transition-all duration-500 flex items-center justify-end pr-3`}
                    style={{ width: `${(item.count / maxCount) * 100}%` }}
                  >
                    <span className="text-white text-xs font-semibold">
                      {item.count}
                    </span>
                  </div>
                </button>
                <div className="w-12 text-right text-sm text-gray-600">
                  {Math.round((item.count / maxCount) * 100)}%
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading analytics...</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-600 mb-4">No analytics data available</div>
          <button 
            onClick={fetchAnalytics}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  console.log('Rendering with data:', data);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-600 mt-2">Membership dimension-wise analytics</p>
          <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              💡 <strong>Tip:</strong> Click on any bar in the heatmap below to view detailed member information for that category
            </p>
          </div>
        </div>

        {/* Heatmap Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {renderHeatmapSection('State Distribution', data.state, 'state')}
          {renderHeatmapSection('District Distribution', data.district, 'district')}
          {renderHeatmapSection('Zone Distribution', data.zone, 'zone')}
          {renderHeatmapSection('Blood Group Distribution', data.bloodGroup, 'bloodGroup')}
          {renderHeatmapSection('Occupation Distribution', data.occupation, 'occupation')}
        </div>

        {/* Filtered Members Table */}
        {filter && (
          <div className="mt-8 bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-blue-50 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Members: {filter.dimension.charAt(0).toUpperCase() + filter.dimension.slice(1)} = "{filter.value}"
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Showing {filteredMembers.length} member(s)
                </p>
              </div>
              <button
                onClick={clearFilter}
                className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium"
              >
                Clear Filter
              </button>
            </div>

            {loadingMembers ? (
              <div className="px-6 py-12 text-center text-gray-600">
                Loading members...
              </div>
            ) : filteredMembers.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Full Name</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Email</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Phone</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">State</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">District</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Zone</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Blood Group</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Occupation</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredMembers.map((member) => (
                      <tr key={member.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">{member.fullName}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{member.email}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{member.phone}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{member.state}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{member.district}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{member.zone}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{member.bloodGroup}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{member.occupation}</td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${
                              member.status === 'APPROVED'
                                ? 'text-green-700 bg-green-50'
                                : member.status === 'PENDING'
                                ? 'text-yellow-700 bg-yellow-50'
                                : 'text-red-700 bg-red-50'
                            }`}
                          >
                            {member.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="px-6 py-12 text-center text-gray-500">
                No members found for this filter
              </div>
            )}
          </div>
        )}

        {/* Legend */}
        <div className="mt-8 bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Color Intensity Legend</h3>
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <div className="w-8 h-4 bg-blue-200 rounded"></div>
              <span className="text-xs text-gray-600">0-20%</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-4 bg-blue-300 rounded"></div>
              <span className="text-xs text-gray-600">20-40%</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-4 bg-blue-400 rounded"></div>
              <span className="text-xs text-gray-600">40-60%</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-4 bg-blue-500 rounded"></div>
              <span className="text-xs text-gray-600">60-80%</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-4 bg-blue-600 rounded"></div>
              <span className="text-xs text-gray-600">80-100%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
