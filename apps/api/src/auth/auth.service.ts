import { Injectable, ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../database/prisma.service';
import { AuthDto, CreateUserDto, ForgotPasswordDto, ResetPasswordDto } from './dto';
import * as bcrypt from 'bcrypt';
import { Tokens } from './types';
import { MailService } from '../mail/mail.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private config: ConfigService,
    private mailService: MailService,
  ) { }

  async signupLocal(dto: CreateUserDto): Promise<Tokens> {
    const hash = await this.hashData(dto.password);

    const newUser = await this.prisma.user
      .create({
        data: {
          email: dto.email,
          password: hash,
          firstName: dto.firstName,
          lastName: dto.lastName,
          role: 'MEMBER', // Default to MEMBER for security
        },
      });

    const tokens = await this.getTokens(
      newUser.id,
      newUser.email,
      newUser.role,
      newUser.firstName,
      newUser.lastName,
    );
    await this.createSession(newUser.id, tokens.refresh_token);
    return tokens;
  }

  async signinLocal(dto: AuthDto): Promise<Tokens> {
    const user = await this.prisma.user.findUnique({
      where: {
        email: dto.email,
      },
    });

    if (!user) {
      throw new ForbiddenException('Access Denied');
    }

    const passwordMatches = await bcrypt.compare(dto.password, user.password);
    if (!passwordMatches) {
      throw new ForbiddenException('Access Denied');
    }

    const tokens = await this.getTokens(user.id, user.email, user.role, user.firstName, user.lastName);
    await this.createSession(user.id, tokens.refresh_token);
    return tokens;
  }



  async refreshTokens(userId: string, rt: string): Promise<Tokens> {
    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
    });
    if (!user) throw new ForbiddenException('Access Denied');

    // Find session matching this token? 
    // Since we hash the token in DB, we can't find by token directly unless we iterate or if we stored a token ID in the token payload.
    // For now, iterate or simplify? Iterating is bad.
    // Better strategy: The client sends RT. We verify it.
    // But we need to check if it's REVOKED (i.e. not in Session table).
    // So we must be able to match the RT to a Session.
    // Issue: We store Hashed RT. We cannot lookup by RT.
    // Fix: We need to find ALL sessions for user, and compare.

    const sessions = await this.prisma.session.findMany({ where: { userId } });
    let matchedSession = null;

    for (const session of sessions) {
      const isMatch = await bcrypt.compare(rt, session.hashedRefreshToken);
      if (isMatch) {
        matchedSession = session;
        break;
      }
    }

    if (!matchedSession) throw new ForbiddenException('Access Denied (Invalid Session)');

    const tokens = await this.getTokens(user.id, user.email, user.role, user.firstName, user.lastName);

    // Rotate tokens: Update the session with new RT
    const hash = await this.hashData(tokens.refresh_token);
    await this.prisma.session.update({
      where: { id: matchedSession.id },
      data: { hashedRefreshToken: hash, updatedAt: new Date() }
    });

    return tokens;
  }



  hashData(data: string) {
    return bcrypt.hash(data, 10);
  }

  async getTokens(
    userId: string,
    email: string,
    role: string,
    firstName?: string,
    lastName?: string,
  ): Promise<Tokens> {
    const name = firstName && lastName ? `${firstName} ${lastName}` : firstName || undefined;

    const [at, rt] = await Promise.all([
      this.jwtService.signAsync(
        {
          sub: userId,
          email,
          role,
          ...(name && { name }),
        },
        {
          secret: this.config.get<string>('JWT_ACCESS_SECRET'),
          expiresIn: '15m', // Short lived access token
        },
      ),
      this.jwtService.signAsync(
        {
          sub: userId,
          email,
          role,
          ...(name && { name }),
        },
        {
          secret: this.config.get<string>('JWT_REFRESH_SECRET'),
          expiresIn: '7d',
        },
      ),
    ]);

    return {
      access_token: at,
      refresh_token: rt,
    };
  }

  async createSession(userId: string, rt: string, deviceInfo?: string, ip?: string) {
    // Check policies
    const policy = await this.prisma.systemPolicy.findFirst();
    const maxSessions = policy?.maxConcurrentSessions || 3;

    const currentSessions = await this.prisma.session.count({ where: { userId } });

    if (currentSessions >= maxSessions) {
      // Revoke oldest
      const oldest = await this.prisma.session.findFirst({
        where: { userId },
        orderBy: { createdAt: 'asc' }
      });
      if (oldest) {
        await this.prisma.session.delete({ where: { id: oldest.id } });
      }
    }

    const hash = await this.hashData(rt);
    await this.prisma.session.create({
      data: {
        userId,
        hashedRefreshToken: hash,
        deviceInfo: deviceInfo || 'Unknown',
        clientIp: ip || 'Unknown',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
      }
    });
  }

  async logout(userId: string) {
    // In a real stateless JWT scenario without a specific session ID passed to logout, 
    // we might just revoke all or rely on client forgetting token. 
    // Ideally logout should take a refresh token or session ID to revoke just that one.
    // But for now, safe default is revoke all or we need to change controller to pass RT.
    // Let's assume we revoke all for safety or update this signature later.
    // Or better: The controller calls this. Let's revoke all for this user for now to be safe, 
    // or we can't identify *which* session without the RT.
    await this.prisma.session.deleteMany({
      where: { userId }
    });
  }
  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email }
    });

    if (!user) {
      return { message: 'If user exists, email sent.' };
    }

    const resetToken = uuidv4();
    const expiry = new Date(Date.now() + 1000 * 60 * 60); // 1 hour

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken: resetToken,
        resetTokenExpiry: expiry
      }
    });

    await this.mailService.sendPasswordResetEmail(user.email, resetToken);
    return { message: 'If user exists, email sent.' };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const user = await this.prisma.user.findFirst({
      where: {
        resetToken: dto.token,
        resetTokenExpiry: { gt: new Date() }
      }
    });

    if (!user) throw new BadRequestException('Invalid or expired token');

    const hash = await this.hashData(dto.newPassword);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        password: hash,
        resetToken: null,
        resetTokenExpiry: null
      }
    });

    return { message: 'Password successfully reset' };
  }
}
