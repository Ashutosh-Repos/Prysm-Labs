import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Role } from '@prisma/client';

export interface JwtPayloadUser {
  id: string;
  email: string;
  role: Role;
}

export const GetUser = createParamDecorator(
  (data: keyof JwtPayloadUser | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<{ user: JwtPayloadUser }>();
    const user = request.user;

    return data ? user?.[data] : user;
  },
);
