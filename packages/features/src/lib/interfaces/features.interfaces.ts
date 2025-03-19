import { Type } from '@nestjs/common'
import { ContextIdFactory } from '@nestjs/core'
import { InstanceWrapper } from '@nestjs/core/injector/instance-wrapper'

export const ASYNC_CONTEXT_ATTRIBUTE = Symbol('ASYNC_CONTEXT_ATTRIBUTE')

/**
 * Represents the context of an asynchronous operation.
 */
export class AsyncContext {
    public readonly id = ContextIdFactory.create()

    /**
     * Attaches the context to an object.
     * @param target The object to attach the context to.
     */
    public attachTo(target: object) {
        Object.defineProperty(target, ASYNC_CONTEXT_ATTRIBUTE, {
            value: this,
            enumerable: false,
        })
    }

    /**
     * Checks if target is already attached to any async context.
     * @param target The object to check.
     * @returns "true" if the target is attached to an async context, "false" otherwise.
     */
    static isAttached(target: object): boolean {
        return !!target[ASYNC_CONTEXT_ATTRIBUTE]
    }

    /**
     * Merges the context of an asynchronous operation from a given command, query, or event to another object.
     */
    static merge(from: object, to: object) {
        if (!from || !to) {
            return
        }
        const fromContext = from[ASYNC_CONTEXT_ATTRIBUTE]
        if (!fromContext) {
            return
        }
        Object.defineProperty(to, ASYNC_CONTEXT_ATTRIBUTE, {
            value: fromContext,
            enumerable: false,
        })
    }

    /**
     * Gets the context of an asynchronous operation from a given object.
     * @returns An "AsyncContext" instance or "undefined" if the context is not found.
     */
    static of(target: object): AsyncContext | undefined {
        return target[ASYNC_CONTEXT_ATTRIBUTE]
    }
}

export const RESULT_TYPE_SYMBOL = Symbol('RESULT_TYPE')

export interface IFeature {}

/**
 * Utility type to extract the result type of a feature.
 */
export type FeatureResult<C extends Feature<unknown>> =
    C extends Feature<infer R> ? R : never

export class Feature<T> implements IFeature {
    readonly [RESULT_TYPE_SYMBOL]: T
}

/**
 * Represents a feature handler.
 * Feature handlers are used to execute features.
 *
 * @publicApi
 */
export type IFeatureHandler<TFeature extends IFeature = any, TResult = any> =
    TFeature extends Feature<infer InferredFeatureResult>
        ? {
              /**
               * Executes a feature.
               * @param feature The feature to execute.
               */
              execute(feature: TFeature): Promise<InferredFeatureResult>
          }
        : {
              /**
               * Executes a feature.
               * @param feature The feature to execute.
               */
              execute(feature: TFeature): Promise<TResult>
          }

export interface FeatureMetadata {
    id: string
}

export type FeatureHandlerType<T extends IFeature = IFeature> = Type<
    IFeatureHandler<T>
>

/**
 * Represents a feature bus.
 *
 * @publicApi
 */
export abstract class IFeatureBus<FeatureBase extends IFeature = IFeature> {
    /**
     * Executes a feature.
     * @param feature The feature to execute.
     * @returns A promise that, when resolved, will contain the result returned by the feature's handler.
     */
    abstract execute<R = void>(feature: Feature<R>): Promise<R>
    /**
     * Executes a feature.
     * @param feature The feature to execute.
     * @param context The context to use. Optional.
     * @returns A promise that, when resolved, will contain the result returned by the feature's handler.
     */
    abstract execute<R = void>(
        feature: Feature<R>,
        context?: AsyncContext,
    ): Promise<R>
    /**
     * Executes a feature.
     * @param feature The feature to execute.
     * @param context The context to use. Optional.
     * @returns A promise that, when resolved, will contain the result returned by the feature's handler.
     */
    abstract execute<T extends FeatureBase, R = any>(
        feature: T,
        context?: AsyncContext,
    ): Promise<R>

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
