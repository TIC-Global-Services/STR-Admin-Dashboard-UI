import { Module } from '@nestjs/common';
import { SocialPostsService } from './social_posts.service';
import { SocialPostsController } from './social_posts.controller';
import { SocialPostsPublicController } from './social-public.controller';
import { SocialRepository } from './respositories/social.repository';
import { AuditService } from 'src/audit/audit.service';

@Module({
  controllers: [SocialPostsController, SocialPostsPublicController],
  providers: [SocialPostsService, SocialRepository, AuditService],
})
export class SocialPostsModule {}
