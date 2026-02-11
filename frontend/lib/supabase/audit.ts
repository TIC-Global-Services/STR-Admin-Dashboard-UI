import { supabase } from './client';

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
}

export interface AuditLogWithUser extends AuditLog {
  User?: {
    id: string;
    email: string;
    UserRole: {
      role: {
        name: string;
      };
    }[];
  };
}

export async function getAuditLogs(filters?: {
  limit?: number;
  offset?: number;
  userId?: string;
  action?: string;
}): Promise<{ logs: AuditLogWithUser[]; total: number }> {
  try {
    console.log('Fetching audit logs with filters:', filters);
    
    let query = supabase
      .from('audit_logs')
      .select('*', { count: 'exact' })
      .order('createdAt', { ascending: false });

    // Apply filters
    if (filters?.userId) {
      query = query.eq('userId', filters.userId);
    }

    if (filters?.action) {
      query = query.ilike('action', `%${filters.action}%`);
    }

    // Apply pagination
    const limit = filters?.limit || 100;
    const offset = filters?.offset || 0;
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('Supabase error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      });
      throw error;
    }

    console.log('Successfully fetched audit logs:', { count, dataLength: data?.length });

    // Fetch user details separately for each log
    const logsWithUsers = await Promise.all(
      (data || []).map(async (log) => {
        if (log.userId) {
          try {
            const { data: userData } = await supabase
              .from('User')
              .select(`
                id,
                email,
                UserRole (
                  role:roleId (
                    name
                  )
                )
              `)
              .eq('id', log.userId)
              .single();
            
            return {
              ...log,
              User: userData,
            };
          } catch (userError) {
            console.error('Error fetching user for log:', log.id, userError);
            return log;
          }
        }
        return log;
      })
    );

    return {
      logs: logsWithUsers as AuditLogWithUser[],
      total: count || 0,
    };
  } catch (error) {
    console.error('Failed to fetch audit logs:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    return {
      logs: [],
      total: 0,
    };
  }
}

export async function getAuditStats(): Promise<{
  total: number;
  uniqueUsers: number;
  topActions: { action: string; count: number }[];
}> {
  try {
    // Get total count
    const { count: total } = await supabase
      .from('audit_logs')
      .select('*', { count: 'exact', head: true });

    // Get unique users count
    const { data: uniqueUsersData } = await supabase
      .from('audit_logs')
      .select('userId')
      .not('userId', 'is', null);

    const uniqueUsers = new Set(
      uniqueUsersData?.map((log) => log.userId) || []
    ).size;

    // Get top actions - we need to do this manually since Supabase doesn't have GROUP BY in the client
    const { data: allLogs } = await supabase
      .from('audit_logs')
      .select('action');

    const actionCounts: Record<string, number> = {};
    allLogs?.forEach((log) => {
      actionCounts[log.action] = (actionCounts[log.action] || 0) + 1;
    });

    const topActions = Object.entries(actionCounts)
      .map(([action, count]) => ({ action, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      total: total || 0,
      uniqueUsers,
      topActions,
    };
  } catch (error) {
    console.error('Failed to fetch audit stats:', error);
    return {
      total: 0,
      uniqueUsers: 0,
      topActions: [],
    };
  }
}
