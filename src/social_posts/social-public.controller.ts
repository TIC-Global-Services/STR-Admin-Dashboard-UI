import { Controller, Get } from '@nestjs/common';
import { SocialPostsService } from './social_posts.service';
import { Public } from 'src/common/decorators/public.decorator';

@Controller('social')
export class SocialPostsPublicController {
  constructor(private readonly service: SocialPostsService) {}

  @Public()
  @Get('instagram')
  getInstagram() {
    return this.service.getPublic('INSTAGRAM');
  }

  @Public()
  @Get('x')
  getX() {
    return this.service.getPublic('X');
  }
}