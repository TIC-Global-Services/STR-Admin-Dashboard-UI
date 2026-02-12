import { apiClient } from './client';

export interface Membership {
  id: string;
  fullName: string;
  dob: string;
  bloodGroup?: string;
  occupation: string;
  aadharNumber: string;
  email: string;
  phone: string;
  address: string;
  zone: string;
  district: string;
  state: string;
  instagramId?: string;
  xTwitterId?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  reviewedById?: string;
  reviewedAt?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApplyMembershipDto {
  fullName: string;
  dob: string;
  bloodGroup?: string;
  occupation: string;
  aadharNumber: string;
  email: string;
  phone: string;
  address: string;
  zone: string;
  district: string;
  state: string;
  instagramId?: string;
  xTwitterId?: string;
}

export const membershipApi = {
  // Public - Apply for membership
  apply: async (data: ApplyMembershipDto): Promise<Membership> => {
    const { data: response } = await apiClient.post('/membership/apply', data);
    return response;
  },

  // Admin - Get all memberships
  getAll: async (): Promise<Membership[]> => {
    try {
      console.log('Fetching all memberships...');
      const { data } = await apiClient.get('/admin/memberships/all');
      console.log('All memberships response:', data);
      return Array.isArray(data) ? data : [];
    } catch (error: unknown) {
      console.error('Error fetching all memberships:', error);
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { message: string; response?: { data: unknown; status: number } };
        console.error('Error details:', {
          message: axiosError.message,
          response: axiosError.response?.data,
          status: axiosError.response?.status,
        });
      }
      throw error;
    }
  },

  // Admin - Get pending memberships
  getPending: async (): Promise<Membership[]> => {
    try {
      console.log('Fetching pending memberships...');
      const { data } = await apiClient.get('/admin/memberships/pending');
      console.log('Pending memberships response:', data);
      return Array.isArray(data) ? data : [];
    } catch (error: unknown) {
      console.error('Error fetching pending memberships:', error);
      throw error;
    }
  },

  // Admin - Get approved memberships
  getApproved: async (): Promise<Membership[]> => {
    try {
      console.log('Fetching approved memberships...');
      const { data } = await apiClient.get('/admin/memberships/approved-members');
      console.log('Approved memberships response:', data);
      return Array.isArray(data) ? data : [];
    } catch (error: unknown) {
      console.error('Error fetching approved memberships:', error);
      throw error;
    }
  },

  // Admin - Get rejected memberships
  getRejected: async (): Promise<Membership[]> => {
    try {
      console.log('Fetching rejected memberships...');
      const { data } = await apiClient.get('/admin/memberships/rejected-members');
      console.log('Rejected memberships response:', data);
      return Array.isArray(data) ? data : [];
    } catch (error: unknown) {
      console.error('Error fetching rejected memberships:', error);
      throw error;
    }
  },

  // Admin - Approve membership
  approve: async (id: string): Promise<Membership> => {
    const { data } = await apiClient.post(`/admin/memberships/${id}/approve`);
    return data;
  },

  // Admin - Reject membership
  reject: async (id: string, reason: string): Promise<Membership> => {
    const { data } = await apiClient.post(`/admin/memberships/${id}/reject`, { reason });
    return data;
  },
};