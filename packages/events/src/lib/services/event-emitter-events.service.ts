import { FactoryProvider, Injectable } from '@nestjs/common'
import { EventEmitter2 } from '@nestjs/event-emitter'

import {
    EventPayload,
    EventPayloadData,
    EventsPublisherInterface,
    EventsListenerInterface,
} from '../interfaces/events.interfaces'

export interface CreateEventEmitterListenerOptions {
    injectionToken: string
}

export const createEventEmitterPublisher = (): Omit<
    FactoryProvider,
    'provide'
> => ({
    useFactory: (eventEmitter: EventEmitter2) =>
        new EventEmitterPublisher(eventEmitter),
    inject: [EventEmitter2],
})

export const createEventEmitterListener = (
    options: CreateEventEmitterListenerOptions,
): FactoryProvider => ({
    provide: options.injectionToken,
    useFactory: (eventEmitter: EventEmitter2) =>
        new EventEmitterListener(eventEmitter),
    inject: [EventEmitter2],
})

@Injectable()
export class EventEmitterPublisher<T extends string, K extends EventPayloadData>
    implements EventsPublisherInterface<T, K>
{
    constructor(private readonly eventEmitter: EventEmitter2) {}

    async send(event: EventPayload<T, K>) {
        this.eventEmitter.emit(event.pattern, {
            data: event.data,
            headers: event.headers,
        })
    }
}

@Injectable()
export class EventEmitterListener<T extends string, K extends EventPayloadData>
    implements EventsListenerInterface<T, K>
{
    constructor(private readonly eventEmitter: EventEmitter2) {}

    async listen(
        pattern: string,
        callback: (event: EventPayload<T, K>) => Promise<void>,
    ): Promise<void> {
        this.eventEmitter.on(pattern, callback)
    }
}
