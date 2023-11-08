import { AsyncLocalStorageContextManager } from '@opentelemetry/context-async-hooks'
import {
    CompositePropagator,
    W3CBaggagePropagator,
    W3CTraceContextPropagator,
} from '@opentelemetry/core'
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http'
import { B3InjectEncoding, B3Propagator } from '@opentelemetry/propagator-b3'
import { JaegerPropagator } from '@opentelemetry/propagator-jaeger'
import { Resource } from '@opentelemetry/resources'
import { NodeSDK } from '@opentelemetry/sdk-node'
import {
    BatchSpanProcessor,
    SimpleSpanProcessor,
} from '@opentelemetry/sdk-trace-base'
import { ConsoleSpanExporter } from '@opentelemetry/sdk-trace-node'
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions'

import { CreateSdkOptions } from './opentelemetry-interfaces/opentelemetry.interfaces'

/**
 * Initialize OTEL process
 *
 * @param options.otlpHttpReceiverUrl - Usually end on `/v1/traces`. Optional if you want to export tracing to stdout
 */
export function createOTELSdk(options?: CreateSdkOptions): NodeSDK {
    const resourceAttributes: Record<string, string> = {}

    if (typeof options?.resourceAttributes !== 'undefined') {
        for (const key in options.resourceAttributes) {
            const value = options.resourceAttributes[key]

            resourceAttributes[SemanticResourceAttributes[key]] = value
        }
    }

    let traceExporter: ConsoleSpanExporter | OTLPTraceExporter
    let spanProcessor: BatchSpanProcessor | SimpleSpanProcessor

    // https://github.com/open-telemetry/opentelemetry-collector/blob/main/exporter/otlphttpexporter/README.md
    if (options?.otlpHttpReceiverUrl) {
        traceExporter = new OTLPTraceExporter({
            url: options.otlpHttpReceiverUrl,
        })
        spanProcessor = new BatchSpanProcessor(traceExporter, {
            maxQueueSize: 8192,
            maxExportBatchSize: 2048,
            scheduledDelayMillis: 5000,
            exportTimeoutMillis: 60000,
        })
    } else {
        traceExporter = new ConsoleSpanExporter()
        spanProcessor = new SimpleSpanProcessor(traceExporter)
    }

    const sdk = new NodeSDK({
        resource: new Resource(resourceAttributes),
        traceExporter,
        spanProcessor,
        contextManager: new AsyncLocalStorageContextManager(),
        textMapPropagator: new CompositePropagator({
            propagators: [
                new JaegerPropagator(),
                new W3CTraceContextPropagator(),
                new W3CBaggagePropagator(),
                new B3Propagator(),
                new B3Propagator({
                    injectEncoding: B3InjectEncoding.MULTI_HEADER,
                }),
            ],
        }),
        instrumentations: options?.instrumentations || [],
    })

    return sdk
}
