import { Controller, Get, Post, Query, Body, UseGuards } from '@nestjs/common';
import { AuditService } from './audit.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { Permissions } from '../common/decorators/permissions.decorator';
import { Public } from '../common/decorators/public.decorator';

@Controller('audit')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get('logs')
  @Permissions('AUDIT_VIEW')
  getLogs(
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
    @Query('userId') userId?: string,
    @Query('action') action?: string,
  ) {
    return this.auditService.getLogs({
      limit: limit ? parseInt(limit, 10) : 100,
      offset: offset ? parseInt(offset, 10) : 0,
      userId,
      action,
    });
  }

  @Get('stats')
  @Permissions('AUDIT_VIEW')
  getStats() {
    return this.auditService.getStats();
  }

  // Test endpoint to create sample audit logs (remove in production)
  @Post('test-log')
  @Public()
  async createTestLog(
    @Body()
    body: {
      userId?: string;
      action?: string;
      entity?: string;
      entityId?: string;
      metadata?: Record<string, unknown>;
    },
  ) {
    return this.auditService.log({
      userId: body.userId ?? undefined,
      action: body.action || 'TEST_ACTION',
      entity: body.entity || 'Test',
      entityId: body.entityId ?? undefined,
      metadata: body.metadata || { test: true },
      ipAddress: '127.0.0.1',
      userAgent: 'Test Agent',
    });
  }
}
