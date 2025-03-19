import { Injectable } from '@nestjs/common'
import { InstanceWrapper } from '@nestjs/core/injector/instance-wrapper'
import { Module } from '@nestjs/core/injector/module'
import { ModulesContainer } from '@nestjs/core/injector/modules-container'

import { FEATURE_HANDLER_METADATA } from '../decorators/feature.decorator'
import { IFeatureHandler } from '../interfaces/features.interfaces'

@Injectable()
export class FeatureExplorerService {
    constructor(private readonly modulesContainer: ModulesContainer) {}

    explore() {
        const modules = [...this.modulesContainer.values()]

        const features = this.flatMap<IFeatureHandler>(modules, (instance) =>
            this.filterByMetadataKey(instance, FEATURE_HANDLER_METADATA),
        )

        return features
    }

    private flatMap<T extends object>(
        modules: Module[],
        callback: (
            instance: InstanceWrapper,
        ) => InstanceWrapper<any> | undefined,
    ): InstanceWrapper<T>[] {
        const items = modules
            .map((moduleRef) => [...moduleRef.providers.values()].map(callback))
            .reduce((a, b) => a.concat(b), [])

        return items.filter((item) => !!item) as InstanceWrapper<T>[]
    }

    private filterByMetadataKey(wrapper: InstanceWrapper, metadataKey: string) {
        const { instance } = wrapper

        if (!instance) {
            return
        }

        if (!instance.constructor) {
            return
        }

        const metadata = Reflect.getMetadata(metadataKey, instance.constructor)

        if (!metadata) {
            return
        }

        return wrapper
    }
}
