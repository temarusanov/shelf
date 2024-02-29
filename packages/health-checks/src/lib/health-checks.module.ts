import { DiscoveryModule } from '@golevelup/nestjs-discovery'
import { Module } from '@nestjs/common'

import { HealthChecksController } from './controllers/health-checks.controller'

@Module({
    imports: [DiscoveryModule],
    controllers: [HealthChecksController],
})
export class HealthChecksModule {}
