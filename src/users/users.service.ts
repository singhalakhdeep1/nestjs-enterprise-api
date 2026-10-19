import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import type { Role, User } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';

/** Removes password hashes from anything returned to clients. */
export function sanitize<T extends Partial<User> | null>(user: T): Omit<NonNullable<T>, 'password'> | null {
  if (!user) return null;
  const { password: _password, ...rest } = user as User;
  return rest as Omit<NonNullable<T>, 'password'>;
}

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: createUserDto.email } });
    if (existing) throw new ConflictException('Email already in use');
    return this.prisma.user.create({ data: createUserDto });
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async findAll(page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;
    const [users, total] = await Promise.all([
      this.prisma.user.findMany({ skip, take: limit, include: { posts: true }, orderBy: { createdAt: 'desc' } }),
      this.prisma.user.count(),
    ]);
    return { data: users, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async findOne(id: string) {
    return this.prisma.user.findUnique({ where: { id }, include: { posts: true } });
  }

  async updateRole(id: string, role: Role) {
    if (!(await this.prisma.user.findUnique({ where: { id } }))) throw new NotFoundException('User not found');
    return this.prisma.user.update({ where: { id }, data: { role } });
  }

  async updateProfile(id: string, data: { name?: string }) {
    return this.prisma.user.update({ where: { id }, data });
  }

  async remove(id: string) {
    if (!(await this.prisma.user.findUnique({ where: { id } }))) throw new NotFoundException('User not found');
    await this.prisma.user.delete({ where: { id } });
    return { deleted: true, id };
  }

  count() {
    return this.prisma.user.count();
  }
}
