import { CanActivate, ExecutionContext } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../../modules/users/users.service';
export declare class JwtAuthGuard implements CanActivate {
    private readonly configService;
    private readonly usersService;
    constructor(configService: ConfigService, usersService: UsersService);
    canActivate(context: ExecutionContext): Promise<boolean>;
}
