import { apiClient } from './client';

export interface AuditLog {
  id: string;
  userId: string | null;
  action: string;
  entity: string;
  entityId: string | null;
  metadata: Record<string, unknown> | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
  user?: {
    id: string;
    email: string;
    roles: {
      role: {
        name: string;
      };
    }[];
  };
}

export interface AuditStats {
  total: number;
  uniqueUsers: number;
  topActions: {
    action: string;
    count: number;
  }[];
}

export interface AuditLogsResponse {
  logs: AuditLog[];
  total: number;
  limit: number;
  offset: number;
}

export interface CreateTestLogDto {
  userId?: string;
  action?: string;
  entity?: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
}

export const auditApi = {
  // Get audit logs with optional filters
  getLogs: async (params?: {
    limit?: number;
    offset?: number;
    userId?: string;
    action?: string;
  }): Promise<AuditLogsResponse> => {
    try {
      const { data } = await apiClient.get('/audit/logs', { params });
      return data;
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      return {
        logs: [],
        total: 0,
        limit: params?.limit || 100,
        offset: params?.offset || 0,
      };
    }
  },

  // Get audit statistics
  getStats: async (): Promise<AuditStats> => {
    try {
      const { data } = await apiClient.get('/audit/stats');
      return data;
    } catch (error) {
      console.error('Error fetching audit stats:', error);
      return {
        total: 0,
        uniqueUsers: 0,
        topActions: [],
      };
    }
  },

  // Create a test audit log (for testing purposes)
  createTestLog: async (logData: CreateTestLogDto): Promise<AuditLog | null> => {
    try {
      const { data } = await apiClient.post('/audit/test-log', logData);
      return data;
    } catch (error) {
      console.error('Error creating test audit log:', error);
      return null;
    }
  },
};
