# Events

Package allows you to inject events provider and switch it when you want. For example you have application with a lot of 
modules communicating with each other. If you make communication between your modules using integration/infrastructure/usecases layer you would probably love this package

## Supported providers

- EventEmitter
- NATS

## Installation

```bash
npm i @shelfjs/events
```

## Usage

> Checkout [tests](./src/tests/) to learn more about it

### Prepare configs

Create events config. For example `cat-events.config.ts` in your dynamic module folder

```ts
import { FactoryProvider } from '@nestjs/common'

import { EventsListenerInterface, EventsPublisherInterface } from '@shelfjs/events'

export const CATS_PUBLISHER = 'CATS_PUBLISHER'
export const CATS_LISTENER = 'CATS_LISTENER'
export const CATS_CONTEXT = 'cats'

export type CatsEventPublisherProvider = Omit<
    FactoryProvider<CatsEventsPublisher>,
    'provide'
>

export type CatsEventsPublisher = EventsPublisherInterface<
    CatsEventPattern,
    CatsEventPatternToData
>

export type CatsEventsListener = EventsListenerInterface<
    CatsEventPattern,
    CatsEventPatternToData
>

export enum CatsEventPattern {
    CAT_CREATED = 'CAT_CREATED',
}

export interface CatCreatedEvent {
    name: string
}

export type CatsEventPatternToData = {
    [CatsEventPattern.CAT_CREATED]: CatCreatedEvent
}
```

Then add `eventsProvider` to config interface of your dynamic module

```ts
import { ConfigurableModuleBuilder } from '@nestjs/common'

import { CatsEventPublisherProvider } from './cat-events.config'

export interface CatConfig {
    catsColor: string
    eventsProvider: CatsEventPublisherProvider
}

export const {
    ConfigurableModuleClass: CatConfigurableModuleClass,
    MODULE_OPTIONS_TOKEN: CAT_CONFIG,
    ASYNC_OPTIONS_TYPE: CAT_ASYNC_OPTIONS_TYPE,
    OPTIONS_TYPE: CAT_OPTIONS_TYPE,
} = new ConfigurableModuleBuilder<CatConfig, 'forRoot'>({
    optionsInjectionToken: `CAT_CONFIG`,
}).build()
```

Add `eventsProvider` to your dynamic module

```ts
@Module({})
export class CatModule extends CatConfigurableModuleClass {
    static forRoot(options: typeof CAT_OPTIONS_TYPE): DynamicModule {
        const providers: Provider[] = [
            CatService,
            {
                provide: CAT_EVENTS,
                ...options.eventsProvider,
            },
        ]

        return {
            module: CatModule,
            providers,
            exports: providers,
        }
    }
}
```

### In your code

Inject event provider

```ts
import { Inject, Injectable } from '@nestjs/common'

import {
    CAT_EVENTS,
    CatEventPattern,
    CatEventServiceInterface,
} from '../configs/cat-events.config'

@Injectable()
export class CatService {
    constructor(
        @Inject(CAT_EVENTS)
        private readonly events: CatEventServiceInterface,
    ) {}

    async createKitty() {
        // creating cat...

        // send event
        await this.events.send({
            pattern: CatEventPattern.KITTY_CREATED,
            data: {
                catId: 1,
                name: 'Tom'
            }
        })
    }
}
```

### Using EventEmitter provider

```ts
import { Module } from '@nestjs/common'
import { createRxJsEventsProvider } from '@shelfjs/events/src/lib/services/event-emitter-events.service'

@Module({
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
})
export class AppModule {}
```

Create integration and use `listen()` functions. For example `cat-integration.service.ts`

```ts
@Injectable()
export class DogIntegration {
    constructor(
        @Inject(CATS_LISTENER)
        private readonly events: CatsEventsListener,
    ) {}

    onApplicationBootstrap() {
        this.listenCatCreatedEvent()
    }

    listenCatCreatedEvent() {
        this.events.listen(CatsEventPattern.CAT_CREATED, async (event) => {
            console.log(event)
        })
    }
}

```


### Using NATS provider

Every module needs their own NATS stream. For every `pattern` in your code the new consumer is being created.

```ts
import { Module } from '@nestjs/common'
import { createRxJsEventsProvider } from '@shelfjs/events/src/lib/services/nats-events.service'

@Module({
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
})
export class AppModule {}
```

Create integration and use `listen()` functions. For example `cat-integration.service.ts`

```ts
@Injectable()
export class DogIntegration {
    constructor(
        @Inject(CATS_LISTENER)
        private readonly events: CatsEventsListener,
    ) {}

    onApplicationBootstrap() {
        this.listenCatCreatedEvent()
    }

    listenCatCreatedEvent() {
        this.events.listen<NatsJsEventsListenConsumerOptions>(
            CatEventPattern.KITTY_CREATED,
            async (event) => {
                console.log(event.data)
            },
            // use `NatsJsEventsListenConsumerOptions` to get types for NATS consumer's options
            {
                ack_policy: AckPolicy.All,
                ack_wait: 10000,
            }
        )
    }
}
```
