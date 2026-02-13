'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { membershipApi, type Membership } from '@/lib/api/membership';
import { useState } from 'react';
import { HiMiniUserGroup as MemberGroup } from "react-icons/hi2";
import { LuTimer as Timer } from "react-icons/lu";
import { RiVerifiedBadgeFill as Verified } from "react-icons/ri";
import { MdCancel as Rejected } from "react-icons/md";





type FilterType = 'all' | 'pending' | 'approved' | 'rejected';

export default function Memberships() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<FilterType>('all');
  const [selectedMember, setSelectedMember] = useState<Membership | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch ALL memberships for stats
  const { data: allMemberships, isLoading, error, refetch } = useQuery({
    queryKey: ['memberships', 'all'],
    queryFn: async () => await membershipApi.getAll(),
    refetchOnMount: 'always',
    retry: 1,
  });

  // Filter memberships by status
  const filteredByStatus = allMemberships?.filter((member) => {
    if (filter === 'all') return true;
    return member.status === filter.toUpperCase();
  });

  // Filter memberships based on search
  const filteredMemberships = filteredByStatus?.filter((member) =>
    member.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.phone.includes(searchQuery)
  );

  // Approve mutation
  const approveMutation = useMutation({
    mutationFn: membershipApi.approve,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['memberships'] });
      setSelectedMember(null);
    },
    onError: (error: unknown) => {
      console.error('Failed to approve membership:', error);
    },
  });

  // Reject mutation
  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      membershipApi.reject(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['memberships'] });
      setSelectedMember(null);
      setShowRejectModal(false);
      setRejectionReason('');
    },
    onError: (error: unknown) => {
      console.error('Failed to reject membership:', error);
    },
  });

  const handleApprove = (id: string) => {
    approveMutation.mutate(id);
  };

  const handleReject = (member: Membership) => {
    setSelectedMember(member);
    setShowRejectModal(true);
  };

  const submitRejection = () => {
    if (selectedMember && rejectionReason.trim()) {
      rejectMutation.mutate({
        id: selectedMember.id,
        reason: rejectionReason,
      });
    }
  };

  const getStatusConfig = (status: string) => {
    const configs = {
      PENDING: {
        bg: 'bg-slate-100',
        text: 'text-slate-700',
        border: 'border-slate-300',
        icon: '⏱️',
      },
      APPROVED: {
        bg: 'bg-emerald-50',
        text: 'text-emerald-700',
        border: 'border-emerald-200',
        icon: '✓',
      },
      REJECTED: {
        bg: 'bg-rose-50',
        text: 'text-rose-700',
        border: 'border-rose-200',
        icon: '✕',
      },
    };
    return configs[status as keyof typeof configs] || {
      bg: 'bg-gray-50',
      text: 'text-gray-700',
      border: 'border-gray-200',
      icon: '•',
    };
  };

  const stats = {
    total: allMemberships?.length || 0,
    pending: allMemberships?.filter((m) => m.status === 'PENDING').length || 0,
    approved: allMemberships?.filter((m) => m.status === 'APPROVED').length || 0,
    rejected: allMemberships?.filter((m) => m.status === 'REJECTED').length || 0,
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-slate-200 rounded-full"></div>
            <div className="w-16 h-16 border-4 border-[#0DE65A] border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
          </div>
          <div className="text-slate-600 font-medium">Loading memberships...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl  max-w-md border border-slate-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-2xl">
              ⚠️
            </div>
            <div className="text-xl font-semibold text-slate-900">Connection Error</div>
          </div>
          <div className="text-slate-600 mb-6">
            {error instanceof Error ? error.message : 'Unable to load membership data'}
          </div>
          <div className="bg-slate-50 rounded-lg p-4 mb-6">
            <div className="text-sm font-medium text-slate-700 mb-2">Please verify:</div>
            <ul className="space-y-1 text-sm text-slate-600">
              <li className="flex items-center gap-2">
                <span className="text-slate-400">•</span> API server is running
              </li>
              <li className="flex items-center gap-2">
                <span className="text-slate-400">•</span> Correct API endpoint
              </li>
              <li className="flex items-center gap-2">
                <span className="text-slate-400">•</span> Valid authentication
              </li>
            </ul>
          </div>
          <button
            onClick={() => refetch()}
            className="w-full px-6 py-3 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-all duration-200 font-medium"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 w-screen md:w-full">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-40 backdrop-blur-xl bg-white/80 ">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">
                Membership Management
              </h1>
              <p className="text-slate-500 mt-1">Manage and review membership applications</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search members..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2.5 bg-slate-100 border-0 rounded-lg text-sm focus:ring-2 focus:ring-[#0DE65A] focus:bg-white transition-all duration-200 w-64"
                />
                <svg
                  className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              <button
                onClick={() => refetch()}
                disabled={isLoading}
                className="px-4 py-2.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all duration-200 flex items-center gap-2 font-medium disabled:opacity-50"
              >
                <svg
                  className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards - Static */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl border border-slate-200 ">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600 text-xl">
                <MemberGroup size={18} />
              </div>
              <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                Total
              </div>
            </div>
            <div className="text-3xl font-bold text-slate-900 mb-1">{stats.total}</div>
            <div className="text-sm text-slate-500">All Members</div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200 ">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600 text-xl">
                <Timer />
              </div>
              <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                Pending
              </div>
            </div>
            <div className="text-3xl font-bold text-slate-900 mb-1">{stats.pending}</div>
            <div className="text-sm text-slate-500">Awaiting Review</div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200 ">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 text-xl">
                <Verified />
              </div>
              <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                Approved
              </div>
            </div>
            <div className="text-3xl font-bold text-slate-900 mb-1">{stats.approved}</div>
            <div className="text-sm text-slate-500">Active Members</div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200 ">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 rounded-lg bg-rose-50 flex items-center justify-center text-rose-600 text-xl">
                <Rejected />
              </div>
              <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                Rejected
              </div>
            </div>
            <div className="text-3xl font-bold text-slate-900 mb-1">{stats.rejected}</div>
            <div className="text-sm text-slate-500">Declined</div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="mb-6">
          <div className="bg-white rounded-xl border border-slate-200 p-1.5 inline-flex gap-1 max-w-full overflow-x-auto">
            <button
              onClick={() => setFilter('all')}
              className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
                filter === 'all'
                  ? 'bg-[#0DE65A] text-slate-900'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              All Members
              <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-bold ${
                filter === 'all' 
                  ? 'bg-slate-900/10 text-slate-900' 
                  : 'bg-slate-100 text-slate-600'
              }`}>
                {stats.total}
              </span>
            </button>
            <button
              onClick={() => setFilter('pending')}
              className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
                filter === 'pending'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              Pending
              <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-bold ${
                filter === 'pending' 
                  ? 'bg-white/20 text-white' 
                  : 'bg-slate-100 text-slate-600'
              }`}>
                {stats.pending}
              </span>
            </button>
            <button
              onClick={() => setFilter('approved')}
              className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
                filter === 'approved'
                  ? 'bg-emerald-600 text-white'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              Approved
              <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-bold ${
                filter === 'approved' 
                  ? 'bg-white/20 text-white' 
                  : 'bg-slate-100 text-slate-600'
              }`}>
                {stats.approved}
              </span>
            </button>
            <button
              onClick={() => setFilter('rejected')}
              className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
                filter === 'rejected'
                  ? 'bg-rose-600 text-white'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              Rejected
              <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-bold ${
                filter === 'rejected' 
                  ? 'bg-white/20 text-white' 
                  : 'bg-slate-100 text-slate-600'
              }`}>
                {stats.rejected}
              </span>
            </button>
          </div>
        </div>

        {/* Filter Info */}
        <div className="mb-4 flex items-center gap-2">
          <div className="text-sm text-slate-600">
            Showing <span className="font-semibold text-slate-900">{filteredMemberships?.length || 0}</span>{' '}
            {filter !== 'all' && <span className="text-slate-500">({filter})</span>}{' '}
            {filteredMemberships?.length === 1 ? 'member' : 'members'}
          </div>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="text-xs px-2 py-1 bg-slate-100 text-slate-600 rounded-md hover:bg-slate-200 transition-colors"
            >
              Clear search
            </button>
          )}
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl  border border-slate-200">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Member
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Applied
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredMemberships && filteredMemberships.length > 0 ? (
                  filteredMemberships.map((member) => {
                    const statusConfig = getStatusConfig(member.status);
                    return (
                      <tr
                        key={member.id}
                        className="hover:bg-slate-50/50 transition-colors group"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 font-semibold text-sm">
                              {member.fullName.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="text-sm font-semibold text-slate-900">
                                {member.fullName}
                              </div>
                              <div className="text-xs text-slate-500">{member.occupation}</div>
                              {member.bloodGroup && (
                                <div className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 bg-red-50 text-red-700 rounded text-xs font-medium">
                                  <span>🩸</span>
                                  {member.bloodGroup}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-slate-900">{member.email}</div>
                          <div className="text-sm text-slate-500">{member.phone}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-slate-900">{member.zone}</div>
                          <div className="text-xs text-slate-500">
                            {member.district}, {member.state}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full border ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border}`}
                          >
                            <span>{statusConfig.icon}</span>
                            {member.status}
                          </span>
                          {member.status === 'REJECTED' && member.rejectionReason && (
                            <div className="text-xs text-rose-600 mt-2 max-w-xs line-clamp-2">
                              {member.rejectionReason}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600 whitespace-nowrap">
                          {new Date(member.createdAt).toLocaleDateString('en-GB', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => setSelectedMember(member)}
                              className="px-3 py-1.5 text-sm font-medium bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
                            >
                              View
                            </button>
                            {member.status === 'PENDING' && (
                              <>
                                <button
                                  onClick={() => handleApprove(member.id)}
                                  disabled={approveMutation.isPending}
                                  className="px-3 py-1.5 text-sm font-medium bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={() => handleReject(member)}
                                  disabled={rejectMutation.isPending}
                                  className="px-3 py-1.5 text-sm font-medium bg-rose-50 text-rose-700 rounded-lg hover:bg-rose-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  Reject
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center gap-4">
                        <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center text-4xl">
                          {searchQuery ? '🔍' : '👥'}
                        </div>
                        <div>
                          <div className="text-slate-900 text-lg font-semibold mb-1">
                            {searchQuery ? 'No results found' : 'No members found'}
                          </div>
                          <div className="text-slate-500 text-sm">
                            {searchQuery
                              ? 'Try adjusting your search terms'
                              : filter !== 'all'
                              ? `No ${filter} memberships at the moment`
                              : 'No membership applications yet'}
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* View Member Modal */}
      {selectedMember && !showRejectModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden  animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="bg-slate-900 px-8 py-6 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-[#0DE65A] flex items-center justify-center text-slate-900 text-2xl font-bold">
                    {selectedMember.fullName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">{selectedMember.fullName}</h2>
                    <p className="text-slate-300 text-sm">{selectedMember.occupation}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedMember(null)}
                  className="w-10 h-10 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors text-white"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-8 overflow-y-auto max-h-[calc(90vh-200px)]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Personal Information */}
                <div className="bg-slate-50 rounded-xl p-5 space-y-4">
                  <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4">
                    Personal Details
                  </h3>
                  
                  <div>
                    <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Date of Birth</label>
                    <p className="text-slate-900 font-medium mt-1">
                      {new Date(selectedMember.dob).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </p>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Blood Group</label>
                    <p className="text-slate-900 font-medium mt-1">
                      {selectedMember.bloodGroup || 'Not specified'}
                    </p>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Aadhar Number</label>
                    <p className="text-slate-900 font-medium mt-1 font-mono">
                      {selectedMember.aadharNumber}
                    </p>
                  </div>
                </div>

                {/* Contact Information */}
                <div className="bg-slate-50 rounded-xl p-5 space-y-4">
                  <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4">
                    Contact Details
                  </h3>
                  
                  <div>
                    <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Email Address</label>
                    <p className="text-slate-900 font-medium mt-1 break-all">{selectedMember.email}</p>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Phone Number</label>
                    <p className="text-slate-900 font-medium mt-1">{selectedMember.phone}</p>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Status</label>
                    <div className="mt-2">
                      {(() => {
                        const config = getStatusConfig(selectedMember.status);
                        return (
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-full border ${config.bg} ${config.text} ${config.border}`}>
                            <span>{config.icon}</span>
                            {selectedMember.status}
                          </span>
                        );
                      })()}
                    </div>
                  </div>
                </div>

                {/* Address */}
                <div className="md:col-span-2 bg-slate-50 rounded-xl p-5">
                  <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4">
                    Address Information
                  </h3>
                  
                  <div className="mb-4">
                    <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Full Address</label>
                    <p className="text-slate-900 font-medium mt-1">{selectedMember.address}</p>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Zone</label>
                      <p className="text-slate-900 font-medium mt-1">{selectedMember.zone}</p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">District</label>
                      <p className="text-slate-900 font-medium mt-1">{selectedMember.district}</p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">State</label>
                      <p className="text-slate-900 font-medium mt-1">{selectedMember.state}</p>
                    </div>
                  </div>
                </div>

                {/* Social Media */}
                {(selectedMember.instagramId || selectedMember.xTwitterId) && (
                  <div className="md:col-span-2 bg-slate-50 rounded-xl p-5">
                    <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4">
                      Social Media
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      {selectedMember.instagramId && (
                        <div>
                          <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Instagram</label>
                          <p className="text-slate-900 font-medium mt-1">@{selectedMember.instagramId}</p>
                        </div>
                      )}
                      {selectedMember.xTwitterId && (
                        <div>
                          <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">X (Twitter)</label>
                          <p className="text-slate-900 font-medium mt-1">@{selectedMember.xTwitterId}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Rejection Reason */}
                {selectedMember.status === 'REJECTED' && selectedMember.rejectionReason && (
                  <div className="md:col-span-2 bg-rose-50 border border-rose-200 rounded-xl p-5">
                    <h3 className="text-sm font-semibold text-rose-900 uppercase tracking-wider mb-2">
                      Rejection Reason
                    </h3>
                    <p className="text-rose-900">{selectedMember.rejectionReason}</p>
                  </div>
                )}

                {/* Timeline */}
                <div className="md:col-span-2 bg-slate-50 rounded-xl p-5">
                  <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4">
                    Timeline
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Applied On</label>
                      <p className="text-slate-900 font-medium mt-1">
                        {new Date(selectedMember.createdAt).toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                    {selectedMember.reviewedAt && (
                      <div>
                        <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Reviewed On</label>
                        <p className="text-slate-900 font-medium mt-1">
                          {new Date(selectedMember.reviewedAt).toLocaleDateString('en-GB', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            {selectedMember.status === 'PENDING' && (
              <div className="bg-slate-50 px-8 py-6 border-t border-slate-200 flex gap-3">
                <button
                  onClick={() => handleApprove(selectedMember.id)}
                  disabled={approveMutation.isPending}
                  className="flex-1 px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-all duration-200 font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {approveMutation.isPending ? (
                    <>
                      <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Approving...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Approve Membership
                    </>
                  )}
                </button>
                <button
                  onClick={() => setShowRejectModal(true)}
                  disabled={rejectMutation.isPending}
                  className="flex-1 px-6 py-3 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-all duration-200 font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Reject Membership
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && selectedMember && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full  animate-in zoom-in-95 duration-200">
            <div className="p-8">
              <div className="w-14 h-14 rounded-full bg-rose-100 flex items-center justify-center text-2xl mb-4 mx-auto">
                ⚠️
              </div>
              <h3 className="text-2xl font-bold text-slate-900 text-center mb-2">
                Reject Membership
              </h3>
              <p className="text-slate-600 text-center mb-6">
                Please provide a reason for rejecting <span className="font-semibold">{selectedMember.fullName}&apos;s</span> membership application
              </p>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-[#0DE65A] focus:border-transparent resize-none transition-all duration-200 text-slate-900 placeholder:text-slate-400"
                rows={4}
                placeholder="Enter detailed rejection reason..."
                autoFocus
              />
              <div className="text-xs text-slate-500 mt-2 mb-6">
                This reason will be visible to the applicant
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowRejectModal(false);
                    setRejectionReason('');
                  }}
                  className="flex-1 px-6 py-3 border-2 border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-all duration-200 font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={submitRejection}
                  disabled={!rejectionReason.trim() || rejectMutation.isPending}
                  className="flex-1 px-6 py-3 bg-rose-600 text-white rounded-xl hover:bg-rose-700 transition-all duration-200 font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {rejectMutation.isPending ? (
                    <>
                      <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Rejecting...
                    </>
                  ) : (
                    'Confirm Rejection'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}