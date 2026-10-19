import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.usersService.findByEmail(email);
    if (!user || !user.password) return null;
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) return null;
    const { password: _, ...result } = user;
    return result;
  }

  async login(user: any) {
    const payload = { email: user.email, sub: user.id, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    };
  }

  /** The first account becomes ADMIN so a fresh install can be administered. */
  async register(name: string, email: string, password: string) {
    const existingUser = await this.usersService.findByEmail(email);
    if (existingUser) throw new UnauthorizedException('Email already in use');
    const hashedPassword = await bcrypt.hash(password, 10);
    const isFirst = typeof (this.usersService as any).count === 'function' ? (await (this.usersService as any).count()) === 0 : false;
    const user = await this.usersService.create({ name, email, password: hashedPassword, ...(isFirst ? { role: 'ADMIN' } : {}) } as any);
    const { password: _, ...result } = user;
    return result;
  }
}
