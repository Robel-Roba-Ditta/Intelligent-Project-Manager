import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';

jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;
  let usersService: { findByEmail: jest.Mock; findByEmailWithPassword: jest.Mock; create: jest.Mock; findById: jest.Mock };
  let jwtService: { sign: jest.Mock };

  beforeEach(async () => {
    usersService = {
      findByEmail: jest.fn(),
      findByEmailWithPassword: jest.fn(),
      create: jest.fn(),
      findById: jest.fn(),
    };
    jwtService = { sign: jest.fn().mockReturnValue('mock-token') };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersService },
        { provide: JwtService, useValue: jwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  describe('register', () => {
    it('rejects duplicate email', async () => {
      usersService.findByEmail.mockResolvedValue({ id: 1, email: 'dup@test.com' });
      await expect(service.register({
        email: 'dup@test.com', password: 'pass', fullName: 'Test',
      })).rejects.toThrow(ConflictException);
    });

    it('hashes password before storing', async () => {
      usersService.findByEmail.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-pass');
      usersService.create.mockResolvedValue({
        id: 1, email: 'a@b.com', fullName: 'Test', password: 'hashed-pass', role: 'user',
      });

      await service.register({ email: 'a@b.com', password: 'raw', fullName: 'Test' });
      expect(bcrypt.hash).toHaveBeenCalledWith('raw', 10);
      expect(usersService.create).toHaveBeenCalledWith(
        expect.objectContaining({ password: 'hashed-pass' }),
      );
    });

    it('returns user without password field', async () => {
      usersService.findByEmail.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed');
      usersService.create.mockResolvedValue({
        id: 1, email: 'a@b.com', fullName: 'Test', password: 'hashed', role: 'user',
      });

      const result = await service.register({ email: 'a@b.com', password: 'raw', fullName: 'Test' });
      expect((result.user as any).password).toBeUndefined();
      expect(result.accessToken).toBe('mock-token');
    });
  });

  describe('login', () => {
    it('rejects unknown email', async () => {
      usersService.findByEmailWithPassword.mockResolvedValue(null);
      await expect(service.login({ email: 'x@x.com', password: 'p' }))
        .rejects.toThrow(UnauthorizedException);
    });

    it('rejects deactivated account', async () => {
      usersService.findByEmailWithPassword.mockResolvedValue({
        id: 1, isActive: false, password: 'h',
      });
      await expect(service.login({ email: 'x@x.com', password: 'p' }))
        .rejects.toThrow(UnauthorizedException);
    });

    it('rejects wrong password', async () => {
      usersService.findByEmailWithPassword.mockResolvedValue({
        id: 1, isActive: true, password: 'hashed',
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);
      await expect(service.login({ email: 'x@x.com', password: 'wrong' }))
        .rejects.toThrow(UnauthorizedException);
    });

    it('returns token on valid credentials', async () => {
      usersService.findByEmailWithPassword.mockResolvedValue({
        id: 1, email: 'a@b.com', isActive: true, password: 'hashed', role: 'user', fullName: 'T',
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.login({ email: 'a@b.com', password: 'correct' });
      expect(result.accessToken).toBe('mock-token');
      expect((result.user as any).password).toBeUndefined();
    });
  });
});
