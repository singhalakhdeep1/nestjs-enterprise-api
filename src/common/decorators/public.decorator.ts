import { createParamDecorator, ExecutionContext, SetMetadata } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';

export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

export const ROLES_KEY = 'roles';
export const Roles = (...roles: ('USER' | 'ADMIN')[]) => SetMetadata(ROLES_KEY, roles);

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: 'USER' | 'ADMIN';
}

/** Works for REST and GraphQL handlers. */
export function requestFrom(context: ExecutionContext) {
  return context.getType<string>() === 'graphql' ? GqlExecutionContext.create(context).getContext().req : context.switchToHttp().getRequest();
}

export const CurrentUser = createParamDecorator((_data: unknown, ctx: ExecutionContext): AuthUser => requestFrom(ctx)?.user);
