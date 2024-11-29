import * as path from 'node:path'
import * as process from 'node:process'

import { Inject, Injectable, Logger } from '@nestjs/common'
import { Project } from 'ts-morph'
import type { Class } from 'type-fest'

import { MiddlewareFactory } from '../factories/middleware.factory'
import { ProcedureFactory } from '../factories/procedure.factory'
import { RouterFactory } from '../factories/router.factory'
import { SchemaImports, TRPCContext } from '../interfaces'
import { SourceFileImportsMap } from '../interfaces/generator.interface'
import { ImportsScanner } from '../scanners/imports.scanner'
import { TRPC_MODULE_CALLER_FILE_PATH } from '../trpc.constants'
import { saveOrOverrideFile } from '../utils/ts-morph.util'
import { ContextGenerator } from './context.generator'
import { TYPESCRIPT_PROJECT } from './generator.constants'
import { MiddlewareGenerator } from './middleware.generator'
import { RouterGenerator } from './router.generator'
import { StaticGenerator } from './static.generator'

@Injectable()
export class TRPCGenerator {
    private rootModuleImportsMap!: Map<string, SourceFileImportsMap>
    private readonly HELPER_TYPES_OUTPUT_FILE = 'index.ts'
    private readonly HELPER_TYPES_OUTPUT_PATH = path.join(__dirname, 'types')

    @Inject(TRPC_MODULE_CALLER_FILE_PATH)
    private readonly moduleCallerFilePath!: string

    @Inject(TYPESCRIPT_PROJECT)
    private readonly project!: Project

    private readonly logger = new Logger(TRPCGenerator.name)

    @Inject(StaticGenerator)
    private readonly staticGenerator!: StaticGenerator

    @Inject(MiddlewareGenerator)
    private readonly middlewareHandler!: MiddlewareGenerator

    @Inject(ContextGenerator)
    private readonly contextHandler!: ContextGenerator

    @Inject(RouterGenerator)
    private readonly serializerHandler!: RouterGenerator

    @Inject(RouterFactory)
    private readonly routerFactory!: RouterFactory

    @Inject(ProcedureFactory)
    private readonly procedureFactory!: ProcedureFactory

    @Inject(MiddlewareFactory)
    private readonly middlewareFactory!: MiddlewareFactory

    @Inject(ImportsScanner)
    private readonly importsScanner!: ImportsScanner

    public async generateSchemaFile(
        appRouterSourceFile,
        schemaImports?: Array<SchemaImports> | undefined,
    ): Promise<void> {
        try {
            this.rootModuleImportsMap = this.buildRootImportsMap()

            const routers = this.routerFactory.getRouters()
            const mappedRoutesAndProcedures = routers.map((route) => {
                const { instance, name, alias, path } = route
                const prototype = Object.getPrototypeOf(instance)
                const procedures = this.procedureFactory.getProcedures(
                    instance,
                    prototype,
                )

                return { name, path, alias, instance: { ...route }, procedures }
            })

            this.staticGenerator.generateStaticDeclaration(appRouterSourceFile)

            if (schemaImports != null && schemaImports.length > 0) {
                const schemaImportNames: Array<string> = schemaImports.map(
                    (schemaImport) => (schemaImport as any).name,
                )
                this.staticGenerator.addSchemaImports(
                    appRouterSourceFile,
                    schemaImportNames,
                    this.rootModuleImportsMap,
                )
            }

            const routersMetadata = this.serializerHandler.serializeRouters(
                appRouterSourceFile,
                mappedRoutesAndProcedures,
                this.project,
            )

            const routersStringDeclarations =
                this.serializerHandler.generateRoutersStringFromMetadata(
                    routersMetadata,
                )

            appRouterSourceFile.addStatements(/* ts */ `
              const appRouter = t.router({${routersStringDeclarations}});
              export type AppRouter = typeof appRouter;
            `)

            await saveOrOverrideFile(appRouterSourceFile)

            this.logger.log(
                `AppRouter has been updated successfully at "./${path.relative(process.cwd(), appRouterSourceFile.getFilePath())}".`,
            )
        } catch (error: unknown) {
            this.logger.warn('TRPC Generator encountered an error.', error)
        }
    }

    public async generateHelpersFile(
        context?: Class<TRPCContext>,
    ): Promise<void> {
        try {
            const middlewares = this.middlewareFactory.getMiddlewares()
            const helperTypesSourceFile = this.project.createSourceFile(
                path.resolve(
                    this.HELPER_TYPES_OUTPUT_PATH,
                    this.HELPER_TYPES_OUTPUT_FILE,
                ),
                undefined,
                { overwrite: true },
            )

            if (context != null) {
                const contextImport = this.rootModuleImportsMap.get(
                    context.name,
                )

                if (contextImport == null) {
                    throw new Error(
                        'Could not find context import declaration.',
                    )
                }

                const contextType =
                    await this.contextHandler.getContextInterface(
                        contextImport.sourceFile,
                        context,
                    )

                helperTypesSourceFile.addTypeAlias({
                    isExported: true,
                    name: 'Context',
                    type: contextType ?? '{}',
                })
            }

            for (const middleware of middlewares) {
                const middlewareInterface =
                    await this.middlewareHandler.getMiddlewareInterface(
                        middleware.path,
                        middleware.instance,
                        this.project,
                    )

                if (middlewareInterface != null) {
                    helperTypesSourceFile.addInterface({
                        isExported: true,
                        name: `${middlewareInterface.name}Context`,
                        extends: ['Context'],
                        properties: middlewareInterface.properties,
                    })
                }
            }

            await saveOrOverrideFile(helperTypesSourceFile)
        } catch (e: unknown) {
            this.logger.warn('TRPC Generator encountered an error.', e)
        }
    }

    private buildRootImportsMap(): Map<string, SourceFileImportsMap> {
        const rootModuleSourceFile = this.project.addSourceFileAtPathIfExists(
            this.moduleCallerFilePath,
        )

        if (rootModuleSourceFile == null) {
            throw new Error('Could not access root module file.')
        }

        return this.importsScanner.buildSourceFileImportsMap(
            rootModuleSourceFile,
            this.project,
        )
    }
}
