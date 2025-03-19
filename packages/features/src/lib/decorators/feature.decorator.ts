import 'reflect-metadata'

import { Injectable, InjectableOptions } from '@nestjs/common'
import { randomUUID } from 'crypto'

import { IFeature } from '../interfaces/features.interfaces'

export const FEATURE_METADATA = '__feature__'
export const FEATURE_HANDLER_METADATA = '__featureHandler__'

export const Feature = (
    feature: IFeature | (new (...args: any[]) => IFeature),
    options?: InjectableOptions,
): ClassDecorator => {
    return (target: Function) => {
        if (!Reflect.hasOwnMetadata(FEATURE_METADATA, feature)) {
            Reflect.defineMetadata(
                FEATURE_METADATA,
                { id: randomUUID() },
                feature,
            )
        }
        Reflect.defineMetadata(FEATURE_HANDLER_METADATA, feature, target)

        if (options) {
            Injectable(options)(target)
        }
    }
}
