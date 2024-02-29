import { applyDecorators, SetMetadata } from '@nestjs/common'

import { REPLY_METADATA } from '../constants/nats.constants'
import { SubscriptionOptions } from '../interfaces/nats.interfaces'

export function Reply(
    subject: string,
    options?: SubscriptionOptions,
    connectionName?: string,
) {
    return applyDecorators(
        SetMetadata(REPLY_METADATA, { subject, options, connectionName }),
    )
}
