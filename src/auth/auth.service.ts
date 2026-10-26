import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

import { Role } from '../generated/prisma/enums.js';

import { PrismaService } from '../prisma/prisma.service.js';

import { RegisterDto } from './dto/register.dto.js';

import { LoginDto } from './dto/login.dto.js';

import * as bcrypt from 'bcryptjs';

import { createHash, randomBytes } from 'node:crypto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  private normalizeEmail(email: string) {
    return email.trim().toLowerCase();
  }

  private hashRefreshToken(token: string) {
    return createHash('sha256').update(token).digest('hex');
  }

  private createRefreshToken() {
    return randomBytes(48).toString('hex');
  }

  private refreshExpiry() {
    const days = Number(
      this.configService.getOrThrow<string>('REFRESH_TOKEN_DAYS'),
    );

    if (!Number.isInteger(days) || days < 1) {
      throw new Error('REFRESH_TOKEN_DAYS must be a positive integer');
    }

    return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  }

  private async createAccessToken(userId: number) {
    const secret = this.configService.getOrThrow<string>('JWT_ACCESS_SECRET');

    const expiresIn = Number(
      this.configService.getOrThrow<string>('JWT_ACCESS_EXPIRES_SECONDS'),
    );

    if (!Number.isInteger(expiresIn) || expiresIn < 1) {
      throw new Error('JWT_ACCESS_EXPIRES_SECONDS must be positive');
    }

    return this.jwtService.signAsync(
      {
        sub: userId,
      },
      {
        secret,
        expiresIn,
        algorithm: 'HS256',
      },
    );
  }

  private safeUser(user: {
    id: number;
    name: string;
    email: string;
    role: Role;
  }) {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };
  }

  private async issueTokens(user: {
    id: number;
    name: string;
    email: string;
    role: Role;
  }) {
    const accessToken = await this.createAccessToken(user.id);

    const refreshToken = this.createRefreshToken();

    await this.prisma.refreshSession.create({
      data: {
        userId: user.id,
        tokenHash: this.hashRefreshToken(refreshToken),
        expiresAt: this.refreshExpiry(),
      },
    });

    return {
      tokenType: 'Bearer',
      accessToken,
      refreshToken,
      user: this.safeUser(user),
    };
  }

  async register(dto: RegisterDto) {
    const email = this.normalizeEmail(dto.email);
    const existingUser = await this.prisma.user.findUnique({
      where: {
        email,
      },
    });
    if (existingUser) {
      throw new ConflictException('Email already exist');
    }
    const passwordHash = await bcrypt.hash(dto.password, 12);

    const user = await this.prisma.user.create({
      data: {
        name: dto.name.trim(),
        email,
        passwordHash,
        role: Role.USER,
      },
    });

    return {
      message: 'Registration Successful',
      user: this.safeUser(user),
    };
  }

  async login(dto: LoginDto) {
    const email = this.normalizeEmail(dto.email);
    const user = await this.prisma.user.findUnique({
      where: {
        email,
      },
    });
    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Invalid email or password');
    }
    const passwordValid = await bcrypt.compare(dto.password, user.passwordHash);

    if (!passwordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    return this.issueTokens(user);
  }

  // VERIFY CURRENT USER
  async validateUser(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        passwordHash: true,
      },
    });

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('User account is unavailable');
    }

    return this.safeUser(user);
  }

  //REFRESH TOKEN ROTATION
  async refresh(refreshToken: string) {
    const tokenHash = this.hashRefreshToken(refreshToken);
    const now = new Date();

    return this.prisma.$transaction(async (tx) => {
      const session = await tx.refreshSession.findUnique({
        where: { tokenHash },
        include: {
          user: true,
        },
      });

      if (
        !session ||
        session.revokedAt ||
        session.expiresAt <= now ||
        !session.user.passwordHash
      ) {
        throw new UnauthorizedException('Invalid or expired refresh token');
      }

      // Only one concurrent request can rotate this token.
      const spent = await tx.refreshSession.updateMany({
        where: {
          id: session.id,
          tokenHash,
          revokedAt: null,
          expiresAt: {
            gt: now,
          },
        },
        data: {
          revokedAt: now,
        },
      });

      if (spent.count !== 1) {
        throw new UnauthorizedException('Refresh token already used');
      }

      const newRefreshToken = this.createRefreshToken();

      await tx.refreshSession.create({
        data: {
          userId: session.userId,
          tokenHash: this.hashRefreshToken(newRefreshToken),
          expiresAt: this.refreshExpiry(),
        },
      });

      const accessToken = await this.createAccessToken(session.user.id);

      return {
        tokenType: 'Bearer',
        accessToken,
        refreshToken: newRefreshToken,
        user: this.safeUser(session.user),
      };
    });
  }

  // LOGOUT CURRENT SESSION
  async logout(refreshToken: string) {
    const tokenHash = this.hashRefreshToken(refreshToken);

    await this.prisma.refreshSession.updateMany({
      where: {
        tokenHash,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });

    return {
      message: 'Logged out successfully',
    };
  }
}
  