'use client';

import { usersApi } from '@/lib/api/users';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import {
  Eye,
  Pencil,
  Shield,
  Users,
  CheckCircle,
  XCircle,
  Loader2,
  Search,
  RefreshCw,
  Plus,
  X,
} from 'lucide-react';

// ──────────────────────────────────────────────── Types

interface User {
  id: string;
  email: string;
  roles: UserRole[];
  createdAt: string;
  updatedAt?: string;
  isActive: boolean;
}

interface UserRole {
  role?: { id?: string; name: string; description?: string };
  id?: string;
  name?: string;
  description?: string;
}

interface Role {
  id: string;
  name: string;
  description?: string;
}

interface CreateUserDto {
  email: string;
  password: string;
  roleIds?: string[];
}

interface UpdateUserDto {
  password?: string;
  isActive?: boolean;
}

// ──────────────────────────────────────────────── Main Component

export default function UsersManagement() {
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState('');
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showRolesModal, setShowRolesModal] = useState(false);

  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  // Form states
  const [createForm, setCreateForm] = useState<CreateUserDto>({
    email: '',
    password: '',
    roleIds: [],
  });

  const [editForm, setEditForm] = useState<UpdateUserDto>({
    password: '',
    isActive: true,
  });

  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([]);

  // Hardcoded roles (as per your original code)
  const availableRoles: Role[] = [
    { id: 'SUPER_ADMIN', name: 'SUPER_ADMIN', description: 'Full system access with all permissions' },
    { id: 'ADMIN', name: 'ADMIN', description: 'Administrative access to manage users and content' },
    { id: 'MODERATOR', name: 'MODERATOR', description: 'Can moderate and manage content' },
    { id: 'PR', name: 'PR', description: 'Public Relations access for news and communications' },
  ];

  // Helper to normalize role data (nested or flat)
  const getRoleInfo = (roleItem: UserRole) => {
    if (roleItem.role) {
      return {
        id: roleItem.role.id || '',
        name: roleItem.role.name,
        description: roleItem.role.description,
      };
    }
    return {
      id: roleItem.id || '',
      name: roleItem.name || '',
      description: roleItem.description,
    };
  };

  // ──────────────────────────────────────────────── Data Fetching

  const { data: users, isLoading, error, refetch } = useQuery({
    queryKey: ['users'],
    queryFn: usersApi.getAll,
    refetchOnMount: 'always',
  });

  // Filter + search logic
  useEffect(() => {
    if (!users) return;

    let result = [...users];

    // Status filter
    if (statusFilter === 'active') {
      result = result.filter((u) => u.isActive);
    } else if (statusFilter === 'inactive') {
      result = result.filter((u) => !u.isActive);
    }

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((u) => {
        if (u.email.toLowerCase().includes(q)) return true;
        return u.roles?.some((r) => {
          const name = r.role?.name || r.name;
          return name?.toLowerCase().includes(q);
        });
      });
    }

    setFilteredUsers(result);
  }, [users, searchQuery, statusFilter]);

  const stats = {
    total: users?.length || 0,
    active: users?.filter((u) => u.isActive).length || 0,
    inactive: users?.filter((u) => !u.isActive).length || 0,
  };

  // ──────────────────────────────────────────────── Mutations

  const createMutation = useMutation({
    mutationFn: async (data: CreateUserDto) => {
      const { roleIds, ...userData } = data;
      const newUser = await usersApi.create(userData);
      if (roleIds?.length) {
        await usersApi.assignRoles(newUser.id, roleIds);
      }
      return newUser;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setShowCreateModal(false);
      setCreateForm({ email: '', password: '', roleIds: [] });
    },
    onError: (err) => {
      console.error('Create user failed:', err);
      alert('Failed to create user');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateUserDto }) =>
      usersApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setShowEditModal(false);
      setSelectedUser(null);
    },
  });

  const assignRolesMutation = useMutation({
    mutationFn: ({ id, roleIds }: { id: string; roleIds: string[] }) =>
      usersApi.assignRoles(id, roleIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setShowRolesModal(false);
      setSelectedUser(null);
    },
  });

  // ──────────────────────────────────────────────── Handlers

  const handleCreate = () => createMutation.mutate(createForm);

  const handleUpdate = () => {
    if (selectedUser) {
      updateMutation.mutate({ id: selectedUser.id, data: editForm });
    }
  };

  const handleSaveRoles = () => {
    if (selectedUser) {
      assignRolesMutation.mutate({ id: selectedUser.id, roleIds: selectedRoleIds });
    }
  };

  const openEdit = (user: User) => {
    setSelectedUser(user);
    setEditForm({ password: '', isActive: user.isActive });
    setShowEditModal(true);
  };

  const openView = (user: User) => {
    setSelectedUser(user);
    setShowViewModal(true);
  };

  const openRoles = (user: User) => {
    const currentIds = user.roles
      ?.map(getRoleInfo)
      .map((r) => availableRoles.find((ar) => ar.name === r.name || ar.id === r.id)?.id || r.id)
      .filter(Boolean) as string[];

    setSelectedUser(user);
    setSelectedRoleIds(currentIds);
    setShowRolesModal(true);
  };

  const toggleActive = (user: User) => {
    updateMutation.mutate({
      id: user.id,
      data: { isActive: !user.isActive },
    });
  };

  // ──────────────────────────────────────────────── Render

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState error={error} onRetry={refetch} />;

  return (
    <div className="min-h-screen bg-gray-50/70 pb-12 w-screen md:w-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-10">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">User Management</h1>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => refetch()}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2 text-sm font-medium"
            >
              <RefreshCw size={16} /> Refresh
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-5 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 flex items-center gap-2 text-sm font-medium"
            >
              <Plus size={16} /> Add User
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-6 mb-8">
          <StatCard icon={<Users size={20} />} label="Total" value={stats.total} color="gray" />
          <StatCard icon={<CheckCircle size={20} />} label="Active" value={stats.active} color="green" />
          <StatCard icon={<XCircle size={20} />} label="Inactive" value={stats.inactive} color="gray" />
        </div>

        {/* Search + Status Filter */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          {/* Search */}
          <div className="relative flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by email or role..."
              className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent text-sm"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X size={18} />
              </button>
            )}
          </div>

          {/* Status pills */}
          <div className="flex items-center gap-1.5 bg-gray-100 rounded-lg p-1 overflow-x-auto scrollbar-thin">
            {['all', 'active', 'inactive'].map((f) => (
              <button
                key={f}
                onClick={() => setStatusFilter(f as any)}
                className={`px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-all ${
                  statusFilter === f
                    ? 'bg-white shadow text-gray-900'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <p className="text-sm text-gray-600 mb-5">
          Showing <strong>{filteredUsers.length}</strong> of <strong>{users?.length || 0}</strong> users
        </p>

        {/* Table */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 sm:px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-4 sm:px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Roles
                  </th>
                  <th className="px-4 sm:px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 sm:px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider hidden sm:table-cell">
                    Created
                  </th>
                  <th className="px-4 sm:px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 sm:px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-700 font-medium text-sm shrink-0">
                            {user.email.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="text-sm font-medium text-gray-900 truncate">{user.email}</div>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 sm:px-6 py-4">
                        <div className="flex flex-wrap gap-1.5">
                          {user.roles?.length ? (
                            user.roles.map((r, idx) => {
                              const info = getRoleInfo(r);
                              return (
                                <span
                                  key={idx}
                                  className="px-2.5 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                                >
                                  {info.name}
                                </span>
                              );
                            })
                          ) : (
                            <span className="text-xs text-gray-400">—</span>
                          )}
                        </div>
                      </td>

                      <td className="px-4 sm:px-6 py-4">
                        <button
                          onClick={() => toggleActive(user)}
                          disabled={updateMutation.isPending}
                          className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                            user.isActive
                              ? 'bg-green-50 text-green-700 border border-green-200 hover:bg-green-100'
                              : 'bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200'
                          } disabled:opacity-60`}
                        >
                          <div className={`w-2 h-2 rounded-full ${user.isActive ? 'bg-green-500' : 'bg-gray-400'}`} />
                          {user.isActive ? 'Active' : 'Inactive'}
                        </button>
                      </td>

                      <td className="px-4 sm:px-6 py-4 text-sm text-gray-600 hidden sm:table-cell whitespace-nowrap">
                        {new Date(user.createdAt).toLocaleDateString('en-GB', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>

                      <td className="px-4 sm:px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5 flex-wrap">
                          <button
                            onClick={() => openView(user)}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            title="View details"
                          >
                            <Eye size={18} className="text-gray-600" />
                          </button>
                          <button
                            onClick={() => openEdit(user)}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Edit user"
                          >
                            <Pencil size={18} className="text-gray-600" />
                          </button>
                          <button
                            onClick={() => openRoles(user)}
                            className="px-3 py-1.5 text-xs font-medium bg-gray-100 hover:bg-gray-200 border border-gray-200 rounded-lg flex items-center gap-1.5"
                          >
                            <Shield size={16} />
                            <span className="hidden sm:inline">Roles</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-16 text-center text-gray-500">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
                          {searchQuery || statusFilter !== 'all' ? (
                            <Search size={32} className="text-gray-400" />
                          ) : (
                            <Users size={32} className="text-gray-400" />
                          )}
                        </div>
                        <p className="font-medium">
                          {searchQuery || statusFilter !== 'all'
                            ? 'No users match your filters'
                            : 'No users found'}
                        </p>
                        {(searchQuery || statusFilter !== 'all') && (
                          <button
                            onClick={() => {
                              setSearchQuery('');
                              setStatusFilter('all');
                            }}
                            className="mt-2 text-sm text-blue-600 hover:underline"
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
      </div>

      {/* ───────────────────────────────────────────── Modals ───────────────────────────────────────────── */}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Create New User</h2>
            </div>
            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={createForm.email}
                  onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900"
                  placeholder="user@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Password <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  value={createForm.password}
                  onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900"
                  placeholder="••••••••"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Assign Roles (optional)</label>
                <div className="border border-gray-200 rounded-lg p-4 max-h-64 overflow-y-auto space-y-2">
                  {availableRoles.map((role) => (
                    <label
                      key={role.id}
                      className="flex items-start gap-3 p-2.5 hover:bg-gray-50 rounded cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={createForm.roleIds?.includes(role.id) ?? false}
                        onChange={(e) => {
                          const ids = createForm.roleIds || [];
                          setCreateForm({
                            ...createForm,
                            roleIds: e.target.checked ? [...ids, role.id] : ids.filter((id: string) => id !== role.id),
                          });
                        }}
                        className="w-5 h-5 mt-0.5 rounded text-gray-900"
                      />
                      <div>
                        <div className="font-medium text-gray-900">{role.name}</div>
                        {role.description && <div className="text-xs text-gray-500">{role.description}</div>}
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div className="p-6 border-t flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setCreateForm({ email: '', password: '', roleIds: [] });
                }}
                className="px-5 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm font-medium"
                disabled={createMutation.isPending}
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={createMutation.isPending || !createForm.email || !createForm.password}
                className="px-6 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 text-sm font-medium"
              >
                {createMutation.isPending ? 'Creating…' : 'Create User'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl w-full max-w-lg">
            <div className="p-6 border-b">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Edit User</h2>
            </div>
            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                <input
                  type="email"
                  value={selectedUser.email}
                  disabled
                  className="w-full px-4 py-2.5 bg-gray-100 border border-gray-300 rounded-lg text-gray-500 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">New Password (optional)</label>
                <input
                  type="password"
                  value={editForm.password || ''}
                  onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900"
                  placeholder="Leave blank to keep current"
                />
              </div>

              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={editForm.isActive ?? false}
                    onChange={(e) => setEditForm({ ...editForm, isActive: e.target.checked })}
                    className="w-4 h-4 text-gray-900 rounded border-gray-300"
                  />
                  <label className="text-sm font-medium text-gray-700 cursor-pointer">Active account</label>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setEditForm((p) => ({ ...p, isActive: false }))}
                    className={`px-3 py-1.5 text-xs rounded-lg border ${
                      !editForm.isActive ? 'bg-gray-200 border-gray-300' : 'border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    Deactivate
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditForm((p) => ({ ...p, isActive: true }))}
                    className={`px-3 py-1.5 text-xs rounded-lg border ${
                      editForm.isActive ? 'bg-green-50 border-green-200 text-green-700' : 'border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    Activate
                  </button>
                </div>
              </div>
            </div>
            <div className="p-6 border-t flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedUser(null);
                }}
                className="px-5 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdate}
                disabled={updateMutation.isPending}
                className="px-6 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 text-sm font-medium"
              >
                {updateMutation.isPending ? 'Updating…' : 'Update User'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Modal */}
      {showViewModal && selectedUser && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white p-6 border-b flex items-center justify-between z-10">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">User Details</h2>
              <button
                onClick={() => {
                  setShowViewModal(false);
                  setSelectedUser(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gray-100 flex items-center justify-center text-gray-700 font-bold text-xl sm:text-2xl shrink-0">
                  {selectedUser.email.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900">{selectedUser.email}</h3>
                  <span
                    className={`inline-flex items-center gap-2 px-3 py-1 mt-2 rounded-lg text-xs font-medium ${
                      selectedUser.isActive
                        ? 'bg-green-50 text-green-700 border border-green-200'
                        : 'bg-gray-100 text-gray-600 border border-gray-200'
                    }`}
                  >
                    <div className={`w-2 h-2 rounded-full ${selectedUser.isActive ? 'bg-green-500' : 'bg-gray-400'}`} />
                    {selectedUser.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Assigned Roles</label>
                <div className="flex flex-wrap gap-2">
                  {selectedUser.roles?.length ? (
                    selectedUser.roles.map((r, i) => {
                      const info = getRoleInfo(r);
                      const desc = availableRoles.find((ar) => ar.name === info.name)?.description;
                      return (
                        <div
                          key={i}
                          className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg"
                        >
                          <div className="font-medium text-gray-900">{info.name}</div>
                          {desc && <div className="text-xs text-gray-500 mt-0.5">{desc}</div>}
                        </div>
                      );
                    })
                  ) : (
                    <span className="text-sm text-gray-400">No roles assigned</span>
                  )}
                </div>
              </div>

              <div className="border-t pt-5 space-y-4 text-sm">
                <div>
                  <div className="text-xs text-gray-500 mb-1">User ID</div>
                  <div className="font-mono text-gray-900">{selectedUser.id}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">Created</div>
                  <div className="text-gray-900">
                    {new Date(selectedUser.createdAt).toLocaleString('en-GB', {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })}
                  </div>
                </div>
                {selectedUser.updatedAt && (
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Last Updated</div>
                    <div className="text-gray-900">
                      {new Date(selectedUser.updatedAt).toLocaleString('en-GB', {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Roles Modal */}
      {showRolesModal && selectedUser && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl w-full max-w-lg">
            <div className="p-6 border-b">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Manage Roles</h2>
              <p className="text-gray-600 mt-1">
                for <span className="font-semibold">{selectedUser.email}</span>
              </p>
            </div>

            <div className="p-6">
              <div className="border border-gray-200 rounded-lg p-4 max-h-80 overflow-y-auto space-y-2">
                {availableRoles.map((role) => (
                  <label
                    key={role.id}
                    className="flex items-start gap-3 p-3 hover:bg-gray-50 rounded cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedRoleIds.includes(role.id)}
                      onChange={(e) => {
                        setSelectedRoleIds(
                          e.target.checked
                            ? [...selectedRoleIds, role.id]
                            : selectedRoleIds.filter((id) => id !== role.id)
                        );
                      }}
                      className="w-5 h-5 mt-0.5 rounded text-gray-900"
                    />
                    <div>
                      <div className="font-medium text-gray-900">{role.name}</div>
                      {role.description && <div className="text-xs text-gray-500">{role.description}</div>}
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="p-6 border-t flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowRolesModal(false);
                  setSelectedUser(null);
                }}
                className="px-5 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveRoles}
                disabled={assignRolesMutation.isPending}
                className="px-6 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 text-sm font-medium"
              >
                {assignRolesMutation.isPending ? 'Saving…' : 'Save Roles'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────── Helper Components

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: 'gray' | 'green';
}) {
  const styles = {
    gray: 'bg-gray-100 text-gray-600',
    green: 'bg-green-50 text-green-600',
  };

  return (
    <div className="bg-white p-5 sm:p-6 rounded-xl border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 rounded-lg ${styles[color]} flex items-center justify-center`}>
          {icon}
        </div>
        <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">{label}</div>
      </div>
      <div className="text-3xl font-bold text-gray-900">{value}</div>
      <div className="text-sm text-gray-500 mt-1">{label} Users</div>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-gray-900" />
        <p className="text-gray-600">Loading users...</p>
      </div>
    </div>
  );
}

function ErrorState({ error, onRetry }: { error: unknown; onRetry: () => void }) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-xl border border-red-100 max-w-md text-center">
        <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-900 mb-2">Error Loading Users</h2>
        <p className="text-gray-600 mb-6">
          {error instanceof Error ? error.message : 'Something went wrong'}
        </p>
        <button
          onClick={onRetry}
          className="px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}