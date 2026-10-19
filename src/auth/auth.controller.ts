import { Controller, Post, Body, UseGuards, Request, Get, HttpCode, Patch, NotFoundException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { IsEmail, IsNotEmpty, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { AuthService } from './auth.service';
import { Public, CurrentUser, type AuthUser } from '../common/decorators/public.decorator';
import { UsersService, sanitize } from '../users/users.service';
import { StructuredLoggingService } from '../common/services/structured-logging/structured-logging.service';

class RegisterDto {
  @IsString() @IsNotEmpty() @MaxLength(100) name: string;
  @IsEmail() @IsNotEmpty() email: string;
  @IsString() @IsNotEmpty() @MinLength(6) @MaxLength(128) password: string;
}

class LoginDto {
  @IsEmail() @IsNotEmpty() email: string;
  @IsString() @IsNotEmpty() password: string;
}

class ProfileDto {
  @IsOptional() @IsString() @IsNotEmpty() @MaxLength(100) name?: string;
}

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService, private users: UsersService, private logging: StructuredLoggingService) {}

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post('register')
  async register(@Body() dto: RegisterDto) {
    const user = await this.authService.register(dto.name, dto.email.toLowerCase(), dto.password);
    this.logging.logAuditEvent('UserRegistered', `User ${user.email} registered`, { userId: user.id });
    return this.authService.login(user);
  }

  @Public()
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @UseGuards(AuthGuard('local'))
  @Post('login')
  @HttpCode(200)
  async login(@Body() _dto: LoginDto, @Request() req) {
    this.logging.logAuditEvent('UserLoggedIn', 'User logged in successfully', { userId: req.user.id, ipAddress: req.ip });
    return this.authService.login(req.user);
  }

  @ApiBearerAuth()
  @Get('profile')
  async getProfile(@CurrentUser() user: AuthUser) {
    const full = await this.users.findOne(user.id);
    if (!full) throw new NotFoundException();
    return sanitize(full);
  }

  @ApiBearerAuth()
  @Patch('profile')
  async updateProfile(@CurrentUser() user: AuthUser, @Body() dto: ProfileDto) {
    return sanitize(await this.users.updateProfile(user.id, dto));
  }
}
