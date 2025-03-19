import { Inject, Injectable, Logger, Optional, Type } from '@nestjs/common'
import { ModuleRef } from '@nestjs/core'
import { InstanceWrapper } from '@nestjs/core/injector/instance-wrapper'
import { decodeMessage, encodeMessage, NatsClientService } from '@shelfjs/nats'

import { FEATURE_CONFIG, FeatureConfig } from '../configs/feature-module.config'
import {
    FEATURE_HANDLER_METADATA,
    FEATURE_METADATA,
} from '../decorators/feature.decorator'
import {
    AsyncContext,
    Feature,
    FeatureHandlerNotFoundException,
    FeatureHandlerType,
    FeatureMetadata,
    FeatureNATSClientNotFoundException,
    IFeature,
    IFeatureBus,
    IFeatureHandler,
    InvalidFeatureHandlerException,
} from '../interfaces/features.interfaces'

@Injectable()
export class FeatureBus<FeatureBase extends IFeature = IFeature>
    implements IFeatureBus<FeatureBase>
{
    private readonly logger = new Logger(FeatureBus.name)
    private handlers = new Map<
        string,
        (feature: FeatureBase, asyncContext?: AsyncContext) => any
    >()

    constructor(
        private readonly moduleRef: ModuleRef,
        @Inject(FEATURE_CONFIG)
        private readonly config: FeatureConfig,
        @Optional()
        private readonly natsClient?: NatsClientService,
    ) {}

    /**
     * Executes a feature.
     * @param feature The feature to execute.
     * @returns A promise that, when resolved, will contain the result returned by the feature's handler.
     */
    async execute<R = void>(feature: Feature<R>): Promise<R>
    /**
     * Executes a feature.
     * @param feature The feature to execute.
     * @param context The context to use. Optional.
     * @returns A promise that, when resolved, will contain the result returned by the feature's handler.
     */
    async execute<R = void>(feature: Feature<R>, context?: AsyncContext): Promise<R>
    /**
     * Executes a feature.
     * @param feature The feature to execute.
     * @param context The context to use. Optional.
     * @returns A promise that, when resolved, will contain the result returned by the feature's handler.
     */
    async execute<T extends FeatureBase, R = any>(
        feature: T,
        context?: AsyncContext,
    ): Promise<R>
    /**
     * Executes a feature.
     * @param feature The feature to execute.
     * @param context The context to use. Optional.
     * @returns A promise that, when resolved, will contain the result returned by the feature's handler.
     */
    async execute<T extends FeatureBase, R = any>(
        feature: T,
        context?: AsyncContext,
    ): Promise<R> {
        const featureId = this.getFeatureId(feature)
        const executeFn = this.handlers.get(featureId)
        if (!executeFn) {
            if (this.config.externalBus === 'nats') {
                if (!this.natsClient) {
                    throw new FeatureNATSClientNotFoundException()
                }

                const { data } = await this.natsClient.request<T, R>(featureId, feature)

                return data
            }

            const featureName = this.getFeatureName(feature)
            throw new FeatureHandlerNotFoundException(featureName)
        }
        return executeFn(feature, context)
    }

    register(handlers: InstanceWrapper<IFeatureHandler<FeatureBase>>[] = []) {
        handlers.forEach((handler) => this.registerHandler(handler))
    }

    protected registerHandler(
        handler: InstanceWrapper<IFeatureHandler<FeatureBase>>,
    ) {
        const typeRef = handler.metatype as Type<IFeatureHandler<FeatureBase>>
        const target = this.reflectFeatureId(typeRef)
        if (!target) {
            throw new InvalidFeatureHandlerException()
        }

        if (this.handlers.has(target)) {
            this.logger.warn(
                `Feature handler [${typeRef.name}] is already registered. Overriding previously registered handler.`,
            )
        }

        this.bindLocal(handler, target)

        if (this.config.externalBus === 'nats') {
            this.bindNATS(handler, target)
        }
    }

    bindLocal<T extends FeatureBase>(
        handler: InstanceWrapper<IFeatureHandler<T>>,
        id: string,
    ) {
        if (handler.isDependencyTreeStatic()) {
            const instance = handler.instance
            if (!instance.execute) {
                throw new InvalidFeatureHandlerException()
            }
            this.handlers.set(id, (feature) =>
                instance.execute(feature as T & Feature<unknown>),
            )
            return
        }

        this.handlers.set(id, async (feature: T, context?: AsyncContext) => {
            context ??= AsyncContext.of(feature) ?? new AsyncContext()

            if (!AsyncContext.isAttached(context)) {
                // Features returned by sagas may already have an async context set
                // and a corresponding request provider registered.
                this.moduleRef.registerRequestByContextId(context, context.id)

                context.attachTo(feature)
            }

            const instance = await this.moduleRef.resolve(
                handler.metatype!,
                context.id,
                {
                    strict: false,
                },
            )
            return instance.execute(feature as T & Feature<unknown>)
        })
    }

    bindNATS<T extends FeatureBase>(
        handler: InstanceWrapper<IFeatureHandler<T>>,
        id: string,
    ) {
        if (!this.natsClient) {
            throw new FeatureNATSClientNotFoundException()
        }

        this.natsClient.reply(id, {
            callback: async (_error, message) => {
                const decodedMessage = decodeMessage(message.data)

                try {
                    const response = await handler.instance.execute(
                        decodedMessage as Feature<unknown>,
                    )

                    message.respond(encodeMessage(response))
                } catch (error) {
                    message.respond(encodeMessage(error))
                }
            },
        })
    }

    private getFeatureId(feature: FeatureBase): string {
        const { constructor: featureType } = Object.getPrototypeOf(feature)
        const featureMetadata: FeatureMetadata = Reflect.getMetadata(
            FEATURE_METADATA,
            featureType,
        )
        if (!featureMetadata) {
            throw new FeatureHandlerNotFoundException(featureType.name)
        }

        return featureMetadata.id
    }

    private getFeatureName(feature: FeatureBase): string {
        const { constructor } = Object.getPrototypeOf(feature)
        return constructor.name as string
    }

    private reflectFeatureId(handler: FeatureHandlerType): string | undefined {
        const feature: Type<IFeature> = Reflect.getMetadata(
            FEATURE_HANDLER_METADATA,
            handler,
        )
        const featureMetadata: FeatureMetadata = Reflect.getMetadata(
            FEATURE_METADATA,
            feature,
        )
        return featureMetadata.id
    }
}
