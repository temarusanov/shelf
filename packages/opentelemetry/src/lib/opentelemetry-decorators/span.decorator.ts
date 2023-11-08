import { Span, SpanStatusCode, trace } from '@opentelemetry/api'

import { SpanDecoratorOptions } from '../opentelemetry-interfaces/opentelemetry.interfaces'
import {
    copyMetadata,
    injectIntoArray,
} from '../opentelemetry-utils/opentelemetry.utils'
import { getCurrentSpanMeta } from './current-span.decorator'
import { getCurrentTracerMeta } from './current-tracer.decorator'

/**
 * Use `@Span({...})` to enable opentelemetry tracing on functions
 *
 * @param options.name - Span name
 * @param options.includeFnArgsAttributes - whether to include function args in span attributes
 */
export function Span(options?: SpanDecoratorOptions) {
    return (
        target: any,
        propertyKey: string,
        propertyDescriptor: PropertyDescriptor,
    ): void => {
        const fnOld = propertyDescriptor.value

        const currentSpanMeta = getCurrentSpanMeta(target, propertyKey)
        const currentTracerMeta = getCurrentTracerMeta(target, propertyKey)

        const setAttributeFnArgs =
            typeof options?.includeFnArgsAttributes === 'boolean'
                ? options.includeFnArgsAttributes
                : false

        const fnNew = function PropertyDescriptor(...args: any[]) {
            const tracer = trace.getTracer('default')
            const spanName =
                options?.name || `${target.constructor.name}.${propertyKey}`

            return tracer.startActiveSpan(
                spanName,
                {
                    root: options?.root,
                    kind: options?.kind,
                    links: options?.links,
                    startTime: options?.startTime,
                    attributes: options?.attributes,
                },
                (span) => {
                    const newArgs = injectIntoArray(args, [
                        {
                            newElement: span,
                            newElementIndex: currentSpanMeta?.index,
                        },
                        {
                            newElement: tracer,
                            newElementIndex: currentTracerMeta?.index,
                        },
                    ])

                    span.setStatus({ code: SpanStatusCode.OK })

                    if (setAttributeFnArgs) {
                        span.setAttributes({ args: JSON.stringify(args || {}) })
                    }

                    let result: any

                    // Why not to check fnOld.constructor.name === AsyncFunction
                    // https://github.com/Microsoft/TypeScript/issues/23757
                    try {
                        result = fnOld.apply(this, newArgs)
                    } catch (e) {
                        result = e
                    }

                    if (result instanceof Promise) {
                        return result
                            .catch((e: any) => {
                                span.recordException(e)
                                span.setStatus({
                                    code: SpanStatusCode.ERROR,
                                    message: e.message,
                                })

                                throw e
                            })
                            .finally(() => span.end())
                    }

                    if (result instanceof Error) {
                        span.recordException(result)
                        span.setStatus({
                            code: SpanStatusCode.ERROR,
                            message: result.message,
                        })
                        span.end()

                        throw result
                    }

                    span.end()

                    return result
                },
            )
        }

        propertyDescriptor.value = fnNew

        copyMetadata(fnOld, fnNew)
    }
}
