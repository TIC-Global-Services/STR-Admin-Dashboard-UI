import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { AuditService } from '../audit/audit.service';
import { SocialRepository } from './respositories/social.repository';
import { CreateSocialPostDto } from './dto/create-social-posts.dto';
import { UpdateSocialPostDto } from './dto/update-social-posts.dto';

type Platform = 'INSTAGRAM' | 'X';

@Injectable()
export class SocialPostsService {
  constructor(
    private readonly repo: SocialRepository,
    private readonly audit: AuditService,
  ) {}

  // ======================================================
  // CREATE SOCIAL POST
  // ======================================================
  async create(
    platform: Platform,
    dto: CreateSocialPostDto,
    userId: string,
  ) {
    if (dto.isActive) {
      const activeCount = await this.repo.countActive(platform);
      if (activeCount >= 3) {
        throw new BadRequestException(
          'Only 3 active posts are allowed per platform',
        );
      }
    }

    const post = await this.repo.create(platform, dto, userId);

    await this.audit.log({
      userId,
      action: 'SOCIAL_EMBED_CREATE',
      entity: 'SocialPost',
      entityId: post.id,
      metadata: { platform },
    });

    return post;
  }

  // ======================================================
  // UPDATE SOCIAL POST
  // ======================================================
  async update(
    id: string,
    platform: Platform,
    dto: UpdateSocialPostDto,
    userId: string,
  ) {
    // If activating → enforce limit
    if (dto.isActive === true) {
      const activeCount = await this.repo.countActive(platform);
      if (activeCount >= 3) {
        throw new BadRequestException(
          'Only 3 active posts are allowed per platform',
        );
      }
    }

    try {
      const post = await this.repo.update(id, dto);

      await this.audit.log({
        userId,
        action: 'SOCIAL_EMBED_UPDATE',
        entity: 'SocialPost',
        entityId: id,
        metadata: { platform },
      });

      return post;
    } catch {
      throw new NotFoundException('Social post not found');
    }
  }

  // ======================================================
  // ADMIN LIST
  // ======================================================
  getAdmin(platform: Platform) {
    return this.repo.findAdmin(platform);
  }

  // ======================================================
  // PUBLIC (MAX 3 ACTIVE)
  // ======================================================
  getPublic(platform: Platform) {
    return this.repo.findActive(platform);
  }
}
