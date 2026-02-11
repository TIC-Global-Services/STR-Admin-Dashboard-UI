import { Module } from '@nestjs/common';
import { NewsService } from './news.service';
import { NewsController } from './news.controller';
import { NewsPublicController } from './news-public.controller';
import { NewsRepository } from './repositories/news.repository';
import { AuditService } from 'src/audit/audit.service';

@Module({
  controllers: [NewsController, NewsPublicController],
  providers: [NewsService, NewsRepository, AuditService],
})
export class NewsModule {}
