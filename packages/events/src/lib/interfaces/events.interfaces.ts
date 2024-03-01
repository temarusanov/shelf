export interface EventsServiceInterface<
    T extends string,
    K extends EventPayloadData,
> {
    send: (event: EventPayload<T, K>) => Promise<void>
    listen: (
        pattern: T,
        callback: (event: EventPayload<T, K>) => Promise<void>,
    ) => Promise<void>
}

export interface EventsServiceInterfaceConstructor<
    T extends string,
    K extends EventPayloadData,
> {
    new (context: string, ...services: any): EventsServiceInterface<T, K>
    new (): EventsServiceInterface<T, K>
}

export interface EventPayload<T extends string, K extends EventPayloadData> {
    pattern: T
    data: K[T]
    headers?: Record<string, string>
}

export type EventPayloadData = {
    [pattern: string]: any
}
