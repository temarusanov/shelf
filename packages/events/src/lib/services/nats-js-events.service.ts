import { FactoryProvider, Injectable, Logger } from '@nestjs/common'
import { decodeMessage, NatsJetStreamClientService } from '@shelfjs/nats'
import { AckPolicy } from 'nats'

import {
    EventPayload,
    EventPayloadData,
    EventsServiceInterface,
} from '../interfaces/events.interfaces'

export const createNatsJsEventsProvider = (
    stream: string,
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

    constructor(
        private readonly stream: string,
        private readonly natsJetStreamClient: NatsJetStreamClientService,
    ) {}

    async send(event: EventPayload<T, K>) {
        await this.natsJetStreamClient.publish(event.pattern, event.data)
    }

    async listen(
        pattern: string,
        callback: (event: EventPayload<T, K>) => Promise<void>,
    ): Promise<void> {
        const consumerInfo = await this.natsJetStreamClient.createConsumer(
            this.stream,
            {
                durable_name: `${pattern.toLowerCase()}_consumer`,
                filter_subject: pattern,
                ack_policy: AckPolicy.All,
            },
        )

        this.natsJetStreamClient.consume(this.stream, consumerInfo.name, {
            callback: async (message) => {
                try {
                    const decodedMessage = decodeMessage(message.data) as K[T]

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
        })
    }
}
