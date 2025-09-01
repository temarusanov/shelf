import { ConfigurableModuleBuilder } from '@nestjs/common'

export interface TRPCConfig {
    basePath?: string
    global?: boolean
    test?: boolean
}

export const DEFAULT_TRPC_CONFIG: Pick<TRPCConfig, 'test'> = { test: false }

export function patchTRPCConfig(
    config: Pick<typeof TRPC_OPTIONS_TYPE, keyof typeof DEFAULT_TRPC_CONFIG>,
) {
    return { ...DEFAULT_TRPC_CONFIG, ...config }
}

export const {
    ConfigurableModuleClass: TRPCConfigurableModuleClass,
    MODULE_OPTIONS_TOKEN: TRPC_CONFIG,
    ASYNC_OPTIONS_TYPE: TRPC_ASYNC_OPTIONS_TYPE,
    OPTIONS_TYPE: TRPC_OPTIONS_TYPE,
} = new ConfigurableModuleBuilder<TRPCConfig, 'forRoot'>({
    optionsInjectionToken: `TRPC_CONFIG`,
}).build()
