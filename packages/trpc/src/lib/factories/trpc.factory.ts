import { Inject, Injectable } from '@nestjs/common'
import { AnyRouter, ProcedureBuilder } from '@trpc/server'
import { MergeRouters } from '@trpc/server/dist/core/internals/mergeRouters'
import { AnyRouterDef } from '@trpc/server/dist/core/router'

import { TRPCRouter } from '../interfaces/factory.interface'
import { RouterFactory } from './router.factory'

@Injectable()
export class TRPCFactory {
    @Inject(RouterFactory)
    private readonly routerFactory!: RouterFactory

    serializeAppRoutes(
        router: TRPCRouter,
        procedure: ProcedureBuilder<any>,
    ): MergeRouters<Array<AnyRouter>, AnyRouterDef> {
        const routerSchema = this.routerFactory.serializeRoutes(
            router,
            procedure,
        )
        return router(routerSchema)
    }
}
