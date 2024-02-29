# NestJS NATS

NestJS does not provide full NATS support in their framework. Let's create our own :)

## Installation

Install `@shelfjs/nats` library

```bash
npm i --save @shelfjs/nats
```
    
## Features

- Built above [nats.js](https://github.com/nats-io/nats.js)
- Nats Core support
- Nats JetStream support
- Multi-connections
- Decorators (ex. @Consume, @Reply)

  
## Usage/Examples

Import NatsModule in your AppModule. NatsModule is a global module.

```ts 
import { NatsModule } from '@shelfjs/nats'
import { HealthChecksModule } from '@shelfjs/health-checks'
import * as env from 'env-var'

@Module({
    imports: [
        HealthChecksModule, // (optional) import HealthChecksModule to get NATS health status
        NatsModule.forRoot({
            connections: [
                {
                    connectionName: 'main-nats' // optional
                    servers: env.get('NATS_URL').required().asString(),
                    /* all nats.js options here */
                }
            ]
        }),
    ]
})
export class AppModule {}
```

After that, you can use NATS client services in your modules. 

## Nats Request/Reply

Inject `NatsClientService` for access to NATS Core features. Use `@Controller()` class decorator for `@Reply()` method decorator

```ts 
import { Controller } from '@nestjs/common'
import {
    NatsClientService,
    Reply,
    ReplyPayload,
    ReplyResponse,
} from '@shelfjs/nats'

@Controller()
export class CatController {
    constructor(
        private readonly natsClient: NatsClientService,
    ) {}

    async onApplicationBootstrap() {
        // request ping 
        await this.natsClient.request('ping', { text: 'hello' })
    }

    // Reply for ping request
    @Reply('ping')
    async ping(payload: ReplyPayload<any>): Promise<ReplyResponse<string>> {
        const response = `pong with message ${JSON.stringify(payload.data)}`

        const responseHeaders = {
            ping: 'pong',
        }

        return {
            data: response,
            headers: responseHeaders,
        }
    }
}
```

## JetStream Publish/Subscribe

Inject `NatsJetStreamClientService` for access to NATS JetStream features.  Use `@Controller()` class decorator for `@Consume()` method decorator

```ts
import { Controller, OnModuleInit } from '@nestjs/common'
import {
    Consume,
    ConsumePayload,
    ConsumerAcks,
    NatsJetStreamClientService,
    PublishOptions,
} from '@shelfjs/nats'
import { AckPolicy, PubAck, RetentionPolicy, StorageType } from 'nats'

@Controller()
export class CatController {
    constructor(
        private readonly natsJetStreamClient: NatsJetStreamClientService,
    ) {}

    // create stream
    async onApplicationBootstrap() {
        await this.natsJetStreamClient.createStream({
            autoupdate: true,
            name: 'stream_name',
            retention: RetentionPolicy.Limits,
            storage: StorageType.File,
            subjects: Object.values(SampleNatsJetStreamSubjectsEnum),
        })

        // publish a message
        await this.natsJetStreamClient.publish('ping', 'pong', { timeout: 5000 })
    }

    // consume message from stream
    @Consume({
        stream: 'stream_name',
        consumer: {
            durable_name: 'sample-consumer',
            filter_subject: 'ping',
            ack_policy: AckPolicy.All,
        }
    })
    async consumePing(payload: ConsumePayload<any>, acks: ConsumerAcks) {
        try {
            // do logic here
            acks.ack()
        } catch (error) {
            console.error(error)
            acks.nack()
        }
    }
}
```

## Multi-connections

Multi-connections allows you to connect to multiple NATS connection (it's not about clusters).
For example, you have 2 different applications that use different NATS instances. You can connect to them using `connections` option.

```ts 
import { NatsModule } from '@shelfjs/nats'
import { HealthChecksModule } from '@shelfjs/health-checks'
import * as env from 'env-var'

@Module({
    imports: [
        HealthChecksModule, // (optional) import HealthChecksModule to get NATS health status
        NatsModule.forRoot({
            connections: [
                {
                    connectionName: '1-nats'
                    servers: env.get('CAT_APP_NATS_URL').required().asString(),
                    /* all nats.js options here */
                },
                {
                    connectionName: '2-nats'
                    servers: env.get('DOG_APP_NATS_URL').required().asString(),
                    /* all nats.js options here */
                }
            ]
        }),
    ]
})
export class AppModule {}
```

Add optional `connectionName` option to Reply, Request, Consume, Publish methods

```ts 
import { Controller } from '@nestjs/common'
import {
    NatsClientService,
    Reply,
    ReplyPayload,
    ReplyResponse,
} from '@shelfjs/nats'

@Controller()
export class CatController {
    constructor(
        private readonly natsClient: NatsClientService,
    ) {}

    async onApplicationBootstrap() {
        // request ping 
        await this.natsClient.request('ping', { text: 'hello' }, {}, '1-nats') // <-- Use connection name here
    }

    // Reply for ping request
    @Reply('ping', '1-nats') // <-- Use connection name here
    async ping(payload: ReplyPayload<any>): Promise<ReplyResponse<string>> {
        const response = `pong with message ${JSON.stringify(payload.data)}`

        const responseHeaders = {
            ping: 'pong',
        }

        return {
            data: response,
            headers: responseHeaders,
        }
    }
}
```