import { ConfigurableModuleBuilder } from '@nestjs/common'

export interface FeatureConfig {
    explore?: boolean
    externalBus?: 'nats'
}

export const DEFAULT_FEATURE_CONFIG: Pick<FeatureConfig, 'explore'> = {
    explore: true,
}

export function patchFeatureConfig(
    config: Pick<
        typeof FEATURE_OPTIONS_TYPE,
        keyof typeof DEFAULT_FEATURE_CONFIG
    >,
) {
    return {
        ...DEFAULT_FEATURE_CONFIG,
        ...config,
    }
}

export const {
    ConfigurableModuleClass: FEATUREConfigurableModuleClass,
    MODULE_OPTIONS_TOKEN: FEATURE_CONFIG,
    ASYNC_OPTIONS_TYPE: FEATURE_ASYNC_OPTIONS_TYPE,
    OPTIONS_TYPE: FEATURE_OPTIONS_TYPE,
} = new ConfigurableModuleBuilder<FeatureConfig, 'forRoot'>({
    optionsInjectionToken: `FEATURE_CONFIG`,
}).build()
