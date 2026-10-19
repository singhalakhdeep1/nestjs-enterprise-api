import { Body, Controller, DefaultValuePipe, Delete, Get, NotFoundException, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { IsIn } from 'class-validator';
import { UsersService, sanitize } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { AuthService } from '../auth/auth.service';
import { Roles } from '../common/decorators/public.decorator';

class RoleDto {
  @IsIn(['USER', 'ADMIN']) role: 'USER' | 'ADMIN';
}

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService, private readonly authService: AuthService) {}

  @Post()
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Create a user (admin; password is hashed)' })
  create(@Body() dto: CreateUserDto) {
    return this.authService.register(dto.name, dto.email, dto.password ?? '');
  }

  @Get()
  @ApiOperation({ summary: 'List users (paginated)' })
  async findAll(@Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number, @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number) {
    const res = await this.usersService.findAll(page, Math.min(limit, 100));
    return { ...res, data: res.data.map((u) => sanitize(u)) };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user with posts' })
  async findOne(@Param('id') id: string) {
    const user = await this.usersService.findOne(id);
    if (!user) throw new NotFoundException('User not found');
    return sanitize(user);
  }

  @Patch(':id/role')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Change a user role (admin)' })
  async updateRole(@Param('id') id: string, @Body() dto: RoleDto) {
    return sanitize(await this.usersService.updateRole(id, dto.role));
  }

  @Delete(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Delete a user and their content (admin)' })
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}
