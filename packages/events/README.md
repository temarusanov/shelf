# Events

Package allows you to inject events provider and switch it when you want. For example you have application with a lot of 
modules communicating with each other. If you make communication between your modules using integration layer you would probably love this package

## Supported providers

- RxJs
- NATS

## Installation

```bash
npm i @shelfjs/events
```

## Usage

### Prepare configs

Create events config. For example `cat-events.config.ts` in your dynamic module folder

```ts
import { FactoryProvider } from '@nestjs/common'
import {
    EventsServiceInterface,
    EventsServiceInterfaceConstructor,
} from '@shelfjs/events'

export const CAT_EVENTS = 'CAT_EVENTS'

export type CatEventServiceProvider = Omit<
    FactoryProvider<CatEventServiceInterface>,
    'provide'
>

export type CatEventServiceInterface = EventsServiceInterface<
    CatEventPattern,
    CatEventPatternToData
>
export type CatEventServiceInterfaceConstructor =
    EventsServiceInterfaceConstructor<CatEventPattern, CatEventPatternToData>

// Your events' interfaces below

export enum CatEventPattern {
    KITTY_CREATED = 'kitty_created',
}

export interface CatKittyCreatedEvent {
    catId: string
    name: string
}

type CatEventPatternToData = {
    [CatEventPattern.KITTY_CREATED]: CatKittyCreatedEvent
}
```

Then add `eventsProvider` to config interface of your dynamic module

```ts
import { ConfigurableModuleBuilder } from '@nestjs/common'

import { CatEventServiceProvider } from './cat-events.config'

export interface CatConfig {
    catsColor: string
    eventsProvider: CatEventServiceProvider
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

### Using RxJS provider

```ts
import { Module } from '@nestjs/common'
import { createRxJsEventsProvider } from '@shelfjs/events/src/lib/services/rxjs-events.service'

@Module({
    imports: [
        CatModule.forRoot({
            eventsProvider: createRxJsEventsProvider(),
        }),
    ],
    providers: [CatIntegration],
})
export class AppModule {}
```

Create integration and use `listen()` functions. For example `cat-integration.service.ts`

```ts
import { Inject, Injectable } from '@nestjs/common'

import {
    CAT_EVENTS,
    CatEventPattern,
    CatEventServiceInterface,
} from '../modules/cats/configs/cat-events.config'

@Injectable()
export class CatIntegration {
    constructor(
        @Inject(CAT_EVENTS)
        private readonly events: CatEventServiceInterface,
    ) {}

    async onApplicationBootstrap() {
        try {
            this.listenKittyCreated()
        } catch (error) {
            this.logger.error(error, error.stack)
        }
    }

    async listenKittyCreated() {
        this.events.listen(
            CatEventPattern.KITTY_CREATED,
            async (event) => {
                console.log(event.data)
            },
        )
    }
}
```


### Using NATS provider

Every module needs their own NATS stream. For every `pattern` in your code the new consumer is being created.

```ts
import { Module } from '@nestjs/common'
import { createRxJsEventsProvider } from '@shelfjs/events/src/lib/services/nats-js-events.service'

@Module({
    imports: [
        CatModule.forRoot({
            eventsProvider: createNatsJsEventsProvider({
                name: 'nats-stream-name',
                // other nats stream options here
            }),
        }),
    ],
    providers: [CatIntegration],
})
export class AppModule {}
```

Create integration and use `listen()` functions. For example `cat-integration.service.ts`

```ts
import { Inject, Injectable } from '@nestjs/common'

import {
    CAT_EVENTS,
    CatEventPattern,
    CatEventServiceInterface,
} from '../modules/cats/configs/cat-events.config'

@Injectable()
export class CatIntegration {
    constructor(
        @Inject(CAT_EVENTS)
        private readonly events: CatEventServiceInterface,
    ) {}

    async onApplicationBootstrap() {
        try {
            this.listenKittyCreated()
        } catch (error) {
            this.logger.error(error, error.stack)
        }
    }

    async listenKittyCreated() {
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
