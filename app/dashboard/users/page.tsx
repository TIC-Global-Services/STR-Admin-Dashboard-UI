'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { membershipApi, type Membership } from '@/lib/api/membership';
import { useState } from 'react';

type FilterType = 'all' | 'pending' | 'approved' | 'rejected';

export default function UsersDashboard() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<FilterType>('all');
  const [selectedMember, setSelectedMember] = useState<Membership | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  // Fetch memberships based on filter
  const { data: memberships, isLoading, error, refetch } = useQuery({
    queryKey: ['memberships', filter],
    queryFn: async () => {
      switch (filter) {
        case 'pending':
          return await membershipApi.getPending();
        case 'approved':
          return await membershipApi.getApproved();
        case 'rejected':
          return await membershipApi.getRejected();
        default:
          return await membershipApi.getAll();
      }
    },
    refetchOnMount: 'always',
    retry: 1,
  });

  // Approve mutation
  const approveMutation = useMutation({
    mutationFn: membershipApi.approve,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['memberships'] });
      setSelectedMember(null);
      alert('Membership approved successfully!');
    },
    onError: (error: unknown) => {
      console.error('Failed to approve membership:', error);
      let errorMessage = 'Failed to approve membership. Please try again.';
      
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { data?: { message?: string }; status?: number } };
        if (axiosError.response?.data?.message) {
          errorMessage = axiosError.response.data.message;
        } else if (axiosError.response?.status === 400) {
          errorMessage = 'Invalid request. The membership may not exist in the external system.';
        }
      }
      
      alert(errorMessage);
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
      alert('Membership rejected successfully!');
    },
    onError: (error: unknown) => {
      console.error('Failed to reject membership:', error);
      let errorMessage = 'Failed to reject membership. Please try again.';
      
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { data?: { message?: string }; status?: number } };
        if (axiosError.response?.data?.message) {
          errorMessage = axiosError.response.data.message;
        } else if (axiosError.response?.status === 400) {
          errorMessage = 'Invalid request. The membership may not exist in the external system.';
        }
      }
      
      alert(errorMessage);
    },
  });

  const handleApprove = (id: string) => {
    if (confirm('Are you sure you want to approve this membership?')) {
      approveMutation.mutate(id);
    }
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

  const getStatusBadge = (status: string) => {
    const badges = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      APPROVED: 'bg-green-100 text-green-800',
      REJECTED: 'bg-red-100 text-red-800',
    };
    return badges[status as keyof typeof badges] || 'bg-gray-100 text-gray-800';
  };

  const stats = {
    total: memberships?.length || 0,
    pending: memberships?.filter((m) => m.status === 'PENDING').length || 0,
    approved: memberships?.filter((m) => m.status === 'APPROVED').length || 0,
    rejected: memberships?.filter((m) => m.status === 'REJECTED').length || 0,
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <div className="text-gray-600">Loading memberships...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md">
          <div className="text-red-600 text-xl font-semibold mb-4">
            ⚠️ Error Loading Memberships
          </div>
          <div className="text-gray-700 mb-4">
            {error instanceof Error ? error.message : 'Failed to load membership data'}
          </div>
          <div className="text-sm text-gray-500 mb-6">
            Please check:
            <ul className="list-disc list-inside mt-2">
              <li>Your API server is running</li>
              <li>The API URL is correct</li>
              <li>You have proper authentication</li>
            </ul>
          </div>
          <button
            onClick={() => refetch()}
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
          <h1 className="text-4xl font-bold text-gray-900">Membership Management</h1>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors flex items-center gap-2"
            disabled={isLoading}
          >
            <span className={isLoading ? 'animate-spin' : ''}>🔄</span>
            Refresh
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div
            className={`bg-white p-6 rounded-lg shadow-sm cursor-pointer transition-all ${
              filter === 'all' ? 'ring-2 ring-blue-500' : 'hover:shadow-md'
            }`}
            onClick={() => setFilter('all')}
          >
            <div className="text-gray-500 text-sm font-medium mb-2">Total Members</div>
            <div className="text-3xl font-bold text-gray-900">{stats.total}</div>
          </div>

          <div
            className={`bg-white p-6 rounded-lg shadow-sm cursor-pointer transition-all ${
              filter === 'pending' ? 'ring-2 ring-yellow-500' : 'hover:shadow-md'
            }`}
            onClick={() => setFilter('pending')}
          >
            <div className="text-gray-500 text-sm font-medium mb-2">Pending</div>
            <div className="text-3xl font-bold text-yellow-600">{stats.pending}</div>
          </div>

          <div
            className={`bg-white p-6 rounded-lg shadow-sm cursor-pointer transition-all ${
              filter === 'approved' ? 'ring-2 ring-green-500' : 'hover:shadow-md'
            }`}
            onClick={() => setFilter('approved')}
          >
            <div className="text-gray-500 text-sm font-medium mb-2">Approved</div>
            <div className="text-3xl font-bold text-green-600">{stats.approved}</div>
          </div>

          <div
            className={`bg-white p-6 rounded-lg shadow-sm cursor-pointer transition-all ${
              filter === 'rejected' ? 'ring-2 ring-red-500' : 'hover:shadow-md'
            }`}
            onClick={() => setFilter('rejected')}
          >
            <div className="text-gray-500 text-sm font-medium mb-2">Rejected</div>
            <div className="text-3xl font-bold text-red-600">{stats.rejected}</div>
          </div>
        </div>

        {/* Filter Info */}
        <div className="mb-4 text-gray-600">
          Showing {memberships?.length || 0}{' '}
          {filter !== 'all' ? filter : ''} {memberships?.length === 1 ? 'member' : 'members'}
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                    Member Info
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                    Contact
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                    Location
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                    Applied On
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {memberships && memberships.length > 0 ? (
                  memberships.map((member) => (
                    <tr key={member.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {member.fullName}
                          </div>
                          <div className="text-sm text-gray-500">
                            {member.occupation}
                          </div>
                          {member.bloodGroup && (
                            <div className="text-xs text-gray-400 mt-1">
                              Blood: {member.bloodGroup}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{member.email}</div>
                        <div className="text-sm text-gray-500">{member.phone}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{member.zone}</div>
                        <div className="text-sm text-gray-500">
                          {member.district}, {member.state}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${getStatusBadge(
                            member.status
                          )}`}
                        >
                          {member.status}
                        </span>
                        {member.status === 'REJECTED' && member.rejectionReason && (
                          <div className="text-xs text-red-600 mt-1 max-w-xs">
                            Reason: {member.rejectionReason}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">
                        {new Date(member.createdAt).toLocaleDateString('en-GB', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setSelectedMember(member)}
                            className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                          >
                            View
                          </button>
                          {member.status === 'PENDING' && (
                            <>
                              <button
                                onClick={() => handleApprove(member.id)}
                                disabled={approveMutation.isPending}
                                className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors disabled:opacity-50"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleReject(member)}
                                disabled={rejectMutation.isPending}
                                className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors disabled:opacity-50"
                              >
                                Reject
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center gap-4">
                        <div className="text-6xl">👥</div>
                        <div className="text-gray-500 text-lg">No members found</div>
                        <div className="text-gray-400 text-sm">
                          {filter !== 'all'
                            ? `No ${filter} memberships at the moment`
                            : 'No membership applications yet'}
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Member Details</h2>
                <button
                  onClick={() => setSelectedMember(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Full Name</label>
                    <p className="text-gray-900">{selectedMember.fullName}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Date of Birth</label>
                    <p className="text-gray-900">
                      {new Date(selectedMember.dob).toLocaleDateString('en-GB')}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Blood Group</label>
                    <p className="text-gray-900">{selectedMember.bloodGroup || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Occupation</label>
                    <p className="text-gray-900">{selectedMember.occupation}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Aadhar Number</label>
                    <p className="text-gray-900">{selectedMember.aadharNumber}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Email</label>
                    <p className="text-gray-900">{selectedMember.email}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Phone</label>
                    <p className="text-gray-900">{selectedMember.phone}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Status</label>
                    <p>
                      <span
                        className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${getStatusBadge(
                          selectedMember.status
                        )}`}
                      >
                        {selectedMember.status}
                      </span>
                    </p>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">Address</label>
                  <p className="text-gray-900">{selectedMember.address}</p>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Zone</label>
                    <p className="text-gray-900">{selectedMember.zone}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">District</label>
                    <p className="text-gray-900">{selectedMember.district}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">State</label>
                    <p className="text-gray-900">{selectedMember.state}</p>
                  </div>
                </div>

                {(selectedMember.instagramId || selectedMember.xTwitterId) && (
                  <div className="grid grid-cols-2 gap-4">
                    {selectedMember.instagramId && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">Instagram</label>
                        <p className="text-gray-900">{selectedMember.instagramId}</p>
                      </div>
                    )}
                    {selectedMember.xTwitterId && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">X (Twitter)</label>
                        <p className="text-gray-900">{selectedMember.xTwitterId}</p>
                      </div>
                    )}
                  </div>
                )}

                {selectedMember.status === 'REJECTED' && selectedMember.rejectionReason && (
                  <div className="bg-red-50 p-4 rounded-lg">
                    <label className="text-sm font-medium text-red-700">Rejection Reason</label>
                    <p className="text-red-900 mt-1">{selectedMember.rejectionReason}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 text-sm text-gray-500">
                  <div>
                    <label className="font-medium">Applied On</label>
                    <p>
                      {new Date(selectedMember.createdAt).toLocaleString('en-GB')}
                    </p>
                  </div>
                  {selectedMember.reviewedAt && (
                    <div>
                      <label className="font-medium">Reviewed On</label>
                      <p>
                        {new Date(selectedMember.reviewedAt).toLocaleString('en-GB')}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {selectedMember.status === 'PENDING' && (
                <div className="flex gap-3 mt-6 pt-6 border-t">
                  <button
                    onClick={() => handleApprove(selectedMember.id)}
                    disabled={approveMutation.isPending}
                    className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                    {approveMutation.isPending ? 'Approving...' : 'Approve Membership'}
                  </button>
                  <button
                    onClick={() => {
                      setShowRejectModal(true);
                    }}
                    disabled={rejectMutation.isPending}
                    className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                  >
                    Reject Membership
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && selectedMember && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Reject Membership</h3>
            <p className="text-gray-600 mb-4">
              Please provide a reason for rejecting {selectedMember.fullName}&apos;s membership
              application:
            </p>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
              rows={4}
              placeholder="Enter rejection reason..."
            />
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectionReason('');
                }}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={submitRejection}
                disabled={!rejectionReason.trim() || rejectMutation.isPending}
                className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {rejectMutation.isPending ? 'Rejecting...' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}