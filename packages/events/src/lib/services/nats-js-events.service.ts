import { FactoryProvider, Injectable, Logger } from '@nestjs/common'
import {
    CreateStream,
    decodeMessage,
    NatsJetStreamClientService,
} from '@shelfjs/nats'
import { ConsumerConfig, StreamInfo } from 'nats'

import {
    EventPayload,
    EventPayloadData,
    EventsServiceInterface,
} from '../interfaces/events.interfaces'

export type NatsJsEventsListenConsumerOptions = Omit<
    Partial<ConsumerConfig>,
    'durable_name' | 'filter_subject'
>

export const createNatsJsEventsProvider = (
    stream: CreateStream,
): Omit<FactoryProvider, 'provide'> => ({
    useFactory: (natsJsService: NatsJetStreamClientService) =>
        new NatsJsEventsService(stream, natsJsService),
    inject: [NatsJetStreamClientService],
})

@Injectable()
export class NatsJsEventsService<T extends string, K extends EventPayloadData>
    implements EventsServiceInterface<T, K>
{
    private logger = new Logger()

    private stream!: StreamInfo

    constructor(
        private readonly streamOptions: CreateStream,
        private readonly natsJetStreamClient: NatsJetStreamClientService,
    ) {}

    async onModuleInit() {
        this.stream = await this.natsJetStreamClient.createStream(
            this.streamOptions,
        )
    }

    async send(event: EventPayload<T, K>) {
        await this.natsJetStreamClient.publish(event.pattern, event.data)
    }

    async listen<NatsJsEventsListenConsumerOptions>(
        pattern: string,
        callback: (event: EventPayload<T, K>) => Promise<void>,
        options?: NatsJsEventsListenConsumerOptions,
    ): Promise<void> {
        const consumerInfo = await this.natsJetStreamClient.createConsumer(
            this.stream.config.name,
            {
                ...options,
                durable_name: `${pattern.toLowerCase()}_consumer`,
                filter_subject: pattern,
            },
        )

        this.natsJetStreamClient.consume(
            this.stream.config.name,
            consumerInfo.name,
            {
                callback: async (message) => {
                    try {
                        const decodedMessage = decodeMessage(
                            message.data,
                        ) as K[T]

                        await callback({
                            pattern: message.subject as T,
                            data: decodedMessage,
                        })

                        await message.ackAck()
                    } catch (error) {
                        this.logger.error(error)
                        message.nak()
                    }
                },
            },
        )
    }
}
