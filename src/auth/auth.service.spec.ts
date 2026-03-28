import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;
  let prisma: PrismaService;
  let jwt: JwtService;

  const mockPrismaService = {
    user: {
      create: jest.fn(),
      findUnique: jest.fn(),
    },
  };

  const mockJwtService = {
    signAsync: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prisma = module.get<PrismaService>(PrismaService);
    jwt = module.get<JwtService>(JwtService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should hash password and create a new user', async () => {
      const registerDto = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
        role: Role.EMPLOYEE,
      };

      (bcrypt.genSalt as jest.Mock).mockResolvedValue('salt');
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');
      mockPrismaService.user.create.mockResolvedValue({
        id: 'uuid',
        ...registerDto,
        password: 'hashedPassword',
      });

      const result = await service.register(registerDto);

      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 'salt');
      expect(prisma.user.create).toHaveBeenCalled();
      expect(result).toEqual({
        id: 'uuid',
        email: registerDto.email,
        name: registerDto.name,
        role: registerDto.role,
      });
    });
  });

  describe('login', () => {
    it('should return an accessToken if credentials are valid', async () => {
      const loginDto = { email: 'test@example.com', password: 'password123' };
      const user = {
        id: 'uuid',
        email: 'test@example.com',
        password: 'hashedPassword',
        name: 'Test User',
        role: Role.EMPLOYEE,
      };

      mockPrismaService.user.findUnique.mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      mockJwtService.signAsync.mockResolvedValue('token');

      const result = await service.login(loginDto);

      expect(result).toEqual({
        accessToken: 'token',
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      });
    });

    it('should throw UnauthorizedException if user not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.login({ email: 'x@x.com', password: 'p' }))
        .rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if password does not match', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({ password: 'h' });
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.login({ email: 'x@x.com', password: 'p' }))
        .rejects.toThrow(UnauthorizedException);
    });
  });
});
