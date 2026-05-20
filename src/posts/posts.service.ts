import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PostsService {
    constructor(private readonly prisma: PrismaService) { }

    async create(data: { title: string; content: string; authorId: string }) {
        return this.prisma.post.create({ data });
    }

    async findAll() {
        return this.prisma.post.findMany({
            include: { author: true },
            orderBy: { createdAt: 'desc' },
        });
    }

    async findOne(id: string) {
        return this.prisma.post.findUnique({
            where: { id },
            include: { author: true },
        });
    }

    async search(query: string) {
        return this.prisma.post.findMany({
            where: {
                OR: [
                    { title: { contains: query } },
                    { content: { contains: query } },
                ],
            },
            include: { author: true },
            orderBy: { createdAt: 'desc' },
        });
    }
}
