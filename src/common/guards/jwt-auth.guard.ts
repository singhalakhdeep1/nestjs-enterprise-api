import { ExecutionContext, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY, ROLES_KEY, requestFrom } from '../decorators/public.decorator';

/**
 * Global guard for REST and GraphQL: JWT required unless @Public(); @Roles() enforced.
 * On public routes a valid token still populates req.user.
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  getRequest(context: ExecutionContext) {
    return requestFrom(context);
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (context.getType() === 'ws' || context.getType() === 'rpc') return true; // gateways/gRPC authenticate themselves
    const targets = [context.getHandler(), context.getClass()];
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, targets);
    const req = this.getRequest(context);
    if (isPublic) {
      if (req?.headers?.authorization) await (super.canActivate(context) as Promise<boolean>).catch(() => false);
      return true;
    }
    await (super.canActivate(context) as Promise<boolean>);
    const roles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, targets);
    if (roles?.length && !roles.includes(req.user?.role)) throw new ForbiddenException(`Requires role ${roles.join(' or ')}`);
    return true;
  }

  handleRequest(err: any, user: any) {
    if (err || !user) throw err || new UnauthorizedException();
    return user;
  }
}
