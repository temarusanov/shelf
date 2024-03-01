import { Injectable, Logger } from '@nestjs/common'
import { decodeMessage, NatsJetStreamClientService } from '@shelfjs/nats'

import {
    EventPayload,
    EventPayloadData,
    EventsServiceInterface,
} from '../interfaces/events.interfaces'

@Injectable()
export class NatsJsEventsService<T extends string, K extends EventPayloadData>
    implements EventsServiceInterface<T, K>
{
    private logger = new Logger()

    constructor(
        private readonly stream: string,
        private readonly natsJetStream: NatsJetStreamClientService,
    ) {}

    async send(event: EventPayload<T, K>) {
        await this.natsJetStream.publish(event.pattern, event.data)
    }

    async listen(
        pattern: string,
        callback: (event: EventPayload<T, K>) => Promise<void>,
    ): Promise<void> {
        this.natsJetStream.consume(this.stream, `${pattern}_consumer`, {
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
