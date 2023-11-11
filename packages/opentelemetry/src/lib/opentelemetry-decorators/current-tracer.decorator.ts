import 'reflect-metadata'

export const TRACER_CURRENT_METADATA = 'TRACER_CURRENT_METADATA'

export function CurrentTracer(): ParameterDecorator {
    return (target: any, key: string, index: number) => {
        Reflect.defineMetadata(
            `${key}${TRACER_CURRENT_METADATA}`,
            { index },
            target,
        )
    }
}

export function getCurrentTracerMeta(target: any, key: string) {
    return Reflect.getMetadata(`${key}${TRACER_CURRENT_METADATA}`, target)
}
