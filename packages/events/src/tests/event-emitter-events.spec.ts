import { Logger } from '@nestjs/common'
import { EventEmitterModule } from '@nestjs/event-emitter'
import { Test } from '@nestjs/testing'

import {
    createEventEmitterListener,
    createEventEmitterPublisher,
} from '../lib/services/event-emitter-events.service'
import { CatsModule } from './fixtures/cats/cats.module'
import { CatsService } from './fixtures/cats/cats.service'
import { CATS_LISTENER } from './fixtures/cats/events.config'
import { DogIntegration } from './fixtures/dog.integration'

describe('Event Emitter events test suite', () => {
    let dogIntegration: DogIntegration
    let catService: CatsService

    beforeAll(async () => {
        const moduleRef = await Test.createTestingModule({
            imports: [
                EventEmitterModule.forRoot({
                    global: true,
                }),
                CatsModule.forRoot({
                    eventsProvider: createEventEmitterPublisher(),
                }),
            ],
            providers: [
                DogIntegration,
                createEventEmitterListener({
                    injectionToken: CATS_LISTENER,
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
