import { Controller, Get, UseGuards } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';

import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { Permissions } from '../common/decorators/permissions.decorator';
import { Public } from '../common/decorators/public.decorator';

@Controller('admin/analytics')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AnalyticsController {
  constructor(private readonly service: AnalyticsService) {}

  @Get('dashboard')
  @Public()
  dashboard() {
    return this.service.dashboard();
  }

  @Get('memberships')
  @Permissions('ANALYTICS_VIEW')
  memberships() {
    return this.service.membershipAnalytics();
  }

  @Get('memberships/dimensions')
  @Permissions('ANALYTICS_VIEW')
  membershipDimensions() {
    return this.service.membershipDimensions();
  }

  @Get('users')
  @Permissions('ANALYTICS_VIEW')
  users() {
    return this.service.userAnalytics();
  }

  @Get('news')
  @Permissions('ANALYTICS_VIEW')
  news() {
    return this.service.newsAnalytics();
  }

  @Get('social')
  @Public()
  social() {
    return this.service.socialAnalytics();
  }
}
