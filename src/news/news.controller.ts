import { Body, Controller, Get, Param, Post, Put, Request, UseGuards } from '@nestjs/common';
import { NewsService } from './news.service';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { PermissionsGuard } from 'src/common/guards/permissions.guard';
import { Permissions } from 'src/common/decorators/permissions.decorator';
import { CreateNewsDto } from './dto/create-news.dto';
import { UpdateNewsDto } from './dto/update-news.dto';

@Controller('admin/news')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class NewsController {
  constructor(private readonly service: NewsService) {}

  @Post()
  @Permissions('NEWS_CREATE')
  create(@Body() dto: CreateNewsDto, @Request() req) {
    return this.service.create(dto, req.user.sub);
  }

  @Put(':id')
  @Permissions('NEWS_UPDATE')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateNewsDto,
    @Request() req,
  ) {
    return this.service.update(id, dto, req.user.sub);
  }

  @Get()
  @Permissions('NEWS_VIEW')
  findAll() {
    return this.service.findAllAdmin();
  }

  @Get(':id')
  @Permissions('NEWS_VIEW')
  findOne(@Param('id') id: string) {
    return this.service.findById(id);
  }
}
