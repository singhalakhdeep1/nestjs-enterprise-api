import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

describe('AuthService', () => {
  let service: AuthService;
  let usersService: UsersService;
  let jwtService: JwtService;

  const mockUsersService = {
    findByEmail: jest.fn(),
    create: jest.fn(),
    findOne: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(UsersService);
    jwtService = module.get<JwtService>(JwtService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateUser', () => {
    it('should return user without password if credentials are valid', async () => {
      const user = {
        id: '1',
        email: 'test@example.com',
        password: 'hashedPassword',
        name: 'Test User',
      };

      mockUsersService.findByEmail.mockResolvedValue(user);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true);

      const result = await service.validateUser('test@example.com', 'password');

      expect(result).not.toHaveProperty('password');
      expect(result.email).toBe(user.email);
    });

    it('should return null if user not found', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);

      const result = await service.validateUser('test@example.com', 'password');

      expect(result).toBeNull();
    });

    it('should return null if password is invalid', async () => {
      const user = {
        id: '1',
        email: 'test@example.com',
        password: 'hashedPassword',
      };

      mockUsersService.findByEmail.mockResolvedValue(user);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false);

      const result = await service.validateUser('test@example.com', 'wrongpassword');

      expect(result).toBeNull();
    });
  });

  describe('login', () => {
    it('should return access token and user info', async () => {
      const user = { id: '1', email: 'test@example.com', name: 'Test User' };
      const token = 'jwt-token';

      mockJwtService.sign.mockReturnValue(token);

      const result = await service.login(user);

      expect(result).toHaveProperty('access_token');
      expect(result.access_token).toBe(token);
      expect(result.user).toEqual({
        id: user.id,
        name: user.name,
        email: user.email,
      });
    });
  });

  describe('register', () => {
    it('should register a new user', async () => {
      const name = 'Test User';
      const email = 'test@example.com';
      const password = 'password123';
      const hashedPassword = 'hashedPassword';

      mockUsersService.findByEmail.mockResolvedValue(null);
      jest.spyOn(bcrypt, 'hash').mockResolvedValue(hashedPassword);
      mockUsersService.create.mockResolvedValue({
        id: '1',
        name,
        email,
        password: hashedPassword,
      });

      const result = await service.register(name, email, password);

      expect(result).not.toHaveProperty('password');
      expect(result.email).toBe(email);
    });

    it('should throw UnauthorizedException if email already exists', async () => {
      const existingUser = { id: '1', email: 'test@example.com' };
      mockUsersService.findByEmail.mockResolvedValue(existingUser);

      await expect(
        service.register('Test User', 'test@example.com', 'password123'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
