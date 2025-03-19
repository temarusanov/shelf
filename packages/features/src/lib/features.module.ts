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
import { FeatureBus } from './services/bus.service'
import { FeatureExplorerService } from './services/explorer.service'

@Module({})
export class FeatureModule implements OnApplicationBootstrap {
    static forRoot(options: typeof FEATURE_OPTIONS_TYPE): DynamicModule {
        const config = patchFeatureConfig(options)

        const providers = [
            {
                provide: FEATURE_CONFIG,
                useValue: config,
            },
            FeatureBus,
            FeatureExplorerService,
        ]

        return {
            global: true,
            module: FeatureModule,
            providers,
            exports: providers,
        }
    }

    constructor(
        @Inject(FEATURE_CONFIG)
        private readonly config: FeatureConfig,
        private readonly explorerService: FeatureExplorerService,
        private readonly bus: FeatureBus,
    ) {}

    onApplicationBootstrap() {
        if (this.config.explore) {
            const features = this.explorerService.explore()

            this.bus.register(features)
        }
    }
}
