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
import { MemoryTokenModule } from './common/services/memory-token/memory-token.module';
import { MaintenanceModule } from './modules/maintenance/maintenance.module';
import { ProductionModule } from './modules/production/production.module';
import { SalesModule } from './modules/sales/sales.module';
import { APP_GUARD } from '@nestjs/core';
import { GqlAuthGuard } from './modules/auth/guards/gql-auth.guard';
import { GqlRolesGuard } from './modules/auth/guards/gql-roles.guard';
import { PrismaModule } from './common/modules/prisma/prisma.module';
import { SummariesModule } from './modules/summaries/summaries.module';
import { ActivitiesModule } from './modules/activities/activities.module';

@Module({
    imports: [
        PrismaModule,
        GraphQLModule.forRoot({
            autoSchemaFile: 'schema.gql',
            installSubscriptionHandlers: true,
            subscriptions: {
                'graphql-ws': {
                    onConnect: (ctx) => {
                        if (!ctx || !ctx.connectionParams) {
                            throw new ApolloError(
                                `'Connection params' must be included with the 'authorization' header included`,
                            );
                        }

                        const connectionParams = ctx.connectionParams;
                        return { connectionParams };
                    },
                },
            },
            formatError: (error: any) => {
                if (error instanceof GraphQLError) {
                    const graphQLFormattedError: GraphQLFormattedError = {
                        message:
                            error.extensions?.exception?.response?.messag ||
                            error.message,
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
                return error;
            },
            context: (ctx) => {
                return ctx.connection
                    ? { ...ctx, req: ctx.connection.context }
                    : { ...ctx, req: ctx.req };
            },
        }),
        CacheModule.register({ ttl: 0, isGlobal: true }),
        AuthModule,
        ProductionModule,
        MaintenanceModule,
        SalesModule,
        SummariesModule,
        MemoryTokenModule,
        ActivitiesModule,
        FilesModule,
    ],
    providers: [
        {
            provide: APP_GUARD,
            useClass: GqlAuthGuard,
        },
        {
            provide: APP_GUARD,
            useClass: GqlRolesGuard,
        },
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
