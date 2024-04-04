export interface EventsPublisherInterface<
    T extends string,
    K extends EventPayloadData,
> {
    send: (event: EventPayload<T, K>) => Promise<void>
}

export interface EventsPublisherInterfaceConstructor<
    T extends string,
    K extends EventPayloadData,
> {
    new (context: any, ...services: any): EventsPublisherInterface<T, K>
    new (): EventsPublisherInterface<T, K>
}

export interface EventsListenerInterface<
    T extends string,
    K extends EventPayloadData,
> {
    listen: <O>(
        pattern: T,
        callback: (event: EventPayload<T, K>) => Promise<void>,
        options?: O,
    ) => Promise<void>
}

export interface EventPayload<T extends string, K extends EventPayloadData> {
    pattern: T
    data: K[T]
    headers?: Record<string, string>
}

export type EventPayloadData = {
    [pattern: string]: any
}
