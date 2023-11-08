import { SpanOptions } from '@opentelemetry/api'
import { InstrumentationOption } from '@opentelemetry/instrumentation'
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions'

export interface CreateSdkOptions {
    otlpHttpReceiverUrl?: string
    resourceAttributes?: Partial<Record<keyof typeof SemanticResourceAttributes, string>>
    instrumentations?: InstrumentationOption[]
}

export type SpanDecoratorOptions = SpanOptions & {
    name?: string
    includeFnArgsAttributes?: boolean
}