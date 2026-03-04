"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Users,
  MapPin,
  Download,
  RefreshCw,
  XCircle,
  TrendingUp,
  Search,
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

type DimensionKey =
  | "state"
  | "district"
  | "zone"
  | "bloodGroup"
  | "occupation";

interface FilterState {
  dimension: DimensionKey;
  value: string;
}

// ──────────────────────────────────────────────── Colors

const STATUS_COLORS: Record<string, string> = {
  APPROVED: "#10b981",
  PENDING: "#f59e0b",
  REJECTED: "#ef4444",
  SUSPENDED: "#64748b",
};

const CHART_COLORS = [
  "#3b82f6",
  "#60a5fa",
  "#93c5fd",
  "#64748b",
  "#94a3b8",
  "#cbd5e1",
  "#2563eb",
  "#1e40af",
];

// ──────────────────────────────────────────────── Component

export default function AnalyticsPage() {
  const [dimensions, setDimensions] =
    useState<MembershipDimensions | null>(null);
  const [analytics, setAnalytics] =
    useState<MembershipAnalytics | null>(null);
  const [allMembers, setAllMembers] = useState<Membership[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMembers, setLoadingMembers] = useState(false);

  const [dimensionFilter, setDimensionFilter] =
    useState<FilterState | null>(null);

  const [search, setSearch] = useState("");

  const [tableFilters, setTableFilters] = useState<{
    status?: string;
    bloodGroup?: string;
    state?: string;
    city?: string;
    country?: string;
  }>({});

  // ───────────────────────────── Load dashboard

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
      console.error("Dashboard load failed", err);
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
      console.error(err);
    } finally {
      setLoadingMembers(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
    loadAllMembers();
  }, []);

  // ───────────────────────────── Members filtering

  const displayedMembers = useMemo(() => {
    let result = [...allMembers];

    if (dimensionFilter) {
      result = result.filter((m) => {
        const val = m[dimensionFilter.dimension as keyof Membership];

        return (
          val &&
          String(val).toLowerCase() ===
            dimensionFilter.value.toLowerCase()
        );
      });
    }

    if (tableFilters.status) {
      result = result.filter((m) => m.status === tableFilters.status);
    }

    if (tableFilters.bloodGroup) {
      result = result.filter(
        (m) => m.bloodGroup === tableFilters.bloodGroup,
      );
    }

    if (tableFilters.state) {
      result = result.filter((m) => m.state === tableFilters.state);
    }

    if (tableFilters.city) {
      result = result.filter((m) => m.city === tableFilters.city);
    }

    if (tableFilters.country) {
      result = result.filter((m) => m.country === tableFilters.country);
    }

    if (search) {
      const q = search.toLowerCase();

      result = result.filter(
        (m) =>
          m.fullName.toLowerCase().includes(q) ||
          m.phone.includes(q) ||
          m.email.toLowerCase().includes(q),
      );
    }

    return result;
  }, [allMembers, dimensionFilter, tableFilters, search]);

  const clearAllFilters = () => {
    setDimensionFilter(null);
    setTableFilters({});
    setSearch("");
  };

  // ───────────────────────────── Chart data

  const statusPieData = useMemo(() => {
    if (!analytics?.summary) return [];

    const { approved, pending, rejected, suspended } = analytics.summary;

    return [
      { name: "Approved", value: approved, color: STATUS_COLORS.APPROVED },
      { name: "Pending", value: pending, color: STATUS_COLORS.PENDING },
      { name: "Rejected", value: rejected, color: STATUS_COLORS.REJECTED },
      { name: "Suspended", value: suspended, color: STATUS_COLORS.SUSPENDED },
    ].filter((d) => d.value > 0);
  }, [analytics]);

  const trendData = useMemo(() => analytics?.daily ?? [], [analytics]);

  const topStates = useMemo(
    () =>
      (dimensions?.state ?? []).sort((a, b) => b.count - a.count).slice(0, 10),
    [dimensions],
  );

  const topCountries = useMemo(
    () =>
      (dimensions?.country ?? [])
        .sort((a, b) => b.count - a.count)
        .slice(0, 10),
    [dimensions],
  );

  const topCities = useMemo(
    () =>
      (dimensions?.city ?? []).sort((a, b) => b.count - a.count).slice(0, 8),
    [dimensions],
  );

  const cities = useMemo(
    () =>
      (dimensions?.city ?? [])
        .sort((a, b) => b.count - a.count)
        .slice(0, 10),
    [dimensions],
  );

  

  // ───────────────────────────── KPI metrics

  const approvalRate = useMemo(() => {
    if (!analytics?.summary) return 0;

    return (
      (analytics.summary.approved / analytics.summary.total) *
      100
    ).toFixed(1);
  }, [analytics]);

  const pendingRate = useMemo(() => {
    if (!analytics?.summary) return 0;

    return (
      (analytics.summary.pending / analytics.summary.total) *
      100
    ).toFixed(1);
  }, [analytics]);

  // ───────────────────────────── Export

  const exportToExcel = () => {
    if (displayedMembers.length === 0) return;

    const rows = displayedMembers.map((m) => ({
      "Member ID": m.uniqueMemberId,
      Name: m.fullName,
      Status: m.status,
      Blood: m.bloodGroup,
      State: m.state,
      Country: m.country,
      City: m.city,
      Phone: m.phone,
      Email: m.email,
      Created: new Date(m.createdAt).toLocaleDateString(),
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(wb, ws, "Members");

    XLSX.writeFile(
      wb,
      `members-${new Date().toISOString().slice(0, 10)}.xlsx`,
    );
  };

  // ───────────────────────────── Render

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <RefreshCw className="w-10 h-10 animate-spin text-slate-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pb-12 w-screen md:w-full overflow-x-hidden">
      <div className="max-w-7xl mx-auto px-6 pt-8">

        {/* Header */}

        <div className="flex justify-between items-center mb-8 flex-wrap gap-3">

          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              Membership Analytics
            </h1>

            <p className="text-slate-600">
              {allMembers.length} members tracked
            </p>
          </div>

          <div className="flex gap-3">

            <button
              onClick={loadDashboardData}
              className="px-4 py-2 border border-gray-300 rounded-lg flex items-center gap-2"
            >
              <RefreshCw size={16} /> Refresh
            </button>

            <button
              onClick={exportToExcel}
              className="px-4 py-2 bg-green-600 text-white rounded-lg flex items-center gap-2"
            >
              <Download size={16} /> Export
            </button>
          </div>
        </div>

        {/* KPI Cards */}

        <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 mb-10">

          <Kpi title="Total Members" value={analytics?.summary.total} />

          <Kpi
            title="Approved"
            value={analytics?.summary.approved}
            color="bg-green-600"
          />

          <Kpi
            title="Pending"
            value={analytics?.summary.pending}
            color="bg-amber-500"
          />

          <Kpi
            title="Rejected"
            value={analytics?.summary.rejected}
            color="bg-red-600"
          />

          <Kpi
            title="Approval Rate"
            value={`${approvalRate}%`}
            color="bg-blue-600"
          />

          <Kpi
            title="Pending Rate"
            value={`${pendingRate}%`}
            color="bg-slate-700"
          />
        </div>

        {/* Search */}

        <div className="mb-6">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-3 text-slate-400" size={18} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search member..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg"
            />
          </div>
        </div>

        {/* Charts */}

        <div className="grid lg:grid-cols-2 gap-6 mb-10">

          <ChartCard title="Membership Trend">
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Area dataKey="count" stroke="#3b82f6" fill="#3b82f6" />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Status Distribution">
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={statusPieData} dataKey="value">
                  {statusPieData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Top States">
            <BarChart width={400} height={300} data={topStates}>
              <XAxis dataKey="label" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#3b82f6" />
            </BarChart>
          </ChartCard>

          <ChartCard title="Top Cities">
            <BarChart width={400} height={300} data={topCities}>
              <XAxis dataKey="label" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#64748b" />
            </BarChart>
          </ChartCard>
          <ChartCard title="Top Countries">
            <BarChart width={400} height={300} data={topCountries}>
              <XAxis dataKey="label" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#64748b" />
            </BarChart>
          </ChartCard>
        </div>

        {/* Members Table */}

        <MembersTable members={displayedMembers} />

      </div>
    </div>
  );
}

// ───────────────────────────── Small Components

function Kpi({
  title,
  value,
  color = "bg-slate-900",
}: any) {
  return (
    <div className={`${color} text-white rounded-xl p-5`}>
      <p className="text-sm opacity-80">{title}</p>
      <p className="text-2xl font-bold">{value ?? 0}</p>
    </div>
  );
}

function ChartCard({ title, children }: any) {
  return (
    <div className="bg-white border border-gray-300 rounded-xl p-6">
      <h3 className="font-semibold mb-4">{title}</h3>
      {children}
    </div>
  );
}

function MembersTable({ members }: { members: Membership[] }) {
  return (
    <div className="border border-gray-300 rounded-xl overflow-auto">
      <table className="w-full text-sm">

        <thead className="bg-slate-50">
          <tr>
            <th className="px-6 py-3 text-left">ID</th>
            <th className="px-6 py-3 text-left">Name</th>
            <th className="px-6 py-3 text-left">Status</th>
            <th className="px-6 py-3 text-left">State</th>
            <th className="px-6 py-3 text-left">Phone</th>
            <th className="px-6 py-3 text-left">Created</th>
          </tr>
        </thead>

        <tbody>
          {members.map((m) => (
            <tr key={m.id} className="">

              <td className="px-6 py-3">{m.uniqueMemberId}</td>

              <td className="px-6 py-3">{m.fullName}</td>

              <td className="px-6 py-3">{m.status}</td>

              <td className="px-6 py-3">{m.state}</td>

              <td className="px-6 py-3">{m.phone}</td>

              <td className="px-6 py-3">
                {new Date(m.createdAt).toLocaleDateString()}
              </td>

            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}