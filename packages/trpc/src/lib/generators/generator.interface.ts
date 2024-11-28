import type { Class } from 'type-fest'

import type { SchemaImports, TRPCContext } from '../interfaces'

export interface GeneratorModuleOptions {
    rootModuleFilePath: string
    context?: Class<TRPCContext>
    outputDirPath?: string
    schemaFileImports?: Array<SchemaImports>
}
