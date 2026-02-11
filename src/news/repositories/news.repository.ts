import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";

@Injectable()
export class NewsRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: any) {
    return this.prisma.news.create({ data });
  }

  update(id: string, data: any) {
    return this.prisma.news.update({
      where: { id },
      data,
    });
  }

  findById(id: string) {
    return this.prisma.news.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        summary: true,
        content: true,
        isPublished: true,
        publishedAt: true,
        createdAt: true,
        author: {
          select: { id: true, email: true },
        },
      },
    });
  }

  findAllAdmin() {
    return this.prisma.news.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        isPublished: true,
        createdAt: true,
        publishedAt: true,
      },
    });
  }

  findPublished() {
    return this.prisma.news.findMany({
      where: { isPublished: true },
      orderBy: { publishedAt: 'desc' },
      select: {
        id: true,
        title: true,
        summary: true,
        coverImage: true,
        publishedAt: true,
      },
    });
  }
}
