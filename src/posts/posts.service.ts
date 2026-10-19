import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export const AUTHOR_SELECT = { id: true, name: true, email: true, role: true } as const;
export const POST_INCLUDE = {
  author: { select: AUTHOR_SELECT },
  tags: { select: { name: true } },
  _count: { select: { comments: true } },
} satisfies Prisma.PostInclude;

const tagOps = (tags?: string[]) =>
  tags === undefined
    ? undefined
    : { set: [], connectOrCreate: [...new Set(tags.map((t) => t.trim().toLowerCase()).filter(Boolean))].map((name) => ({ where: { name }, create: { name } })) };

/** Data access for posts and comments (used by the CQRS handlers, search and GraphQL). */
@Injectable()
export class PostsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: { title: string; content: string; authorId: string; tags?: string[]; published?: boolean }) {
    const { tags, ...rest } = data;
    return this.prisma.post.create({ data: { ...rest, tags: tags ? { connectOrCreate: tagOps(tags)!.connectOrCreate } : undefined }, include: POST_INCLUDE });
  }

  async update(id: string, data: { title?: string; content?: string; tags?: string[]; published?: boolean }) {
    const { tags, ...rest } = data;
    return this.prisma.post.update({ where: { id }, data: { ...rest, tags: tagOps(tags) }, include: POST_INCLUDE });
  }

  async delete(id: string) {
    return this.prisma.post.delete({ where: { id } });
  }

  async findAll(opts: { page?: number; limit?: number; tag?: string; authorId?: string; includeUnpublishedFor?: string } = {}) {
    const page = Math.max(1, opts.page ?? 1);
    const limit = Math.min(100, Math.max(1, opts.limit ?? 20));
    const where: Prisma.PostWhereInput = {
      AND: [
        opts.includeUnpublishedFor ? { OR: [{ published: true }, { authorId: opts.includeUnpublishedFor }] } : { published: true },
        opts.tag ? { tags: { some: { name: opts.tag.toLowerCase() } } } : {},
        opts.authorId ? { authorId: opts.authorId } : {},
      ],
    };
    const [data, total] = await Promise.all([
      this.prisma.post.findMany({ where, include: POST_INCLUDE, orderBy: { createdAt: 'desc' }, skip: (page - 1) * limit, take: limit }),
      this.prisma.post.count({ where }),
    ]);
    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async findOne(id: string) {
    return this.prisma.post.findUnique({
      where: { id },
      include: { ...POST_INCLUDE, comments: { include: { author: { select: AUTHOR_SELECT } }, orderBy: { createdAt: 'asc' } } },
    });
  }

  async incrementViews(id: string) {
    await this.prisma.post.update({ where: { id }, data: { viewCount: { increment: 1 } } }).catch(() => undefined);
  }

  /** Database fallback search (case-insensitive substring over title, content and tags). */
  async search(query: string, tag?: string) {
    return this.prisma.post.findMany({
      where: {
        published: true,
        ...(tag ? { tags: { some: { name: tag.toLowerCase() } } } : {}),
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { content: { contains: query, mode: 'insensitive' } },
          { tags: { some: { name: { contains: query.toLowerCase() } } } },
        ],
      },
      include: POST_INCLUDE,
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async allForIndex() {
    return this.prisma.post.findMany({ include: { author: { select: { name: true } }, tags: { select: { name: true } } } });
  }

  async tags() {
    const rows = await this.prisma.tag.findMany({ include: { _count: { select: { posts: true } } }, orderBy: { name: 'asc' } });
    return rows.map((t) => ({ name: t.name, posts: t._count.posts }));
  }

  addComment(postId: string, authorId: string, content: string) {
    return this.prisma.comment.create({ data: { postId, authorId, content }, include: { author: { select: AUTHOR_SELECT } } });
  }

  findComment(id: string) {
    return this.prisma.comment.findUnique({ where: { id } });
  }

  deleteComment(id: string) {
    return this.prisma.comment.delete({ where: { id } });
  }
}
