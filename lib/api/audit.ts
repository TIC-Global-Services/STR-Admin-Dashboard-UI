import { apiClient } from './client';

export interface AuditLog {
  id: string;
  email?: string;
  action: string;
  entity: string;
  entityId?: string;
  metadata?: any;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

export interface AuditLogsResponse {
  data: AuditLog[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface GetAuditLogsParams {
  page?: number;
  limit?: number;
  action?: string;
  entity?: string;
  email?: string;
  from?: string;
  to?: string;
}

export const auditApi = {
  getLogs: async (
    params?: GetAuditLogsParams
  ): Promise<AuditLogsResponse> => {
    const { data } = await apiClient.get('/admin/audit/logs', {
      params,
    });
    return data;
  },
};
