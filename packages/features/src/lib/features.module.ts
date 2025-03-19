import {
    DynamicModule,
    Inject,
    Module,
    OnApplicationBootstrap,
} from '@nestjs/common'

import {
    FEATURE_CONFIG,
    FEATURE_OPTIONS_TYPE,
    FeatureConfig,
    patchFeatureConfig,
} from './configs/feature-module.config'
import { IFeatureBus } from './interfaces/features.interfaces'
import { ExplorerService } from './services/explorer.service'
import { FeatureBus } from './services/feature-bus.service'

@Module({})
export class FeatureModule implements OnApplicationBootstrap {
    static forRoot(options: typeof FEATURE_OPTIONS_TYPE): DynamicModule {
        const config = patchFeatureConfig(options)

        return {
            global: true,
            module: FeatureModule,
            providers: [
                {
                    provide: FEATURE_CONFIG,
                    useValue: config,
                },
                FeatureBus
            ],
        }
    }

    constructor(
        @Inject(FEATURE_CONFIG)
        private readonly config: FeatureConfig,
        private readonly explorerService: ExplorerService,
        private readonly bus: FeatureBus,
    ) {}

    onApplicationBootstrap() {
        if (this.config.explore) {
            const features = this.explorerService.explore()

            this.bus.register(features)
        }
    }
}
