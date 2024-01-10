import 'reflect-metadata'
import {
    Counter,
    MetricOptions,
    UpDownCounter,
    Histogram,
    ObservableGauge,
    ObservableCounter,
    ObservableUpDownCounter,
    metrics,
} from '@opentelemetry/api'

export function injectIntoArray(
    arr: any[],
    newElements: {
        newElement: any
        newElementIndex?: number
    }[],
) {
    const result = [...arr]

    for (const { newElement, newElementIndex } of newElements) {
        if (typeof newElementIndex === 'number') {
            result.splice(newElementIndex, 0, newElement)
        }
    }

    return result
}

export const copyMetadata = (from: object, to: object): void => {
    Reflect.getMetadataKeys(from).forEach((key) => {
        Reflect.defineMetadata(key, Reflect.getMetadata(key, from), to)
    })
}

// Reference: https://github.com/pragmaticivan/nestjs-otel/blob/main/src/metrics/metric-data.ts

const OTEL_METER_NAME = 'OTEL_METER_NAME'

export type GenericMetric =
    | Counter
    | UpDownCounter
    | Histogram
    | ObservableGauge
    | ObservableCounter
    | ObservableUpDownCounter

export enum MetricType {
    'Counter' = 'Counter',
    'UpDownCounter' = 'UpDownCounter',
    'Histogram' = 'Histogram',
    'ObservableGauge' = 'ObservableGauge',
    'ObservableCounter' = 'ObservableCounter',
    'ObservableUpDownCounter' = 'ObservableUpDownCounter',
}

export const meterData: Map<string, GenericMetric> = new Map()

export function getHistogram(
    name: string,
    options: MetricOptions = {},
): Histogram {
    if (meterData.has(name)) {
        return meterData.get(name) as Histogram
    }

    const meter = metrics.getMeterProvider().getMeter(OTEL_METER_NAME)
    const histogram = meter.createHistogram(name, options)
    meterData.set(name, histogram)
    return histogram
}

export function getCounter(name: string, options: MetricOptions = {}): Counter {
    if (meterData.has(name)) {
        return meterData.get(name) as Counter
    }

    const meter = metrics.getMeterProvider().getMeter(OTEL_METER_NAME)

    const counter = meter.createCounter(name, options)
    meterData.set(name, counter)
    return counter
}

export function getUpDownCounter(
    name: string,
    options: MetricOptions = {},
): UpDownCounter {
    if (meterData.has(name)) {
        return meterData.get(name) as UpDownCounter
    }

    const meter = metrics.getMeterProvider().getMeter(OTEL_METER_NAME)

    const upDownCounter = meter.createUpDownCounter(name, options)
    meterData.set(name, upDownCounter)
    return upDownCounter
}

export function getObservableGauge(
    name: string,
    options: MetricOptions = {},
): ObservableGauge {
    if (meterData.has(name)) {
        return meterData.get(name) as ObservableGauge
    }

    const meter = metrics.getMeterProvider().getMeter(OTEL_METER_NAME)

    const observableGauge = meter.createObservableGauge(name, options)
    meterData.set(name, observableGauge)
    return observableGauge
}

export function getObservableCounter(
    name: string,
    options: MetricOptions = {},
): ObservableCounter {
    if (meterData.has(name)) {
        return meterData.get(name) as ObservableCounter
    }

    const meter = metrics.getMeterProvider().getMeter(OTEL_METER_NAME)

    const observableCounter = meter.createObservableCounter(name, options)
    meterData.set(name, observableCounter)
    return observableCounter
}

export function getObservableUpDownCounter(
    name: string,
    options: MetricOptions = {},
): ObservableUpDownCounter {
    if (meterData.has(name)) {
        return meterData.get(name) as ObservableUpDownCounter
    }

    const meter = metrics.getMeterProvider().getMeter(OTEL_METER_NAME)

    const observableCounter = meter.createObservableCounter(name, options)
    meterData.set(name, observableCounter)
    return observableCounter
}
