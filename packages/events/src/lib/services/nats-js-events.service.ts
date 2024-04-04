import { FactoryProvider, Injectable, Logger } from '@nestjs/common'
import {
    CreateStream,
    decodeMessage,
    NatsJetStreamClientService,
} from '@shelfjs/nats'
import { ConsumerConfig, headers } from 'nats'

import {
    EventPayload,
    EventPayloadData,
    EventsListenerInterface,
    EventsPublisherInterface,
} from '../interfaces/events.interfaces'

export type NatsJsListenerConsumerOptions = Omit<
    Partial<ConsumerConfig>,
    'durable_name' | 'filter_subject'
>

export interface CreateNatsJsListenerOptions {
    streamName: string
    injectionToken: string
}

export const createNatsJsPublisher = (
    stream: CreateStream,
): Omit<FactoryProvider, 'provide'> => ({
    useFactory: (natsJsService: NatsJetStreamClientService) =>
        new NatsJsPublisher(stream, natsJsService),
    inject: [NatsJetStreamClientService],
})

export const createNatsJsListener = (
    options: CreateNatsJsListenerOptions,
): FactoryProvider => ({
    provide: options.injectionToken,
    useFactory: (natsJsService: NatsJetStreamClientService) =>
        new NatsJsListener(options.streamName, natsJsService),
    inject: [NatsJetStreamClientService],
})

@Injectable()
export class NatsJsPublisher<T extends string, K extends EventPayloadData>
    implements EventsPublisherInterface<T, K>
{
    constructor(
        private readonly streamOptions: CreateStream,
        private readonly natsJetStreamClient: NatsJetStreamClientService,
    ) {}

    async onModuleInit() {
        await this.natsJetStreamClient.createStream({
            ...this.streamOptions,
            autoupdate: true,
        })
    }

    async send(event: EventPayload<T, K>) {
        await this.natsJetStreamClient.publish(event.pattern, event.data, {
            headers: event.headers,
        })
    }
}

@Injectable()
export class NatsJsListener<T extends string, K extends EventPayloadData>
    implements EventsListenerInterface<T, K>
{
    private logger = new Logger()

    constructor(
        private readonly streamName: string,
        private readonly natsJetStreamClient: NatsJetStreamClientService,
    ) {}

    async listen<NatsJsEventsListenConsumerOptions>(
        pattern: string,
        callback: (event: EventPayload<T, K>) => Promise<void>,
        options?: NatsJsEventsListenConsumerOptions,
    ): Promise<void> {
        const consumerInfo = await this.natsJetStreamClient.createConsumer(
            this.streamName,
            {
                ...options,
                durable_name: `${pattern.toLowerCase()}_consumer`,
                filter_subject: pattern,
            },
        )

        this.natsJetStreamClient.consume(this.streamName, consumerInfo.name, {
            callback: async (message) => {
                try {
                    const decodedMessage = decodeMessage(message.data) as K[T]

                    const headersKeys = message.headers?.keys()

                    let parsedHeaders: Record<string, string> = {}

                    if (headersKeys !== undefined && headersKeys.length !== 0) {
                        for (const key of headersKeys) {
                            parsedHeaders[key] = message.headers?.get(key)!
                        }
                    }

                    await callback({
                        pattern: message.subject as T,
                        data: decodedMessage,
                        headers: parsedHeaders,
                    })

                    await message.ackAck()
                } catch (error) {
                    this.logger.error(error)
                    message.nak()
                }
            },
        })
    }
}
