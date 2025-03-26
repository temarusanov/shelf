import { Inject, Injectable, Logger, Optional, Type } from '@nestjs/common'
import { InstanceWrapper } from '@nestjs/core/injector/instance-wrapper'
import { decodeMessage, encodeMessage, NatsClientService } from '@shelfjs/nats'

import { FEATURE_CONFIG, FeatureConfig } from '../configs/feature-module.config'
import {
    FEATURE_HANDLER_METADATA,
    FEATURE_METADATA,
} from '../decorators/feature.decorator'
import {
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
export class FeaturesBus<FeatureBase extends IFeature = IFeature>
    implements IFeatureBus<FeatureBase>
{
    private readonly logger = new Logger(FeaturesBus.name)
    private handlers = new Map<string, (feature: FeatureBase) => any>()

    constructor(
        @Inject(FEATURE_CONFIG)
        private readonly config: FeatureConfig,
        @Optional()
        private readonly natsClient?: NatsClientService,
    ) {}

    async execute<T extends FeatureBase, R = any>(feature: T): Promise<R> {
        const featureName = this.getFeatureName(feature)
        const executeFn = this.handlers.get(featureName)

        if (!executeFn) {
            if (this.config.externalBus === 'nats') {
                if (!this.natsClient) {
                    throw new FeatureNATSClientNotFoundException()
                }

                const { data } = await this.natsClient.request<T, R>(
                    featureName,
                    feature,
                )

                return data
            }

            throw new FeatureHandlerNotFoundException(featureName)
        }

        return executeFn(feature)
    }

    register(handlers: InstanceWrapper<IFeatureHandler<FeatureBase>>[] = []) {
        handlers.forEach((handler) => this.registerHandler(handler))
    }

    protected registerHandler(
        handler: InstanceWrapper<IFeatureHandler<FeatureBase>>,
    ) {
        const typeRef = handler.metatype as Type<IFeatureHandler<FeatureBase>>

        const feature: Type<IFeature> = Reflect.getMetadata(
            FEATURE_HANDLER_METADATA,
            typeRef,
        )

        const target = feature.name

        if (!target) {
            throw new InvalidFeatureHandlerException()
        }

        if (this.handlers.has(target)) {
            this.logger.warn(
                `Feature [${target}] is already registered. Overriding previously registered handler.`,
            )
        }

        this.bindLocal(handler, target)

        if (this.config.externalBus === 'nats') {
            this.bindNATS(handler, target)
        }
    }

    private bindLocal<T extends FeatureBase>(
        handler: InstanceWrapper<IFeatureHandler<T>>,
        id: string,
    ) {
        const instance = handler.instance

        if (!instance.execute) {
            throw new InvalidFeatureHandlerException()
        }

        this.handlers.set(id, (feature) =>
            instance.execute(feature as T & Feature<unknown>),
        )
        return
    }

    private bindNATS<T extends FeatureBase>(
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
