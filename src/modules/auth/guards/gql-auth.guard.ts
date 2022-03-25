import { GqlExecutionContext } from '@nestjs/graphql';
import { AuthGuard } from '@nestjs/passport';

export class GqlAuthGuard extends AuthGuard('jwt') {
  getRequest(context) {
    // req used in http queries and mutations, connection is used in websocket subscription connections, check AppModule
    const ctx = GqlExecutionContext.create(context).getContext();
    return ctx.connectionParams ? { headers: ctx.connectionParams } : ctx.req;
  }
}
