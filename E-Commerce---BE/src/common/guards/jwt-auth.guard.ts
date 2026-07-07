import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';
import { UsersService } from '../../modules/users/users.service';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or invalid authorization header');
    }

    const token = authHeader.split(' ')[1];
    try {
      const secret = this.configService.get<string>('JWT_SECRET') || 'super_secret_jwt_key_123_cake_coffee';
      const decoded = jwt.verify(token, secret) as { sub: string; role: string };
      
      const user = await this.usersService.findById(decoded.sub);
      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      if (!user.isActive) {
        throw new UnauthorizedException('User account is inactive');
      }

      request.user = user;
      return true;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new UnauthorizedException('Token has expired');
      }
      throw new UnauthorizedException('Invalid token');
    }
  }
}
