import { Logger } from '@nestjs/common'
import { EventEmitterModule } from '@nestjs/event-emitter'
import { Test } from '@nestjs/testing'
import { NatsModule } from '@shelfjs/nats'
import { GenericContainer } from 'testcontainers'

import {
    createNatsJsListener,
    createNatsJsPublisher,
} from '../lib/services/nats-js-events.service'
import { CatsModule } from './fixtures/cats/cats.module'
import { CatsService } from './fixtures/cats/cats.service'
import {
    CATS_CONTEXT,
    CATS_LISTENER,
    CatsEventPattern,
} from './fixtures/cats/events.config'
import { DogIntegration } from './fixtures/dog.integration'

describe('Event Emitter events test suite', () => {
    let dogIntegration: DogIntegration
    let catService: CatsService

    beforeAll(async () => {
        const natsContainer = await new GenericContainer('nats:2.9.14-alpine')
            .withExposedPorts(4222)
            .withCommand(['--jetstream'])
            .start()

        const natsServerUrls = [
            `nats://${natsContainer.getHost()}:${natsContainer.getMappedPort(4222)}`,
        ]

        await new Promise((r) => setTimeout(r, 2000))

        const moduleRef = await Test.createTestingModule({
            imports: [
                NatsModule.forRoot({
                    connections: [
                        {
                            servers: natsServerUrls,
                        },
                    ],
                }),
                CatsModule.forRoot({
                    eventsProvider: createNatsJsPublisher({
                        name: CATS_CONTEXT,
                        subjects: Object.values(CatsEventPattern),
                    }),
                }),
            ],
            providers: [
                DogIntegration,
                createNatsJsListener({
                    injectionToken: CATS_LISTENER,
                    streamName: CATS_CONTEXT,
                }),
            ],
        }).compile()

        const app = moduleRef.createNestApplication()
        app.useLogger(new Logger())
        await app.listen(0)

        dogIntegration = moduleRef.get<DogIntegration>(DogIntegration)
        catService = moduleRef.get<CatsService>(CatsService)
    })

    it('Expect dog integration to catch event', async () => {
        const spy = jest.spyOn(dogIntegration, 'onCatCreatedEvent')
        await catService.createCat('Tom')
        await new Promise((r) => setTimeout(r, 200))
        expect(spy).toHaveBeenCalled()

        spy.mockReset()
        spy.mockRestore()
    })
})
