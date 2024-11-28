import { Inject, Injectable, Logger } from '@nestjs/common'
import { ModulesContainer } from '@nestjs/core'
import { InstanceWrapper } from '@nestjs/core/injector/instance-wrapper'
import { camelCase } from 'lodash'
import { Class, Constructor } from 'type-fest'

import { TRPCMiddleware } from '../interfaces'
import {
    RouterInstance,
    TRPCPublicProcedure,
    TRPCRouter,
} from '../interfaces/factory.interface'
import { MIDDLEWARES_KEY, ROUTER_METADATA_KEY } from '../trpc.constants'
import { ProcedureFactory } from './procedure.factory'

@Injectable()
export class RouterFactory {
    private readonly logger = new Logger(RouterFactory.name)

    @Inject(ModulesContainer)
    private readonly modulesContainer!: ModulesContainer

    @Inject(ProcedureFactory)
    private readonly procedureFactory!: ProcedureFactory

    getRouters(): Array<RouterInstance> {
        const routers: Array<RouterInstance> = []

        this.modulesContainer.forEach((moduleRef) => {
            moduleRef.providers.forEach((wrapper: InstanceWrapper) => {
                const router = this.extractRouterFromWrapper(wrapper)
                if (router != null) {
                    routers.push(router)
                }
            })
        })

        return routers
    }

    private extractRouterFromWrapper(
        wrapper: InstanceWrapper,
    ): RouterInstance | null {
        const { instance, name } = wrapper

        if (instance == null) {
            return null
        }

        const router = Reflect.getMetadata(
            ROUTER_METADATA_KEY,
            instance.constructor,
        )

        if (router == null) {
            return null
        }

        const middlewares: Array<
            Class<TRPCMiddleware> | Constructor<TRPCMiddleware>
        > = Reflect.getMetadata(MIDDLEWARES_KEY, instance.constructor) || []

        return {
            name,
            instance,
            path: router.path,
            alias: router.alias,
            middlewares: middlewares,
        }
    }

    serializeRoutes(
        router: TRPCRouter,
        procedure: TRPCPublicProcedure,
    ): Record<string, any> {
        const routers = this.getRouters()
        const routerSchema = Object.create({})

        routers.forEach((route) => {
            const { instance, name, middlewares, alias } = route
            const camelCasedRouterName = camelCase(alias ?? name)
            const prototype = Object.getPrototypeOf(instance)

            const procedures = this.procedureFactory.getProcedures(
                instance,
                prototype,
            )

            this.logger.log(
                `Router ${name} as ${camelCasedRouterName}.`,
            )

            const routerProcedures = this.procedureFactory.serializeProcedures(
                procedures,
                instance,
                camelCasedRouterName,
                procedure,
                middlewares,
            )

            // TODO: To get this working with `trpc` v11, we need to remove the `router()` method from here.
            routerSchema[camelCasedRouterName] = router(routerProcedures)
        })

        return routerSchema
    }
}
