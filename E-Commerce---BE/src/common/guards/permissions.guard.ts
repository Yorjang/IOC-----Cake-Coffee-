import { CanActivate, ExecutionContext, Injectable, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Permission, ROLE_PERMISSIONS } from '../constants/permissions';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<Permission[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    if (!user) {
      throw new ForbiddenException('User session not found');
    }

    const userPermissions = ROLE_PERMISSIONS[user.role] || [];

    // Admin wildcard bypass
    if (userPermissions.includes(Permission.ALL)) {
      return true;
    }

    // Check if user has at least one of the required permissions
    const hasPermission = requiredPermissions.some((permission) =>
      userPermissions.includes(permission),
    );

    if (!hasPermission) {
      throw new ForbiddenException(
        `Access denied. Requires one of these permissions: ${requiredPermissions.join(', ')}`,
      );
    }

    return true;
  }
}
