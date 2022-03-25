import {
  CacheModule,
  MiddlewareConsumer,
  Module,
  NestModule,
} from '@nestjs/common';
import { graphqlUploadExpress } from 'graphql-upload';
import { GraphQLModule } from '@nestjs/graphql';
import { AuthModule } from './modules/auth/auth.module';
import { ApolloError } from 'apollo-server-express';
import { GraphQLError, GraphQLFormattedError } from 'graphql';
import { FilesModule } from './modules/files/files.module';
import { MemoryTokenModule } from './modules/common/services/memory-token/memory-token.module';
import { EntitiesModule } from './modules/entities/entities.module';

@Module({
  imports: [
    GraphQLModule.forRoot({
      autoSchemaFile: 'schema.gql',
      installSubscriptionHandlers: true,
      subscriptions: {
        'subscriptions-transport-ws': {
          onConnect: (connectionParams) => {
            if (!connectionParams.authorization) {
              throw new ApolloError(
                `Send 'authorization' property with an appropriate token in connection with websockets`,
              );
            }
            return { connectionParams };
          },
        },
      },
      formatError: (error: any) => {
        if (error instanceof GraphQLError) {
          const graphQLFormattedError: GraphQLFormattedError = {
            message:
              error.extensions?.exception?.response?.messag || error.message,
          };
          return graphQLFormattedError;
        } else if (error instanceof ApolloError) {
          if (!!error?.extensions?.response?.message) {
            return {
              message: error.extensions.response.message,
            };
          } else {
            return {
              message: error.message,
            };
          }
        }
      },
      context: (ctx) => {
        return ctx.connection
          ? { ...ctx, req: ctx.connection.context }
          : { ...ctx, req: ctx.req };
      },
    }),
    CacheModule.register({ ttl: 0, isGlobal: true }),
    AuthModule,
    EntitiesModule,
    MemoryTokenModule,
    FilesModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(
        graphqlUploadExpress({
          maxFileSize: 4000000,
          maxFiles: 3,
        }),
      )
      .forRoutes('graphql');
  }
}
