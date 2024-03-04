import { FactoryProvider, Injectable } from '@nestjs/common'
import { filter, ReplaySubject, tap } from 'rxjs'

import {
    EventPayload,
    EventPayloadData,
    EventsServiceInterface,
} from '../interfaces/events.interfaces'

export const createRxJsEventsProvider = (): Omit<
    FactoryProvider,
    'provide'
> => ({
    useFactory: () => new RxJsEventsService(),
})

@Injectable()
export class RxJsEventsService<T extends string, K extends EventPayloadData>
    extends ReplaySubject<EventPayload<T, K>>
    implements EventsServiceInterface<T, K>
{
    constructor() {
        super()
    }

    async send(event: EventPayload<T, K>) {
        this.next(event)
    }

    async listen(
        pattern: string,
        callback: (event: EventPayload<T, K>) => Promise<void>,
    ): Promise<void> {
        this.asObservable()
            .pipe(
                filter<EventPayload<T, K>>(
                    (event) => event.pattern === pattern,
                ),
            )
            .pipe(tap(callback))
            .subscribe()
    }
}
