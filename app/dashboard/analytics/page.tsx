"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Users,
  MapPin,
  Download,
  RefreshCw,
  XCircle,
  TrendingUp,
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

const CHART_COLORS = [
  "#3b82f6", // blue-500
  "#60a5fa", // blue-400
  "#93c5fd", // blue-300
  "#64748b", // slate-500
  "#94a3b8", // slate-400
  "#cbd5e1", // slate-300
  "#2563eb", // blue-600
  "#1e40af", // blue-700
  "#475569", // slate-600
  "#334155", // slate-700
];

// ──────────────────────────────────────────────── Component

export default function AnalyticsPage() {
  const [dimensions, setDimensions] = useState<MembershipDimensions | null>(
    null,
  );
  const [analytics, setAnalytics] = useState<MembershipAnalytics | null>(null);
  const [allMembers, setAllMembers] = useState<Membership[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMembers, setLoadingMembers] = useState(false);

  // Filter from clicking charts
  const [dimensionFilter, setDimensionFilter] = useState<FilterState | null>(
    null,
  );

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
        return (
          val &&
          String(val).toLowerCase() === dimensionFilter.value.toLowerCase()
        );
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
    () =>
      (dimensions?.state ?? []).sort((a, b) => b.count - a.count).slice(0, 10),
    [dimensions],
  );

  const topDistricts = useMemo(
    () =>
      (dimensions?.district ?? [])
        .sort((a, b) => b.count - a.count)
        .slice(0, 10),
    [dimensions],
  );

  const topZones = useMemo(
    () =>
      (dimensions?.zone ?? []).sort((a, b) => b.count - a.count).slice(0, 8),
    [dimensions],
  );

  const bloodGroups = useMemo(
    () =>
      (dimensions?.bloodGroup ?? [])
        .sort((a, b) => b.count - a.count)
        .slice(0, 8),
    [dimensions],
  );

  const occupations = useMemo(
    () =>
      (dimensions?.occupation ?? [])
        .sort((a, b) => b.count - a.count)
        .slice(0, 10),
    [dimensions],
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
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 text-slate-600 animate-spin mx-auto mb-4" />
          <p className="text-lg font-medium text-slate-700">
            Loading analytics...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pb-12 w-screen md:w-full overflow-x-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 sm:mb-8 gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
              Membership Analytics
            </h1>
            <p className="text-slate-600 mt-1 text-sm sm:text-base">
              {allMembers.length} members • {analytics?.daily?.length || 0} days
              tracked
            </p>
          </div>
          <div className="flex gap-2 sm:gap-3 flex-wrap w-full sm:w-auto">
            <button
              onClick={loadDashboardData}
              className="flex-1 sm:flex-none px-3 sm:px-4 py-2 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 flex items-center justify-center gap-2 text-sm transition-colors"
            >
              <RefreshCw size={16} /> Refresh
            </button>
            <button
              onClick={exportToExcel}
              disabled={displayedMembers.length === 0}
              className="flex-1 sm:flex-none px-3 sm:px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm transition-colors"
            >
              <Download size={16} /> Export
            </button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-10">
          <div className="bg-slate-900 rounded-xl p-4 sm:p-6 text-white">
            <p className="text-xs sm:text-sm font-medium opacity-80">Total Members</p>
            <p className="text-2xl sm:text-3xl font-bold mt-1 sm:mt-2">
              {analytics?.summary?.total?.toLocaleString() ?? "0"}
            </p>
          </div>
          <div className="bg-green-600 rounded-xl p-4 sm:p-6 text-white">
            <p className="text-xs sm:text-sm font-medium opacity-80">Approved</p>
            <p className="text-2xl sm:text-3xl font-bold mt-1 sm:mt-2">
              {analytics?.summary?.approved?.toLocaleString() ?? "0"}
            </p>
          </div>
          <div className="bg-amber-500 rounded-xl p-4 sm:p-6 text-white">
            <p className="text-xs sm:text-sm font-medium opacity-80">Pending</p>
            <p className="text-2xl sm:text-3xl font-bold mt-1 sm:mt-2">
              {analytics?.summary?.pending?.toLocaleString() ?? "0"}
            </p>
          </div>
          <div className="bg-red-600 rounded-xl p-4 sm:p-6 text-white">
            <p className="text-xs sm:text-sm font-medium opacity-80">Rejected</p>
            <p className="text-2xl sm:text-3xl font-bold mt-1 sm:mt-2">
              {analytics?.summary?.rejected?.toLocaleString() ?? "0"}
            </p>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-10">
          {/* Trend */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-6">
            <div className="flex items-center gap-3 mb-4 sm:mb-5">
              <div className="p-2 bg-slate-100 rounded-lg">
                <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-slate-700" />
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-slate-900">Membership Trend</h3>
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12 }}
                  stroke="#94a3b8"
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  stroke="#94a3b8"
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke="#3b82f6"
                  fill="#3b82f6"
                  fillOpacity={0.1}
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Status Pie */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-6">
            <div className="flex items-center gap-3 mb-4 sm:mb-5">
              <div className="p-2 bg-slate-100 rounded-lg">
                <Users className="w-4 h-4 sm:w-5 sm:h-5 text-slate-700" />
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-slate-900">Status Distribution</h3>
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={statusPieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  label={({ name, percent = 0 }) =>
                    `${name} (${(percent * 100).toFixed(0)}%)`
                  }
                  labelLine={{ stroke: '#94a3b8', strokeWidth: 1 }}
                >
                  {statusPieData.map((entry, i) => (
                    <Cell key={`cell-${i}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Top States */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-6">
            <div className="flex items-center gap-3 mb-4 sm:mb-5">
              <div className="p-2 bg-slate-100 rounded-lg">
                <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-slate-700" />
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-slate-900">Top States</h3>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topStates} layout="vertical" margin={{ left: 10, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis type="number" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                <YAxis 
                  dataKey="label" 
                  type="category" 
                  width={80}
                  tick={{ fontSize: 10 }}
                  stroke="#94a3b8"
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                  }}
                />
                <Bar
                  dataKey="count"
                  fill="#64748b"
                  radius={[0, 4, 4, 0]}
                  onClick={(data: any) => {
                    if (data?.label) {
                      setDimensionFilter({
                        dimension: "state",
                        value: data.label,
                      });
                    }
                  }}
                  style={{ cursor: "pointer" }}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Top Districts */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-6">
            <div className="flex items-center gap-3 mb-4 sm:mb-5">
              <div className="p-2 bg-slate-100 rounded-lg">
                <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-slate-700" />
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-slate-900">Top Districts</h3>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topDistricts} layout="vertical" margin={{ left: 10, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis type="number" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                <YAxis
                  dataKey="label"
                  type="category"
                  width={80}
                  tick={{ fontSize: 10 }}
                  stroke="#94a3b8"
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                  }}
                />
                <Bar
                  dataKey="count"
                  fill="#60a5fa"
                  radius={[0, 4, 4, 0]}
                  onClick={(data: any) => {
                    if (data?.label) {
                      setDimensionFilter({
                        dimension: "district",
                        value: data.label,
                      });
                    }
                  }}
                  style={{ cursor: "pointer" }}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Top Zones */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-6">
            <div className="flex items-center gap-3 mb-4 sm:mb-5">
              <div className="p-2 bg-slate-100 rounded-lg">
                <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-slate-700" />
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-slate-900">Top Zones</h3>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topZones} layout="vertical" margin={{ left: 10, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis type="number" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                <YAxis 
                  dataKey="label" 
                  type="category" 
                  width={80}
                  tick={{ fontSize: 10 }}
                  stroke="#94a3b8"
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                  }}
                />
                <Bar
                  dataKey="count"
                  fill="#475569"
                  radius={[0, 4, 4, 0]}
                  onClick={(data: any) => {
                    if (data?.label) {
                      setDimensionFilter({
                        dimension: "zone",
                        value: data.label,
                      });
                    }
                  }}
                  style={{ cursor: "pointer" }}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Members Table with Multiple Filters */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-slate-200 bg-slate-50">
            <div className="flex flex-col gap-4">
              <div className="flex items-start sm:items-center justify-between flex-col sm:flex-row gap-3 sm:gap-4">
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 sm:w-6 sm:h-6 text-slate-700" />
                  <div>
                    <h3 className="text-lg sm:text-xl font-semibold text-slate-900">
                      Membership Records
                    </h3>
                    {dimensionFilter && (
                      <span className="text-xs sm:text-sm text-slate-600 mt-0.5 block">
                        {dimensionFilter.dimension}: "{dimensionFilter.value}"
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                  <button
                    onClick={clearAllFilters}
                    className="flex-1 sm:flex-none px-3 py-2 bg-slate-200 hover:bg-slate-300 rounded-lg text-sm flex items-center justify-center gap-2 transition-colors"
                  >
                    <XCircle size={16} /> Clear Filters
                  </button>

                  <button
                    onClick={exportToExcel}
                    disabled={displayedMembers.length === 0}
                    className="flex-1 sm:flex-none px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm transition-colors"
                  >
                    <Download size={16} /> Export
                  </button>
                </div>
              </div>

              {/* Filter Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">
                    Status
                  </label>
                  <select
                    value={tableFilters.status || ""}
                    onChange={(e) =>
                      setTableFilters((p) => ({
                        ...p,
                        status: e.target.value || undefined,
                      }))
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                  >
                    <option value="">All</option>
                    <option value="PENDING">Pending</option>
                    <option value="APPROVED">Approved</option>
                    <option value="REJECTED">Rejected</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">
                    Blood Group
                  </label>
                  <select
                    value={tableFilters.bloodGroup || ""}
                    onChange={(e) =>
                      setTableFilters((p) => ({
                        ...p,
                        bloodGroup: e.target.value || undefined,
                      }))
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                  >
                    <option value="">All</option>
                    {dimensions?.bloodGroup?.map((item) => (
                      <option key={item.label} value={item.label}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">
                    State
                  </label>
                  <select
                    value={tableFilters.state || ""}
                    onChange={(e) =>
                      setTableFilters((p) => ({
                        ...p,
                        state: e.target.value || undefined,
                      }))
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                  >
                    <option value="">All States</option>
                    {dimensions?.state?.map((item) => (
                      <option key={item.label} value={item.label}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">
                    District
                  </label>
                  <select
                    value={tableFilters.district || ""}
                    onChange={(e) =>
                      setTableFilters((p) => ({
                        ...p,
                        district: e.target.value || undefined,
                      }))
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                  >
                    <option value="">All Districts</option>
                    {dimensions?.district?.map((item) => (
                      <option key={item.label} value={item.label}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">
                    Zone
                  </label>
                  <select
                    value={tableFilters.zone || ""}
                    onChange={(e) =>
                      setTableFilters((p) => ({
                        ...p,
                        zone: e.target.value || undefined,
                      }))
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                  >
                    <option value="">All Zones</option>
                    {dimensions?.zone?.map((item) => (
                      <option key={item.label} value={item.label}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <p className="text-sm text-slate-600">
                Showing {displayedMembers.length} of {allMembers.length} members
              </p>
            </div>
          </div>

          {loadingMembers ? (
            <div className="p-12 text-center">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-slate-600" />
              <p className="text-slate-600">Loading members...</p>
            </div>
          ) : displayedMembers.length === 0 ? (
            <div className="p-12 sm:p-16 text-center text-slate-500">
              <Users className="w-12 h-12 mx-auto mb-4 text-slate-400" />
              <p className="font-medium">
                No members found with current filters
              </p>
              <p className="text-sm mt-2">
                Try clearing some filters or refreshing data.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                      Blood
                    </th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                      State
                    </th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                      District
                    </th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                      Zone
                    </th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                      Phone
                    </th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                      Created
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {displayedMembers.map((member) => (
                    <tr key={member.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 sm:px-6 py-3 sm:py-4 font-medium text-slate-900 whitespace-nowrap">
                        {member.fullName}
                      </td>
                      <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
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
                      <td className="px-4 sm:px-6 py-3 sm:py-4 text-slate-700 whitespace-nowrap">
                        {member.bloodGroup || "—"}
                      </td>
                      <td className="px-4 sm:px-6 py-3 sm:py-4 text-slate-700 whitespace-nowrap">
                        {member.state}
                      </td>
                      <td className="px-4 sm:px-6 py-3 sm:py-4 text-slate-700 whitespace-nowrap">
                        {member.district}
                      </td>
                      <td className="px-4 sm:px-6 py-3 sm:py-4 text-slate-700 whitespace-nowrap">
                        {member.zone}
                      </td>
                      <td className="px-4 sm:px-6 py-3 sm:py-4 text-slate-700 whitespace-nowrap">
                        {member.phone}
                      </td>
                      <td className="px-4 sm:px-6 py-3 sm:py-4 text-slate-700 whitespace-nowrap">
                        {new Date(member.createdAt).toLocaleDateString()}
                      </td>
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