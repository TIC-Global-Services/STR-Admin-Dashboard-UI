'use client';

import { usersApi } from '@/lib/api/users';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { Eye, Pencil, Shield, Users, CheckCircle, XCircle, Loader2, Search, RefreshCw, Plus, X } from 'lucide-react';

// Types
interface User {
  id: string;
  email: string;
  roles: UserRole[];
  createdAt: string;
  updatedAt?: string;
  isActive: boolean;
}

interface UserRole {
  role?: {
    id?: string;
    name: string;
    description?: string;
  };
  // Alternative flat structure support
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

  // Define available roles (no API needed)
  const availableRoles: Role[] = [
    { id: 'SUPER_ADMIN', name: 'SUPER_ADMIN', description: 'Full system access with all permissions' },
    { id: 'ADMIN', name: 'ADMIN', description: 'Administrative access to manage users and content' },
    { id: 'MODERATOR', name: 'MODERATOR', description: 'Can moderate and manage content' },
    { id: 'PR', name: 'PR', description: 'Public Relations access for news and communications' },
  ];

  // Helper function to extract role information
  const getRoleInfo = (roleItem: UserRole) => {
    if (roleItem.role) {
      return {
        id: roleItem.role.id || '',
        name: roleItem.role.name,
        description: roleItem.role.description
      };
    }
    return {
      id: roleItem.id || '',
      name: roleItem.name || '',
      description: roleItem.description
    };
  };

  // Fetch users
  const { data: users, isLoading, error, refetch } = useQuery({
    queryKey: ['users'],
    queryFn: usersApi.getAll,
    refetchOnMount: 'always',
  });

  // Filter and search effect
  useEffect(() => {
    if (!users) return;
    
    let filtered = [...users];

    // Apply status filter
    if (statusFilter === 'active') {
      filtered = filtered.filter(user => user.isActive);
    } else if (statusFilter === 'inactive') {
      filtered = filtered.filter(user => !user.isActive);
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(user => {
        const emailMatch = user.email?.toLowerCase().includes(query);
        
        // Handle the nested role structure from backend
        const roleMatch = user.roles?.some(roleItem => {
          // Backend returns { role: { name: "SUPER_ADMIN" } }
          const roleName = roleItem.role?.name || roleItem.name;
          return roleName?.toLowerCase().includes(query);
        });
        
        return emailMatch || roleMatch;
      });
    }

    setFilteredUsers(filtered);
  }, [users, searchQuery, statusFilter]);

  // Mutations
  const createMutation = useMutation({
    mutationFn: async (data: CreateUserDto) => {
      const { roleIds, ...userData } = data;
      
      // Create user first without roles
      const newUser = await usersApi.create(userData);
      
      // If roles are selected, assign them separately
      if (roleIds && roleIds.length > 0) {
        await usersApi.assignRoles(newUser.id, roleIds);
      }
      
      return newUser;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setShowCreateModal(false);
      resetCreateForm();
    },
    onError: (error) => {
      console.error('Failed to create user:', error);
      alert('Failed to create user. Please try again.');
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

  const resetCreateForm = () => {
    setCreateForm({
      email: '',
      password: '',
      roleIds: [],
    });
  };

  const handleCreateUser = () => {
    createMutation.mutate(createForm);
  };

  const handleUpdateUser = () => {
    if (selectedUser) {
      updateMutation.mutate({ id: selectedUser.id, data: editForm });
    }
  };

  const handleAssignRoles = () => {
    if (selectedUser) {
      assignRolesMutation.mutate({ id: selectedUser.id, roleIds: selectedRoleIds });
    }
  };

  const openEditModal = (user: User) => {
    setSelectedUser(user);
    setEditForm({
      password: '',
      isActive: user.isActive,
    });
    setShowEditModal(true);
  };

  const openViewModal = (user: User) => {
    setSelectedUser(user);
    setShowViewModal(true);
  };

  const openRolesModal = (user: User) => {
    // Extract role IDs from the user's current roles
    const currentRoleIds = user.roles?.map(roleItem => {
      const roleInfo = getRoleInfo(roleItem);
      // Match against available roles to get the correct ID
      const matchedRole = availableRoles.find(r => 
        r.name === roleInfo.name || r.id === roleInfo.id
      );
      return matchedRole?.id || roleInfo.id || roleInfo.name;
    }).filter(id => id) || [];
    
    setSelectedUser(user);
    setSelectedRoleIds(currentRoleIds);
    setShowRolesModal(true);
  };

  const stats = {
    total: users?.length || 0,
    active: users?.filter((u) => u.isActive).length || 0,
    inactive: users?.filter((u) => !u.isActive).length || 0,
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-gray-900 animate-spin" />
          <div className="text-gray-600 text-sm">Loading users...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-xl border border-gray-200 max-w-md shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
              <XCircle className="w-6 h-6 text-red-600" />
            </div>
            <div className="text-xl font-semibold text-gray-900">Error</div>
          </div>
          <div className="text-gray-600 mb-6">
            {error instanceof Error ? error.message : 'Failed to load users'}
          </div>
          <button
            onClick={() => refetch()}
            className="w-full px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-all font-medium"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-4xl font-bold text-gray-900">User Management</h1>
          <div className="flex items-center gap-3">
            <button
              onClick={() => refetch()}
              className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors text-sm flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-all font-medium text-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Add User</span>
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center text-gray-600">
                <Users className="w-6 h-6" />
              </div>
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">{stats.total}</div>
            <div className="text-sm text-gray-500">Total Users</div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 rounded-lg bg-green-50 flex items-center justify-center text-green-600">
                <CheckCircle className="w-6 h-6" />
              </div>
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                Active
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">{stats.active}</div>
            <div className="text-sm text-gray-500">Active Users</div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center text-gray-600">
                <XCircle className="w-6 h-6" />
              </div>
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                Inactive
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">{stats.inactive}</div>
            <div className="text-sm text-gray-500">Inactive Users</div>
          </div>
        </div>

        {/* Search and Filter Bar */}
        <div className="mb-6 flex items-center gap-4">
          {/* Search Input */}
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Search by email or role..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2.5 pl-10 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent placeholder:text-gray-400 text-gray-900 transition-all"
            />
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Filter Buttons */}
          <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
            <button
              key="filter-all"
              onClick={() => setStatusFilter('all')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                statusFilter === 'all'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              All
            </button>
            <button
              key="filter-active"
              onClick={() => setStatusFilter('active')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                statusFilter === 'active'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Active
            </button>
            <button
              key="filter-inactive"
              onClick={() => setStatusFilter('inactive')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                statusFilter === 'inactive'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Inactive
            </button>
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-4 text-sm text-gray-600">
          Showing {filteredUsers.length} of {users?.length || 0} users
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Roles
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredUsers && filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-700 font-semibold text-sm">
                          {user.email.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {user.roles && user.roles.length > 0 ? (
                          user.roles.map((roleItem, index) => {
                            const roleInfo = getRoleInfo(roleItem);
                            return (
                              <span
                                key={`${user.id}-${roleInfo.id || roleInfo.name}-${index}`}
                                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700"
                              >
                                {roleInfo.name}
                              </span>
                            );
                          })
                        ) : (
                          <span className="text-xs text-gray-400">No roles</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => {
                          const newStatus = !user.isActive;
                          updateMutation.mutate({ 
                            id: user.id, 
                            data: { isActive: newStatus } 
                          });
                        }}
                        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                          user.isActive
                            ? 'text-green-700 bg-green-50 border border-green-200 hover:bg-green-100'
                            : 'text-gray-600 bg-gray-100 border border-gray-200 hover:bg-gray-200'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${user.isActive ? 'bg-green-500' : 'bg-gray-400'}`} />
                        {user.isActive ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">
                      {new Date(user.createdAt).toLocaleDateString('en-US', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openViewModal(user)}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                          title="View"
                        >
                          <Eye className="w-4 h-4 text-gray-600" />
                        </button>
                        <button
                          onClick={() => openEditModal(user)}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Pencil className="w-4 h-4 text-gray-600" />
                        </button>
                        <button
                          onClick={() => openRolesModal(user)}
                          className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 border border-gray-200 rounded-lg transition-colors flex items-center gap-1.5"
                          title="Manage Roles"
                        >
                          <Shield className="w-3.5 h-3.5" />
                          Roles
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center text-gray-500">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-2">
                        {searchQuery ? (
                          <Search className="w-8 h-8 text-gray-400" />
                        ) : (
                          <Users className="w-8 h-8 text-gray-400" />
                        )}
                      </div>
                      <div>
                        {searchQuery || statusFilter !== 'all' 
                          ? 'No users match your search or filter'
                          : 'No users found'
                        }
                      </div>
                      {(searchQuery || statusFilter !== 'all') && (
                        <button
                          onClick={() => {
                            setSearchQuery('');
                            setStatusFilter('all');
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

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl border border-gray-200 shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">Create New User</h2>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={createForm.email}
                  onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                  className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent placeholder:text-gray-400 text-gray-900 transition-all"
                  placeholder="user@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  value={createForm.password}
                  onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                  className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent placeholder:text-gray-400 text-gray-900 transition-all"
                  placeholder="••••••••"
                />
              </div>

              {/* Role Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Assign Roles (Optional)
                </label>
                <div className="space-y-2 max-h-60 overflow-y-auto border border-gray-200 rounded-lg p-3">
                  {availableRoles.map((role) => (
                    <label 
                      key={role.id} 
                      className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={createForm.roleIds?.includes(role.id) || false}
                        onChange={(e) => {
                          const currentRoles = createForm.roleIds || [];
                          const newRoleIds = e.target.checked
                            ? [...currentRoles, role.id]
                            : currentRoles.filter((id) => id !== role.id);
                          setCreateForm({ ...createForm, roleIds: newRoleIds });
                        }}
                        className="w-5 h-5 text-gray-900 rounded focus:ring-gray-900 mt-0.5"
                      />
                      <div className="flex-1">
                        <div className="text-sm font-semibold text-gray-900">{role.name}</div>
                        {role.description && (
                          <div className="text-xs text-gray-500 mt-1">{role.description}</div>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  You can assign roles now or later using "Manage Roles"
                </p>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex items-center justify-end gap-3">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  resetCreateForm();
                }}
                className="px-5 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-all text-sm font-medium"
                disabled={createMutation.isPending}
              >
                Cancel
              </button>
              <button
                onClick={handleCreateUser}
                disabled={
                  createMutation.isPending ||
                  !createForm.email ||
                  !createForm.password
                }
                className="px-5 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-all disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed text-sm font-medium"
              >
                {createMutation.isPending ? 'Creating...' : 'Create User'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl border border-gray-200 shadow-2xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">Edit User</h2>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={selectedUser.email}
                  disabled
                  className="w-full px-4 py-2.5 bg-gray-100 border border-gray-300 rounded-lg text-gray-900 cursor-not-allowed"
                />
                <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Password (Optional)
                </label>
                <input
                  type="password"
                  value={editForm.password}
                  onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                  className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent placeholder:text-gray-400 text-gray-900 transition-all"
                  placeholder="Leave blank to keep current password"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="edit-active"
                    checked={editForm.isActive}
                    onChange={(e) => setEditForm({ ...editForm, isActive: e.target.checked })}
                    className="w-4 h-4 bg-white border-gray-300 rounded text-gray-900 focus:ring-2 focus:ring-gray-900 focus:ring-offset-0"
                  />
                  <label htmlFor="edit-active" className="text-sm font-medium text-gray-700 cursor-pointer">
                    Active User
                  </label>
                </div>
                
                {/* Quick Toggle Buttons */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditForm(prev => ({ ...prev, isActive: false }))}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                      !editForm.isActive
                        ? 'text-gray-700 bg-gray-100 border border-gray-300'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Deactivate
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditForm(prev => ({ ...prev, isActive: true }))}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                      editForm.isActive
                        ? 'text-green-700 bg-green-50 border border-green-200'
                        : 'text-gray-500 hover:text-green-700 hover:bg-green-50'
                    }`}
                  >
                    Activate
                  </button>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex items-center justify-end gap-3">
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedUser(null);
                }}
                className="px-5 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-all text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateUser}
                disabled={updateMutation.isPending}
                className="px-5 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-all disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed text-sm font-medium"
              >
                {updateMutation.isPending ? 'Updating...' : 'Update User'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View User Modal */}
      {showViewModal && selectedUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl border border-gray-200 shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white p-6 border-b border-gray-200 flex items-center justify-between z-10">
              <h2 className="text-2xl font-bold text-gray-900">User Details</h2>
              <button
                onClick={() => {
                  setShowViewModal(false);
                  setSelectedUser(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
                {/* User Avatar */}
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center text-gray-700 font-bold text-2xl">
                    {selectedUser.email.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{selectedUser.email}</h3>
                    <span
                      className={`inline-flex items-center gap-2 px-3 py-1 mt-2 rounded-lg text-xs font-medium ${
                        selectedUser.isActive
                          ? 'text-green-700 bg-green-50 border border-green-200'
                          : 'text-gray-600 bg-gray-100 border border-gray-200'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${selectedUser.isActive ? 'bg-green-500' : 'bg-gray-400'}`} />
                      {selectedUser.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>

                {/* Roles */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Assigned Roles</label>
                  <div className="flex flex-wrap gap-2">
                    {selectedUser.roles && selectedUser.roles.length > 0 ? (
                      selectedUser.roles.map((roleItem, index) => {
                        const roleInfo = getRoleInfo(roleItem);
                        // Find matching role from available roles to get description
                        const matchedRole = availableRoles.find(r => 
                          r.name === roleInfo.name || r.id === roleInfo.id
                        );
                        return (
                          <div
                            key={`view-${selectedUser.id}-${roleInfo.id || roleInfo.name}-${index}`}
                            className="inline-flex flex-col items-start px-3 py-2 rounded-lg bg-gray-100 border border-gray-200"
                          >
                            <span className="text-sm font-semibold text-gray-900">
                              {roleInfo.name}
                            </span>
                            {matchedRole?.description && (
                              <span className="text-xs text-gray-500 mt-0.5">
                                {matchedRole.description}
                              </span>
                            )}
                          </div>
                        );
                      })
                    ) : (
                      <span className="text-sm text-gray-400">No roles assigned</span>
                    )}
                  </div>
                </div>

                {/* Metadata */}
                <div className="border-t border-gray-200 pt-4 space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">User ID</label>
                    <div className="text-sm text-gray-900 font-mono">{selectedUser.id}</div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Created</label>
                    <div className="text-sm text-gray-900">
                      {new Date(selectedUser.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                  {selectedUser.updatedAt && (
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Last Updated</label>
                      <div className="text-sm text-gray-900">
                        {new Date(selectedUser.updatedAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
      )}

      {/* Assign Roles Modal */}
      {showRolesModal && selectedUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl border border-gray-200 shadow-2xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">Manage Roles</h2>
              <p className="text-gray-600 mt-1">
                for <span className="font-semibold">{selectedUser.email}</span>
              </p>
            </div>
            
            <div className="p-6">
              {availableRoles && availableRoles.length > 0 ? (
                <div className="space-y-2 max-h-96 overflow-y-auto border border-gray-200 rounded-lg p-4">
                  {availableRoles.map((role) => (
                    <label
                      key={role.id}
                      className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
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
                        className="w-5 h-5 text-gray-900 rounded focus:ring-gray-900 mt-0.5"
                      />
                      <div className="flex-1">
                        <div className="text-sm font-semibold text-gray-900">{role.name}</div>
                        {role.description && (
                          <div className="text-xs text-gray-500 mt-1">{role.description}</div>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">No roles available</div>
              )}
            </div>

            <div className="p-6 border-t border-gray-200 flex items-center justify-end gap-3">
              <button
                onClick={() => {
                  setShowRolesModal(false);
                  setSelectedUser(null);
                }}
                className="px-5 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-all text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleAssignRoles}
                disabled={assignRolesMutation.isPending}
                className="px-5 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-all disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed text-sm font-medium"
              >
                {assignRolesMutation.isPending ? 'Saving...' : 'Save Roles'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}