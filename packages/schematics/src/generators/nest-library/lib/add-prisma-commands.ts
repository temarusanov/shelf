/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { names, Tree } from '@nx/devkit'
import {
    readProjectConfiguration,
    updateProjectConfiguration,
} from '@nx/devkit'

import type { NormalizedOptions } from '../schema'

export function addPrismaCommands(
    tree: Tree,
    options: NormalizedOptions,
): void {
    if (!options.prisma) {
        return
    }

    const projectNames = names(options.projectName)

    const project = readProjectConfiguration(tree, options.projectName)

    project.targets!['prisma:generate'] = {
        executor: '@tinybudgie/schematics:prisma-generate',
        outputs: [
            `{workspaceRoot}/node_modules/@prisma/${projectNames.fileName}-client`,
        ],
    }

    project.targets!['prisma:pull'] = {
        executor: '@tinybudgie/schematics:prisma-pull',
    }

    project.targets!['prisma:migrate:dev'] = {
        executor: '@tinybudgie/schematics:prisma-migrate-dev',
    }

    project.targets!['prisma:migrate:deploy'] = {
        executor: '@tinybudgie/schematics:prisma-migrate-deploy',
    }

    project.targets!['prisma:studio'] = {
        executor: '@tinybudgie/schematics:prisma-studio',
    }

    updateProjectConfiguration(tree, options.projectName, project)
}
