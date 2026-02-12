"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Users,
  MapPin,
  Droplet,
  Briefcase,
  CheckCircle,
  Clock,
  XCircle,
  Download,
  RefreshCw,
  PieChart as PieChartIcon,
  LineChartIcon,
  Filter as FilterIcon,
} from "lucide-react";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  AreaChart,
  Area,
  Legend,
} from "recharts";

import * as XLSX from "xlsx";

import {
  analyticsApi,
  Membership,
  MembershipDimensions,
  MembershipAnalytics,
  membershipApi,
} from "@/lib/api";

// ──────────────────────────────────────────────── Types

type DimensionKey = "state" | "district" | "zone" | "bloodGroup" | "occupation";

interface FilterState {
  dimension: DimensionKey;
  value: string;
}

// ──────────────────────────────────────────────── Colors

const STATUS_COLORS: Record<string, string> = {
  APPROVED: "#10b981",
  PENDING: "#f59e0b",
  REJECTED: "#ef4444",
};

// ──────────────────────────────────────────────── Component

export default function AnalyticsPage() {
  const [dimensions, setDimensions] = useState<MembershipDimensions | null>(null);
  const [analytics, setAnalytics] = useState<MembershipAnalytics | null>(null);
  const [allMembers, setAllMembers] = useState<Membership[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMembers, setLoadingMembers] = useState(false);

  // Filter from clicking charts
  const [dimensionFilter, setDimensionFilter] = useState<FilterState | null>(null);

  // Additional filters from table controls
  const [tableFilters, setTableFilters] = useState<{
    status?: string;
    bloodGroup?: string;
    state?: string;
    district?: string;
    zone?: string;
  }>({});

  // ──────────────────────────────────────────────── Load data

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [dimRes, anaRes] = await Promise.all([
        analyticsApi.getMembershipDimensions(),
        analyticsApi.getMemberships(),
      ]);
      setDimensions(dimRes);
      setAnalytics(anaRes);
    } catch (err) {
      console.error("Failed to load dashboard:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadAllMembers = async () => {
    setLoadingMembers(true);
    try {
      const members = await membershipApi.getAll();
      setAllMembers(members || []);
    } catch (err) {
      console.error("Failed to load members:", err);
    } finally {
      setLoadingMembers(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
    loadAllMembers();
  }, []);

  // ──────────────────────────────────────────────── Filtered members (combined)

  const displayedMembers = useMemo(() => {
    let result = [...allMembers];

    // 1. Filter from chart click
    if (dimensionFilter) {
      result = result.filter((m) => {
        const val = m[dimensionFilter.dimension as keyof Membership];
        return val && String(val).toLowerCase() === dimensionFilter.value.toLowerCase();
      });
    }

    // 2. Table filters
    if (tableFilters.status) {
      result = result.filter((m) => m.status === tableFilters.status);
    }
    if (tableFilters.bloodGroup) {
      result = result.filter((m) => m.bloodGroup === tableFilters.bloodGroup);
    }
    if (tableFilters.state) {
      result = result.filter((m) => m.state === tableFilters.state);
    }
    if (tableFilters.district) {
      result = result.filter((m) => m.district === tableFilters.district);
    }
    if (tableFilters.zone) {
      result = result.filter((m) => m.zone === tableFilters.zone);
    }

    return result;
  }, [allMembers, dimensionFilter, tableFilters]);

  const clearAllFilters = () => {
    setDimensionFilter(null);
    setTableFilters({});
  };

  // ──────────────────────────────────────────────── Chart data

  const statusPieData = useMemo(() => {
    if (!analytics?.summary) return [];
    const { approved, pending, rejected } = analytics.summary;
    return [
      { name: "Approved", value: approved, color: STATUS_COLORS.APPROVED },
      { name: "Pending", value: pending, color: STATUS_COLORS.PENDING },
      { name: "Rejected", value: rejected, color: STATUS_COLORS.REJECTED },
    ].filter((d) => d.value > 0);
  }, [analytics]);

  const trendData = useMemo(() => analytics?.daily ?? [], [analytics]);

  const topStates = useMemo(
    () => (dimensions?.state ?? []).sort((a, b) => b.count - a.count).slice(0, 10),
    [dimensions]
  );

  const topDistricts = useMemo(
    () => (dimensions?.district ?? []).sort((a, b) => b.count - a.count).slice(0, 10),
    [dimensions]
  );

  const topZones = useMemo(
    () => (dimensions?.zone ?? []).sort((a, b) => b.count - a.count).slice(0, 8),
    [dimensions]
  );

  const bloodGroups = useMemo(
    () => (dimensions?.bloodGroup ?? []).sort((a, b) => b.count - a.count).slice(0, 8),
    [dimensions]
  );

  const occupations = useMemo(
    () => (dimensions?.occupation ?? []).sort((a, b) => b.count - a.count).slice(0, 10),
    [dimensions]
  );

  // ──────────────────────────────────────────────── Export

  const exportToExcel = () => {
    if (displayedMembers.length === 0) return;

    const data = displayedMembers.map((m) => ({
      "Full Name": m.fullName,
      Status: m.status,
      "Blood Group": m.bloodGroup || "",
      State: m.state,
      District: m.district,
      Zone: m.zone,
      Occupation: m.occupation,
      Phone: m.phone,
      Email: m.email,
      "Created At": m.createdAt,
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Members");
    XLSX.writeFile(wb, `members-${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  // ──────────────────────────────────────────────── Render

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-lg font-medium text-gray-700">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/80 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">

        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Membership Analytics</h1>
            <p className="text-gray-600 mt-1">
              {allMembers.length} members • {analytics?.daily?.length || 0} days tracked
            </p>
          </div>
          <div className="flex gap-3 flex-wrap">
            <button
              onClick={loadDashboardData}
              className="px-4 py-2 bg-white border border-gray-300 border border-gray-300-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2 "
            >
              <RefreshCw size={16} /> Refresh
            </button>
            <button
              onClick={exportToExcel}
              disabled={displayedMembers.length === 0}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 "
            >
              <Download size={16} /> Export Excel
            </button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white ">
            <p className="text-sm font-medium opacity-90">Total Members</p>
            <p className="text-3xl font-bold mt-2">{analytics?.summary?.total?.toLocaleString() ?? "0"}</p>
          </div>
          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white ">
            <p className="text-sm font-medium opacity-90">Approved</p>
            <p className="text-3xl font-bold mt-2">{analytics?.summary?.approved?.toLocaleString() ?? "0"}</p>
          </div>
          <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl p-6 text-white ">
            <p className="text-sm font-medium opacity-90">Pending</p>
            <p className="text-3xl font-bold mt-2">{analytics?.summary?.pending?.toLocaleString() ?? "0"}</p>
          </div>
          <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl p-6 text-white ">
            <p className="text-sm font-medium opacity-90">Rejected</p>
            <p className="text-3xl font-bold mt-2">{analytics?.summary?.rejected?.toLocaleString() ?? "0"}</p>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">

          {/* Trend */}
          <div className="bg-white rounded-xl  border border-gray-300 p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="p-2 bg-gray-100 rounded-lg">
                <LineChartIcon className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold">Membership Trend</h3>
            </div>
            <ResponsiveContainer width="100%" height={320}>
              <AreaChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Area type="monotone" dataKey="count" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Status Pie */}
          <div className="bg-white rounded-xl  border border-gray-300 p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="p-2 bg-gray-100 rounded-lg">
                <PieChartIcon className="w-5 h-5 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold">Status Distribution</h3>
            </div>
            <ResponsiveContainer width="100%" height={320}>
              <PieChart>
                <Pie
                  data={statusPieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={110}
                  label={({ name, percent = 0 }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                >
                  {statusPieData.map((entry, i) => (
                    <Cell key={`cell-${i}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Top States */}
          <div className="bg-white rounded-xl  border border-gray-300 p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="p-2 bg-gray-100 rounded-lg">
                <MapPin className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold">Top States</h3>
            </div>
            <ResponsiveContainer width="100%" height={340}>
              <BarChart data={topStates} layout="vertical" margin={{ left: 100 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="label" type="category" />
                <Tooltip />
                <Bar
                  dataKey="count"
                  fill="#3b82f6"
                  radius={[0, 4, 4, 0]}
                  shape={(props: any) => {
                    const { x, y, width, height, payload } = props;
                    return (
                      <g>
                        <rect
                          x={x}
                          y={y}
                          width={width}
                          height={height}
                          fill={props.fill}
                          rx={4}
                          ry={4}
                          style={{ cursor: "pointer" }}
                          onClick={() => payload?.label && setDimensionFilter({ dimension: "state", value: payload.label })}
                        />
                      </g>
                    );
                  }}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Top Districts */}
          <div className="bg-white rounded-xl  border border-gray-300 p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="p-2 bg-gray-100 rounded-lg">
                <MapPin className="w-5 h-5 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold">Top Districts</h3>
            </div>
            <ResponsiveContainer width="100%" height={340}>
              <BarChart data={topDistricts} layout="vertical" margin={{ left: 120 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="label" type="category" />
                <Tooltip />
                <Bar
                  dataKey="count"
                  fill="#8b5cf6"
                  radius={[0, 4, 4, 0]}
                  shape={(props: any) => {
                    const { x, y, width, height, payload } = props;
                    return (
                      <g>
                        <rect
                          x={x}
                          y={y}
                          width={width}
                          height={height}
                          fill={props.fill}
                          rx={4}
                          ry={4}
                          style={{ cursor: "pointer" }}
                          onClick={() => payload?.label && setDimensionFilter({ dimension: "district", value: payload.label })}
                        />
                      </g>
                    );
                  }}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Top Zones */}
          <div className="bg-white rounded-xl  border border-gray-300 p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="p-2 bg-gray-100 rounded-lg">
                <MapPin className="w-5 h-5 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold">Top Zones</h3>
            </div>
            <ResponsiveContainer width="100%" height={340}>
              <BarChart data={topZones} layout="vertical" margin={{ left: 100 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="label" type="category" />
                <Tooltip />
                <Bar
                  dataKey="count"
                  fill="#10b981"
                  radius={[0, 4, 4, 0]}
                  shape={(props: any) => {
                    const { x, y, width, height, payload } = props;
                    return (
                      <g>
                        <rect
                          x={x}
                          y={y}
                          width={width}
                          height={height}
                          fill={props.fill}
                          rx={4}
                          ry={4}
                          style={{ cursor: "pointer" }}
                          onClick={() => payload?.label && setDimensionFilter({ dimension: "zone", value: payload.label })}
                        />
                      </g>
                    );
                  }}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Members Table with Multiple Filters */}
        <div className="bg-white rounded-xl  border border-gray-300 overflow-hidden">
          <div className="p-6 border border-gray-300 bg-gradient-to-r from-blue-50 to-indigo-50">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3">
                  <Users className="w-6 h-6 text-blue-600" />
                  <h3 className="text-xl font-semibold text-gray-900">
                    Membership Records
                    {dimensionFilter && (
                      <span className="ml-2 text-blue-600 text-base">
                        • {dimensionFilter.dimension}: "{dimensionFilter.value}"
                      </span>
                    )}
                  </h3>
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={clearAllFilters}
                    className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-md text-sm flex items-center gap-2"
                  >
                    <XCircle size={16} /> Clear All Filters
                  </button>

                  <button
                    onClick={exportToExcel}
                    disabled={displayedMembers.length === 0}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <Download size={16} /> Export Excel
                  </button>
                </div>
              </div>

              {/* Filter Controls */}
              <div className="flex flex-wrap gap-3 items-end">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Status</label>
                  <select
                    value={tableFilters.status || ""}
                    onChange={(e) => setTableFilters(p => ({ ...p, status: e.target.value || undefined }))}
                    className="px-3 py-2 border border-gray-300 border border-gray-300-gray-300 rounded-md text-sm min-w-[140px]"
                  >
                    <option value="">All</option>
                    <option value="PENDING">Pending</option>
                    <option value="APPROVED">Approved</option>
                    <option value="REJECTED">Rejected</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-gray-600 mb-1">Blood Group</label>
                  <select
                    value={tableFilters.bloodGroup || ""}
                    onChange={(e) => setTableFilters(p => ({ ...p, bloodGroup: e.target.value || undefined }))}
                    className="px-3 py-2 border border-gray-300 border border-gray-300-gray-300 rounded-md text-sm min-w-[140px]"
                  >
                    <option value="">All</option>
                    {dimensions?.bloodGroup?.map(item => (
                      <option key={item.label} value={item.label}>{item.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-gray-600 mb-1">State</label>
                  <select
                    value={tableFilters.state || ""}
                    onChange={(e) => setTableFilters(p => ({ ...p, state: e.target.value || undefined }))}
                    className="px-3 py-2 border border-gray-300 border border-gray-300-gray-300 rounded-md text-sm min-w-[160px]"
                  >
                    <option value="">All States</option>
                    {dimensions?.state?.map(item => (
                      <option key={item.label} value={item.label}>{item.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-gray-600 mb-1">District</label>
                  <select
                    value={tableFilters.district || ""}
                    onChange={(e) => setTableFilters(p => ({ ...p, district: e.target.value || undefined }))}
                    className="px-3 py-2 border border-gray-300 border border-gray-300-gray-300 rounded-md text-sm min-w-[160px]"
                  >
                    <option value="">All Districts</option>
                    {dimensions?.district?.map(item => (
                      <option key={item.label} value={item.label}>{item.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-gray-600 mb-1">Zone</label>
                  <select
                    value={tableFilters.zone || ""}
                    onChange={(e) => setTableFilters(p => ({ ...p, zone: e.target.value || undefined }))}
                    className="px-3 py-2 border border-gray-300 border border-gray-300-gray-300 rounded-md text-sm min-w-[140px]"
                  >
                    <option value="">All Zones</option>
                    {dimensions?.zone?.map(item => (
                      <option key={item.label} value={item.label}>{item.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <p className="text-sm text-gray-600">
                Showing {displayedMembers.length} of {allMembers.length} members
              </p>
            </div>
          </div>

          {loadingMembers ? (
            <div className="p-12 text-center">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-blue-600" />
              <p className="text-gray-600">Loading members...</p>
            </div>
          ) : displayedMembers.length === 0 ? (
            <div className="p-16 text-center text-gray-500">
              <Users className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="font-medium">No members found with current filters</p>
              <p className="text-sm mt-2">Try clearing some filters or refreshing data.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0 z-10">
                  <tr>
                    <th className="px-6 py-4 text-left font-semibold text-gray-700">Name</th>
                    <th className="px-6 py-4 text-left font-semibold text-gray-700">Status</th>
                    <th className="px-6 py-4 text-left font-semibold text-gray-700">Blood Group</th>
                    <th className="px-6 py-4 text-left font-semibold text-gray-700">State</th>
                    <th className="px-6 py-4 text-left font-semibold text-gray-700">District</th>
                    <th className="px-6 py-4 text-left font-semibold text-gray-700">Zone</th>
                    <th className="px-6 py-4 text-left font-semibold text-gray-700">Phone</th>
                    <th className="px-6 py-4 text-left font-semibold text-gray-700">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {displayedMembers.map((member) => (
                    <tr key={member.id} className="hover:bg-blue-50/30">
                      <td className="px-6 py-4 font-medium">{member.fullName}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
                            member.status === "APPROVED"
                              ? "bg-green-100 text-green-800"
                              : member.status === "PENDING"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {member.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">{member.bloodGroup || "—"}</td>
                      <td className="px-6 py-4">{member.state}</td>
                      <td className="px-6 py-4">{member.district}</td>
                      <td className="px-6 py-4">{member.zone}</td>
                      <td className="px-6 py-4">{member.phone}</td>
                      <td className="px-6 py-4">{new Date(member.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}