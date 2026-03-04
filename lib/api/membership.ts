import { apiClient } from "./client";

export interface Membership {
  id: string;
  uniqueMemberId?: string;

  // Personal Identity
  fullName: string;
  dob: string;
  bloodGroup?: string;
  occupation?: string;
  aadhaarNumber: string;

  // Contact
  email: string;
  phone: string;
  emailVerified: boolean;
  phoneVerified: boolean;

  // Location
  country: string;
  state: string;
  city: string;

  // Fan Details
  existingClub?: string;
  fanClubName?: string;
  chapterLocation?: string;
  willingToJoin?: string;
  chapterLead?: string;
  fanDuration?: string;
  favoriteMovie?: string;
  favoriteSong?: string;
  socialHandle?: string;
  tshirtSize?: string;
  membershipType: string;

  // Consent
  agreeTerms: boolean;
  ageConfirm: boolean;

  // Workflow
  status: "PENDING" | "APPROVED" | "REJECTED" | "SUSPENDED";
  reviewedById?: string;
  reviewedAt?: string;
  rejectionReason?: string;

  suspensionReason?: string;
  suspendedAt?: string;

  // Metadata
  createdAt: string;
  updatedAt: string;
}

export const membershipApi = {
  // Admin - Get all memberships
  getAll: async (): Promise<Membership[]> => {
    try {
      console.log("Fetching all memberships...");
      const { data } = await apiClient.get("/admin/memberships/all");
      console.log("All memberships response:", data);
      return Array.isArray(data) ? data : [];
    } catch (error: unknown) {
      console.error("Error fetching all memberships:", error);
      if (error && typeof error === "object" && "response" in error) {
        const axiosError = error as {
          message: string;
          response?: { data: unknown; status: number };
        };
        console.error("Error details:", {
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
      console.log("Fetching pending memberships...");
      const { data } = await apiClient.get("/admin/memberships/pending");
      console.log("Pending memberships response:", data);
      return Array.isArray(data) ? data : [];
    } catch (error: unknown) {
      console.error("Error fetching pending memberships:", error);
      throw error;
    }
  },

  // Admin - Get approved memberships
  getApproved: async (): Promise<Membership[]> => {
    try {
      console.log("Fetching approved memberships...");
      const { data } = await apiClient.get(
        "/admin/memberships/approved-members",
      );
      console.log("Approved memberships response:", data);
      return Array.isArray(data) ? data : [];
    } catch (error: unknown) {
      console.error("Error fetching approved memberships:", error);
      throw error;
    }
  },

  // Admin - Get rejected memberships
  getRejected: async (): Promise<Membership[]> => {
    try {
      console.log("Fetching rejected memberships...");
      const { data } = await apiClient.get(
        "/admin/memberships/rejected-members",
      );
      console.log("Rejected memberships response:", data);
      return Array.isArray(data) ? data : [];
    } catch (error: unknown) {
      console.error("Error fetching rejected memberships:", error);
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
    const { data } = await apiClient.post(`/admin/memberships/${id}/reject`, {
      reason,
    });
    return data;
  },

  suspend: async (id: string, reason?: string): Promise<Membership> => {
    const { data } = await apiClient.post(`/admin/memberships/${id}/suspend`, {
      reason,
    });
    return data;
  },
};
