import { BadRequestException, Injectable } from '@nestjs/common';
import { ApplyMembershipDto } from './dto/apply-membership.dto';
import axios from 'axios';

// External API configuration
const EXTERNAL_API_URL = 'https://str-admin.vercel.app/api/v1';
const EXTERNAL_API_CREDENTIALS = {
  email: 'manojkumararumainathan@gmail.com',
  password: '12345678',
};

// Mock data storage
const mockMemberships: any[] = [
  {
    id: '1a2b3c4d-5e6f-7g8h-9i0j-1k2l3m4n5o6p',
    fullName: 'John Doe (Mock)',
    dob: '1990-05-15',
    bloodGroup: 'O+',
    occupation: 'Software Engineer',
    aadharNumber: '1234-5678-9012',
    email: 'john.doe@example.com',
    phone: '+91-9876543210',
    address: '123 Main Street, Apartment 4B',
    zone: 'North Zone',
    district: 'Central District',
    state: 'Maharashtra',
    instagramId: '@johndoe',
    xTwitterId: '@johndoe',
    status: 'APPROVED',
    reviewedById: null,
    reviewedAt: null,
    rejectionReason: null,
    createdAt: '2024-01-15T10:30:00Z',
    updatedAt: '2024-01-20T14:45:00Z',
  },
  {
    id: '2b3c4d5e-6f7g-8h9i-0j1k-2l3m4n5o6p7q',
    fullName: 'Jane Smith (Mock)',
    dob: '1988-08-22',
    bloodGroup: 'A+',
    occupation: 'Marketing Manager',
    aadharNumber: '2345-6789-0123',
    email: 'jane.smith@example.com',
    phone: '+91-9876543211',
    address: '456 Oak Avenue, Suite 12',
    zone: 'South Zone',
    district: 'Downtown District',
    state: 'Karnataka',
    instagramId: '@janesmith',
    xTwitterId: '@janesmith',
    status: 'APPROVED',
    reviewedById: null,
    reviewedAt: null,
    rejectionReason: null,
    createdAt: '2024-01-16T11:20:00Z',
    updatedAt: '2024-01-21T09:15:00Z',
  },
  {
    id: '3c4d5e6f-7g8h-9i0j-1k2l-3m4n5o6p7q8r',
    fullName: 'Raj Kumar (Mock)',
    dob: '1992-03-10',
    bloodGroup: 'B+',
    occupation: 'Business Owner',
    aadharNumber: '3456-7890-1234',
    email: 'raj.kumar@example.com',
    phone: '+91-9876543212',
    address: '789 Park Road, Building C',
    zone: 'East Zone',
    district: 'Suburban District',
    state: 'Tamil Nadu',
    instagramId: '@rajkumar',
    xTwitterId: '@rajkumar',
    status: 'PENDING',
    reviewedById: null,
    reviewedAt: null,
    rejectionReason: null,
    createdAt: '2024-02-01T08:45:00Z',
    updatedAt: '2024-02-01T08:45:00Z',
  },
];

@Injectable()
export class MembershipService {
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;

  // Get access token from external API
  private async getAccessToken(): Promise<string> {
    // Check if token is still valid
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    try {
      const response = await axios.post(
        `${EXTERNAL_API_URL}/auth/login`,
        EXTERNAL_API_CREDENTIALS,
      );
      this.accessToken = response.data.accessToken;
      // Token expires in 15 minutes, refresh 1 minute before
      this.tokenExpiry = Date.now() + 14 * 60 * 1000;
      return this.accessToken!;
    } catch (error) {
      console.error('Failed to get access token:', error);
      throw new Error('Failed to authenticate with external API');
    }
  }

  // Fetch data from external API
  private async fetchFromExternalAPI(): Promise<any[]> {
    try {
      const token = await this.getAccessToken();
      const response = await axios.get(
        `${EXTERNAL_API_URL}/admin/memberships/all`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      return response.data;
    } catch (error) {
      console.error('Failed to fetch from external API:', error);
      return []; // Return empty array if external API fails
    }
  }

  // -------------------------
  // APPLY (PUBLIC)
  // -------------------------
  async apply(dto: ApplyMembershipDto) {
    const exists = mockMemberships.find(
      (m) =>
        m.email === dto.email ||
        m.phone === dto.phone ||
        m.aadharNumber === dto.aadharNumber,
    );

    if (exists) {
      throw new BadRequestException('Membership already exists');
    }

    const newMembership: any = {
      id: Math.random().toString(36).substring(7),
      ...dto,
      dob: dto.dob,
      status: 'PENDING' as const,
      reviewedById: null,
      reviewedAt: null,
      rejectionReason: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    mockMemberships.push(newMembership);
    return newMembership;
  }

  // -------------------------
  // LIST ALL - COMBINES MOCK + EXTERNAL API
  // -------------------------
  async findAll() {
    const externalData = await this.fetchFromExternalAPI();
    // Combine mock data with external API data
    return [...mockMemberships, ...externalData];
  }

  // -------------------------
  // LIST PENDING (ADMIN)
  // -------------------------
  async findPending() {
    const allData = await this.findAll();
    return allData.filter((m) => m.status === 'PENDING');
  }

  async findApproved() {
    const allData = await this.findAll();
    return allData.filter((m) => m.status === 'APPROVED');
  }

  async findRejected() {
    const allData = await this.findAll();
    return allData.filter((m) => m.status === 'REJECTED');
  }

  // -------------------------
  // APPROVE
  // -------------------------
  async approve(id: string, adminId: string) {
    console.log(`Attempting to approve membership ${id}...`);
    
    // Check if this is a mock membership
    const mockMembership = mockMemberships.find((m) => m.id === id);
    
    try {
      // Try to approve via external API
      const token = await this.getAccessToken();
      console.log(`Calling external API to approve membership ${id}...`);
      
      const response = await axios.put(
        `${EXTERNAL_API_URL}/admin/memberships/${id}/approve`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      console.log(`Successfully approved membership ${id} via external API`);
      return response.data;
    } catch (error) {
      console.error('Failed to approve via external API:', error);
      if (axios.isAxiosError(error)) {
        console.error('Response status:', error.response?.status);
        console.error('Response data:', error.response?.data);
        
        // If 400 or 404, the membership doesn't exist in external API
        if (error.response?.status === 400 || error.response?.status === 404) {
          console.log(`Membership ${id} not found in external API, checking mock data...`);
          
          // If it's a mock membership, update it locally
          if (mockMembership) {
            console.log(`Approving mock membership ${id}`);
            mockMembership.status = 'APPROVED';
            mockMembership.reviewedById = adminId;
            mockMembership.reviewedAt = new Date().toISOString();
            mockMembership.updatedAt = new Date().toISOString();
            return mockMembership;
          }
          
          throw new BadRequestException('Membership not found in external system or mock data');
        }
      }
      
      // For other errors, still try mock data as fallback
      if (mockMembership) {
        console.log(`Falling back to mock data for membership ${id}`);
        mockMembership.status = 'APPROVED';
        mockMembership.reviewedById = adminId;
        mockMembership.reviewedAt = new Date().toISOString();
        mockMembership.updatedAt = new Date().toISOString();
        return mockMembership;
      }
      
      throw new BadRequestException('Failed to approve membership');
    }
  }

  // -------------------------
  // REJECT
  // -------------------------
  async reject(id: string, adminId: string, reason: string) {
    console.log(`Attempting to reject membership ${id}...`);
    
    // Check if this is a mock membership
    const mockMembership = mockMemberships.find((m) => m.id === id);
    
    try {
      // Try to reject via external API
      const token = await this.getAccessToken();
      console.log(`Calling external API to reject membership ${id}...`);
      
      const response = await axios.put(
        `${EXTERNAL_API_URL}/admin/memberships/${id}/reject`,
        { reason },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      console.log(`Successfully rejected membership ${id} via external API`);
      return response.data;
    } catch (error) {
      console.error('Failed to reject via external API:', error);
      if (axios.isAxiosError(error)) {
        console.error('Response status:', error.response?.status);
        console.error('Response data:', error.response?.data);
        
        // If 400 or 404, the membership doesn't exist in external API
        if (error.response?.status === 400 || error.response?.status === 404) {
          console.log(`Membership ${id} not found in external API, checking mock data...`);
          
          // If it's a mock membership, update it locally
          if (mockMembership) {
            console.log(`Rejecting mock membership ${id}`);
            mockMembership.status = 'REJECTED';
            mockMembership.rejectionReason = reason;
            mockMembership.reviewedById = adminId;
            mockMembership.reviewedAt = new Date().toISOString();
            mockMembership.updatedAt = new Date().toISOString();
            return mockMembership;
          }
          
          throw new BadRequestException('Membership not found in external system or mock data');
        }
      }
      
      // For other errors, still try mock data as fallback
      if (mockMembership) {
        console.log(`Falling back to mock data for membership ${id}`);
        mockMembership.status = 'REJECTED';
        mockMembership.rejectionReason = reason;
        mockMembership.reviewedById = adminId;
        mockMembership.reviewedAt = new Date().toISOString();
        mockMembership.updatedAt = new Date().toISOString();
        return mockMembership;
      }
      
      throw new BadRequestException('Failed to reject membership');
    }
  }
}
