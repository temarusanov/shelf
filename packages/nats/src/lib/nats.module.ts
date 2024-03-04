import { DiscoveryModule } from '@golevelup/nestjs-discovery'
import { DynamicModule, Module } from '@nestjs/common'

import {
    NATS_ASYNC_OPTIONS_TYPE,
    NATS_CONFIG,
    NATS_OPTIONS_TYPE,
    NatsConfigurableModuleClass,
    patchNatsConfig,
} from './configs/nats-module.config'
import { NatsConnectionHealthIndicator } from './indicators/nats-connection-health.indicator'
import { NatsBoostrapService } from './services/nats-bootstrap.service'
import { NatsClientService } from './services/nats-client.service'
import { NatsConnectionService } from './services/nats-connection.service'
import { NatsJetStreamClientService } from './services/nats-jetstream-client.service'
import { NatsListenerService } from './services/nats-listener.service'

@Module({})
export class NatsModule extends NatsConfigurableModuleClass {
    static forRoot(options: typeof NATS_OPTIONS_TYPE): DynamicModule {
        return {
            ...this.forRootAsync({
                useFactory: async () => options,
            }),
        }
    }

    static forRootAsync(
        options?: typeof NATS_ASYNC_OPTIONS_TYPE,
    ): DynamicModule {
        const useFactory = options?.useFactory
        const useClass = options?.useClass

        if (options?.useExisting) {
            throw new Error(`options?.useExisting is not supported!`)
        }

        return {
            global: true,
            module: NatsModule,
            imports: [...(options?.imports || []), DiscoveryModule],
            providers: [
                NatsBoostrapService,
                NatsConnectionService,
                NatsClientService,
                NatsJetStreamClientService,
                NatsListenerService,
                NatsConnectionHealthIndicator,
                ...(useClass
                    ? [
                          {
                              provide: `${String(NATS_CONFIG)}_TEMP`,
                              useClass,
                          },
                          {
                              provide: NATS_CONFIG,
                              useFactory: async (config) =>
                                  patchNatsConfig(config),
                              inject: [`${String(NATS_CONFIG)}_TEMP`],
                          },
                      ]
                    : []),
                ...(useFactory
                    ? [
                          {
                              provide: NATS_CONFIG,
                              useFactory: async (...args) =>
                                  patchNatsConfig(await useFactory(...args)),
                              inject: options?.inject || [],
                          },
                      ]
                    : [
                          {
                              provide: NATS_CONFIG,
                              useValue: patchNatsConfig({}),
                          },
                      ]),
            ],
            exports: [
                NATS_CONFIG,
                NatsConnectionService,
                NatsClientService,
                NatsListenerService,
                NatsJetStreamClientService,
            ],
        }
    }
}
