import { createParamDecorator, ExecutionContext } from '@nestjs/common';
// import { UserInfo } from '@user/user-info.dto';

export const CurrentUser = createParamDecorator<any>(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
