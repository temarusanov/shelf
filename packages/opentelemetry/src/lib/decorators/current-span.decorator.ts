import 'reflect-metadata'

export const SPAN_CURRENT_METADATA = 'SPAN_CURRENT_METADATA'

export function CurrentSpan(): ParameterDecorator {
    return (target: any, key: string, index: number) => {
        Reflect.defineMetadata(
            `${key}${SPAN_CURRENT_METADATA}`,
            { index },
            target,
        )
    }
}

export function getCurrentSpanMeta(target: any, key: string) {
    return Reflect.getMetadata(`${key}${SPAN_CURRENT_METADATA}`, target)
}
