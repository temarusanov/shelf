import { Injectable } from '@nestjs/common'

import { NatsConnectionService } from './nats-connection.service'
import { NatsListenerService } from './nats-listener.service'

@Injectable()
export class NatsBoostrapService {
    constructor(
        private readonly connection: NatsConnectionService,
        private readonly listener: NatsListenerService,
    ) {}

    async onModuleInit() {
        await this.connection._setupConnection()
        await this.listener._setupReplyListeners()
        await this.listener._setupConsumeListeners()
    }

    async onModuleDestroy() {
        await this.connection._stopConnection()
    }
}
