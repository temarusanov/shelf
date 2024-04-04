import { FactoryProvider } from '@nestjs/common'

import { EventsListenerInterface, EventsPublisherInterface } from '../../..'

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
