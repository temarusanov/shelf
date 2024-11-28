import { Inject, Logger, Module } from '@nestjs/common'
import { DynamicModule, OnModuleInit } from '@nestjs/common/interfaces'
import { HttpAdapterHost } from '@nestjs/core'

import { AppRouterHost } from './app-router.host'
import { ExpressDriver, FastifyDriver } from './drivers'
import { FactoryModule } from './factories/factory.module'
import { GeneratorModule } from './generators/generator.module'
import { TRPCModuleOptions } from './interfaces'
import { FileScanner } from './scanners/file.scanner'
import { ScannerModule } from './scanners/scanner.module'
import { TRPC_MODULE_OPTIONS } from './trpc.constants'
import { TRPCDriver } from './trpc.driver'

@Module({
    imports: [FactoryModule, ScannerModule],
    providers: [
        // Drivers
        TRPCDriver,
        FastifyDriver,
        ExpressDriver,

        // Exports
        AppRouterHost,
    ],
    exports: [AppRouterHost],
})
export class TRPCModule implements OnModuleInit {
    @Inject(TRPC_MODULE_OPTIONS)
    private readonly options!: TRPCModuleOptions

    private readonly logger = new Logger(TRPCModule.name)

    @Inject(HttpAdapterHost)
    private readonly httpAdapterHost!: HttpAdapterHost

    @Inject(TRPCDriver)
    private readonly trpcDriver!: TRPCDriver

    @Inject(AppRouterHost)
    private readonly appRouterHost!: AppRouterHost

    static forRoot(options: TRPCModuleOptions = {}): DynamicModule {
        const imports: Array<DynamicModule> = []

        const fileScanner = new FileScanner()
        const callerFilePath = fileScanner.getCallerFilePath()
        imports.push(
            GeneratorModule.forRoot({
                rootModuleFilePath: callerFilePath,
                schemaFileImports: options.schemaFileImports,
                context: options.context,
            }),
        )

        return {
            module: TRPCModule,
            imports,
            providers: [{ provide: TRPC_MODULE_OPTIONS, useValue: options }],
        }
    }

    async onModuleInit() {
        const httpAdapter = this.httpAdapterHost?.httpAdapter
        if (!httpAdapter) {
            return
        }

        await this.trpcDriver.start(this.options)

        const platformName = httpAdapter.getType()
        if (this.appRouterHost.appRouter != null) {
            this.logger.log(
                `Server has been initialized successfully using the ${platformName} driver.`,
            )
        }
    }
}
