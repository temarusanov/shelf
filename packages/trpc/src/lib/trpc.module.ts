import { DynamicModule, Module, Provider, Type } from '@nestjs/common'
import { HttpAdapterHost } from '@nestjs/core'
import { initTRPC } from '@trpc/server'
import * as trpcExpress from '@trpc/server/adapters/express'
import type { Application as ExpressApplication } from 'express'

import {
    patchTRPCConfig,
    TRPC_CONFIG,
    TRPC_OPTIONS_TYPE,
    TRPCConfigurableModuleClass,
} from './configs/trpc-module.config'

@Module({})
export class TRPCModule extends TRPCConfigurableModuleClass {
    static forRoot(options: typeof TRPC_OPTIONS_TYPE): DynamicModule {
        const imports: any[] = []
        const controllers: Type<any>[] = []
        const providers: Provider[] = [
            { provide: TRPC_CONFIG, useValue: patchTRPCConfig(options) },
        ]

        return {
            global: options.global,
            module: TRPCModule,
            imports,
            controllers,
            providers,
            exports: providers,
        }
    }

    constructor(private readonly httpAdapterHost: HttpAdapterHost) {
        super()
    }

    async onModuleInit() {
        const { httpAdapter } = this.httpAdapterHost
        const platformName = httpAdapter.getType()

        const app = httpAdapter.getInstance<ExpressApplication>()

        this.startTRPC(app)
    }

    async startTRPC(app: ExpressApplication) {
        const createContext = ({
            req,
            res,
        }: trpcExpress.CreateExpressContextOptions) => ({}) // no context

        type Context = Awaited<ReturnType<typeof createContext>>

        const t = initTRPC.context<Context>().create()

        const appRouter = t.router({
            // [...]
        })

        app.use(
            '/trpc',
            trpcExpress.createExpressMiddleware({
                router: appRouter,
                createContext,
            }),
        )
    }
}
