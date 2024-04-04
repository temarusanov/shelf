import { DynamicModule, Module, Provider, Type } from '@nestjs/common'
import { CATS_PUBLISHER, CatsEventPublisherProvider } from "./events.config";
import { CatsService } from './cats.service';

@Module({})
export class CatsModule {
    static forRoot(options: {
        eventsProvider: CatsEventPublisherProvider
    }): DynamicModule {
        const imports: any[] = []
        const controllers: Type<any>[] = []
        const providers: Provider[] = [
            {
                provide: CATS_PUBLISHER,
                ...options.eventsProvider,
            },
            CatsService
        ]

        return {
            module: CatsModule,
            imports,
            controllers,
            providers,
            exports: providers,
        }
    }
}