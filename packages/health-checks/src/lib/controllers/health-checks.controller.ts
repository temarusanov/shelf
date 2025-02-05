import { DiscoveryService } from '@golevelup/nestjs-discovery'
import { Controller, Get, Res } from '@nestjs/common'
import { ExternalContextCreator } from '@nestjs/core'
import { Response } from 'express'

import {
    HEALTH_INDICATOR_ARGS_METADATA,
    HEALTH_INDICATOR_METADATA,
} from '../constants/health-checks.constants'
import { HealthIndicatorResult } from '../interfaces/health-checks.interfaces'

@Controller()
export class HealthChecksController {
    private _appStartedAt: number = Date.now()

    constructor(
        private readonly discovery: DiscoveryService,
        private readonly externalContextCreator: ExternalContextCreator,
    ) {}

    @Get('/health/live')
    async checkLive() {
        return {
            healthy: true,
        }
    }

    @Get('/health/ready')
    async checkReady(@Res() res: Response) {
        const timestamp = Date.now()
        const uptime = Math.floor((timestamp - this._appStartedAt) / 1000)

        const indicators = await this.discovery.providerMethodsWithMetaAtKey<{
            name: string
        }>(HEALTH_INDICATOR_METADATA)

        const services = await Promise.all(
            indicators.map(async (indicator) => {
                const { parentClass, handler, methodName } =
                    indicator.discoveredMethod

                const methodHandler = this.externalContextCreator.create(
                    parentClass.instance,
                    handler,
                    methodName,
                    HEALTH_INDICATOR_ARGS_METADATA,
                    undefined,
                    undefined, // contextId
                    undefined, // inquirerId
                    undefined, // options
                    'health.indicator', // contextType
                )

                const healthResult =
                    (await methodHandler()) as HealthIndicatorResult

                return {
                    name: indicator.meta.name,
                    ...healthResult,
                }
            }),
        )

        const successfulServices = services.filter(
            (s) => s.status === 'up',
        ).length
        const ratio = +(successfulServices / services.length).toFixed(2)
        const healthy = successfulServices === services.length

        const statusCode = healthy ? 200 : 503

        res.status(statusCode).json({
            healthy,
            ratio,
            uptime,
            timestamp,
            services,
        })
    }
}
