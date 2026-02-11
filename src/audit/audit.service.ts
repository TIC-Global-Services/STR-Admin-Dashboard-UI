import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async log(data: {
    userId?: string;
    action: string;
    entity: string;
    entityId?: string;
    metadata?: any;
    ipAddress?: string;
    userAgent?: string;
  }) {
    try {
      return await this.prisma.auditLog.create({
        data,
      });
    } catch (error) {
      console.error('Failed to create audit log:', error);
      // Don't throw error to prevent breaking the main flow
      return null;
    }
  }

  async getLogs(filters: {
    limit?: number;
    offset?: number;
    userId?: string;
    action?: string;
  }) {
    try {
      const where: any = {};
      
      if (filters.userId) {
        where.userId = filters.userId;
      }
      
      if (filters.action) {
        where.action = {
          contains: filters.action,
          mode: 'insensitive',
        };
      }

      const [logs, total] = await Promise.all([
        this.prisma.auditLog.findMany({
          where,
          take: filters.limit || 100,
          skip: filters.offset || 0,
          orderBy: {
            createdAt: 'desc',
          },
          include: {
            user: {
              select: {
                id: true,
                email: true,
                roles: {
                  include: {
                    role: {
                      select: {
                        name: true,
                      },
                    },
                  },
                },
              },
            },
          },
        }),
        this.prisma.auditLog.count({ where }),
      ]);

      console.log(`Fetched ${logs.length} audit logs out of ${total} total`);

      return {
        logs,
        total,
        limit: filters.limit || 100,
        offset: filters.offset || 0,
      };
    } catch (error) {
      console.error('Failed to fetch audit logs:', error);
      // Return empty result instead of throwing
      return {
        logs: [],
        total: 0,
        limit: filters.limit || 100,
        offset: filters.offset || 0,
      };
    }
  }

  async getStats() {
    try {
      const [total, uniqueUsers, actionCounts] = await Promise.all([
        this.prisma.auditLog.count(),
        this.prisma.auditLog.findMany({
          distinct: ['userId'],
          select: { userId: true },
          where: {
            userId: {
              not: null,
            },
          },
        }),
        this.prisma.auditLog.groupBy({
          by: ['action'],
          _count: {
            action: true,
          },
          orderBy: {
            _count: {
              action: 'desc',
            },
          },
          take: 10,
        }),
      ]);

      console.log(`Audit stats: ${total} total logs, ${uniqueUsers.length} unique users`);

      return {
        total,
        uniqueUsers: uniqueUsers.length,
        topActions: actionCounts.map((item) => ({
          action: item.action,
          count: item._count.action,
        })),
      };
    } catch (error) {
      console.error('Failed to fetch audit stats:', error);
      // Return empty stats instead of throwing
      return {
        total: 0,
        uniqueUsers: 0,
        topActions: [],
      };
    }
  }
}
