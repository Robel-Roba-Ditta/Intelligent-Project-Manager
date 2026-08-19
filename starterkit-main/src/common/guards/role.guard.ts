import { CanActivate, ExecutionContext, Type } from '@nestjs/common';

export function RoleGuard(roles: string): Type<CanActivate> {
  class RoleGuardMixin implements CanActivate {
    canActivate(context: ExecutionContext) {
      const requiredRoles = roles.split('|');
      if (requiredRoles.length < 1) {
        return true;
      }

      const request = context.switchToHttp().getRequest();
      const user: any = request.user;
      if (user && user.userType) {
        return requiredRoles.some(
          (requiredRole) =>
            user.userType === requiredRole.trim() ||
            user.userType === 'super_admin',
        );
      }
      return false;
    }
  }

  return RoleGuardMixin;
}
