import { FieldMiddleware, MiddlewareContext, NextFn } from '@nestjs/graphql';

const AvatarMiddleware: FieldMiddleware = async (
  ctx: MiddlewareContext,
  next: NextFn,
) => {
  const value = await next();
  return '';
};

export default AvatarMiddleware;
