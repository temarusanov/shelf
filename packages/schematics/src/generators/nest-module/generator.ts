import { formatFiles, generateFiles, names, Tree } from '@nx/devkit'
import * as pathdir from 'path'

import { NestCqrsGeneratorSchema } from './schema'

export async function nestModuleGenerator(
    tree: Tree,
    options: NestCqrsGeneratorSchema,
) {
    const { name, path, events, repository } = options

    const nameCases = names(name)

    const generatorOptions = {
        name: nameCases,
        fileName: nameCases.fileName,
        events,
        repository,
        tmpl: '',
    }

    generateFiles(
        tree,
        pathdir.join(__dirname, 'files', 'common'),
        path,
        generatorOptions,
    )

    if (events) {
        generateFiles(
            tree,
            pathdir.join(__dirname, 'files', 'events'),
            path,
            generatorOptions,
        )
    }

    if (repository) {
        generateFiles(
            tree,
            pathdir.join(__dirname, 'files', 'repository'),
            path,
            generatorOptions,
        )
    }

    await formatFiles(tree)
}

export default nestModuleGenerator
