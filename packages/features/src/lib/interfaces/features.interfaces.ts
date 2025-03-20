import { Type } from '@nestjs/common'
import { InstanceWrapper } from '@nestjs/core/injector/instance-wrapper'

export const RESULT_TYPE_SYMBOL = Symbol('RESULT_TYPE')

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface IFeature {}

/**
 * Utility type to extract the result type of a feature.
 */
export type FeatureResult<C extends Feature<unknown>> =
    C extends Feature<infer R> ? R : never

export class Feature<T> implements IFeature {
    readonly [RESULT_TYPE_SYMBOL]: T
}

export type IFeatureHandler<TFeature extends IFeature = any, TResult = any> =
    TFeature extends Feature<infer InferredFeatureResult>
        ? {
              execute(feature: TFeature): Promise<InferredFeatureResult>
          }
        : {
              execute(feature: TFeature): Promise<TResult>
          }

export interface FeatureMetadata {
    id: string
}

export type FeatureHandlerType<T extends IFeature = IFeature> = Type<
    IFeatureHandler<T>
>

export abstract class IFeatureBus<FeatureBase extends IFeature = IFeature> {
    abstract execute<R = void>(feature: Feature<R>): Promise<R>
    abstract execute<T extends FeatureBase, R = any>(feature: T): Promise<R>

    abstract register(
        handlers: InstanceWrapper<IFeatureHandler<FeatureBase>>[],
    ): void
}

export class InvalidFeatureHandlerException extends Error {
    constructor() {
        super(
            `An invalid command handler has been provided. Please ensure that the provided handler is a class annotated with @Feature and contains an 'execute' method.`,
        )
    }
}

export class FeatureHandlerNotFoundException extends Error {
    constructor(commandName: string) {
        super(`No handler found for the feature: "${commandName}".`)
    }
}

export class FeatureNATSClientNotFoundException extends Error {
    constructor() {
        super(
            `FeatureBus couldn't find NATSModule. Do you initialize it via NATSModule.forRoot({...})?`,
        )
    }
}
