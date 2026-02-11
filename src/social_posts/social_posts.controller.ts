import {
  Controller,
  Post,
  Put,
  Get,
  Body,
  Param,
  Request,
  UseGuards,
} from '@nestjs/common';

import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { Permissions } from '../common/decorators/permissions.decorator';
import { Public } from '../common/decorators/public.decorator';
import { SocialPostsService } from './social_posts.service';
import { CreateSocialPostDto } from './dto/create-social-posts.dto';
import { UpdateSocialPostDto } from './dto/update-social-posts.dto';

@Controller('admin/social-posts')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class SocialPostsController {
  constructor(private readonly service: SocialPostsService) {}

  // ADMIN APIs
  @Post('instagram')
  @Permissions('SOCIAL_EMBED_UPDATE')
  createInstagram(@Body() dto: CreateSocialPostDto, @Request() req) {
    return this.service.create('INSTAGRAM', dto, req.user.sub);
  }

  @Post('x')
  @Permissions('SOCIAL_EMBED_UPDATE')
  createX(@Body() dto: CreateSocialPostDto, @Request() req) {
    return this.service.create('X', dto, req.user.sub);
  }

  @Put(':id/instagram')
  @Permissions('SOCIAL_EMBED_UPDATE')
  updateInstagram(
    @Param('id') id: string,
    @Body() dto: UpdateSocialPostDto,
    @Request() req,
  ) {
    return this.service.update(id, 'INSTAGRAM', dto, req.user.sub);
  }

  @Put(':id/x')
  @Permissions('SOCIAL_EMBED_UPDATE')
  updateX(
    @Param('id') id: string,
    @Body() dto: UpdateSocialPostDto,
    @Request() req,
  ) {
    return this.service.update(id, 'X', dto, req.user.sub);
  }

  @Get('instagram')
  @Permissions('SOCIAL_EMBED_UPDATE')
  listInstagram() {
    return this.service.getAdmin('INSTAGRAM');
  }

  @Get('x')
  @Permissions('SOCIAL_EMBED_UPDATE')
  listX() {
    return this.service.getAdmin('X');
  }
}


