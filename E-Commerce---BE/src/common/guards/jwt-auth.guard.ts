import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import * as crypto from 'crypto';
import * as jwt from 'jsonwebtoken';
import { UsersService } from '../../modules/users/users.service';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      if (isPublic) {
        return true;
      }
      throw new UnauthorizedException('Missing or invalid authorization header');
    }

    const token = authHeader.split(' ')[1];
    try {
      const secret = this.configService.get<string>('JWT_SECRET') || 'super_secret_jwt_key_123_cake_coffee';
      const decoded = jwt.verify(token, secret) as { sub: string; role: string; pwdSign?: string };
      
      const user = await this.usersService.findById(decoded.sub);
      if (!user) {
        if (isPublic) return true;
        throw new UnauthorizedException('User not found');
      }

      if (!user.isActive) {
        if (isPublic) return true;
        throw new UnauthorizedException('User account is inactive');
      }

      if (decoded.pwdSign) {
        const currentPwdSign = crypto.createHash('sha256').update(user.passwordHash).digest('hex');
        if (decoded.pwdSign !== currentPwdSign) {
          if (isPublic) return true;
          throw new UnauthorizedException('Session has been invalidated due to password change');
        }
      }

      request.user = user;
      return true;
    } catch (error) {
      if (isPublic) {
        return true;
      }
      if (error instanceof jwt.TokenExpiredError) {
        throw new UnauthorizedException('Token has expired');
      }
      throw new UnauthorizedException('Invalid token');
    }
  }
}
