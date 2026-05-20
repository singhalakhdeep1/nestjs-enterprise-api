import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UsersService {
    constructor(private readonly prisma: PrismaService) { }

    async create(createUserDto: CreateUserDto) {
        const existing = await this.prisma.user.findUnique({
            where: { email: createUserDto.email },
        });
        if (existing) {
            throw new ConflictException('Email already in use');
        }
        return this.prisma.user.create({ data: createUserDto });
    }

    async findAll() {
        return this.prisma.user.findMany({
            include: { posts: true },
            orderBy: { createdAt: 'desc' },
        });
    }

    async findOne(id: string) {
        return this.prisma.user.findUnique({
            where: { id },
            include: { posts: true },
        });
    }
}
