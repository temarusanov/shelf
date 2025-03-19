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
import { FeaturesBus } from './services/bus.service'
import { FeaturesExplorerService } from './services/explorer.service'

@Module({})
export class FeaturesModule implements OnApplicationBootstrap {
    static forRoot(options: typeof FEATURE_OPTIONS_TYPE): DynamicModule {
        const config = patchFeatureConfig(options)

        const providers = [
            {
                provide: FEATURE_CONFIG,
                useValue: config,
            },
            FeaturesBus,
            FeaturesExplorerService,
        ]

        return {
            global: true,
            module: FeaturesModule,
            providers,
            exports: providers,
        }
    }

    constructor(
        @Inject(FEATURE_CONFIG)
        private readonly config: FeatureConfig,
        private readonly explorerService: FeaturesExplorerService,
        private readonly bus: FeaturesBus,
    ) {}

    onApplicationBootstrap() {
        if (this.config.explore) {
            const features = this.explorerService.explore()

            this.bus.register(features)
        }
    }
}
