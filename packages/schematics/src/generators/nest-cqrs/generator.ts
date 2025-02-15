import { formatFiles, generateFiles, names, Tree } from '@nx/devkit'
import * as pathdir from 'path'

import { NestCqrsGeneratorSchema } from './schema'

export async function nestCqrsGenerator(
    tree: Tree,
    options: NestCqrsGeneratorSchema,
) {
    const { name, path, type, graphql, rest, test, zod } = options

    const nameCases = names(name)
    const typeCases = names(type)

    const generatorOptions = {
        name: nameCases,
        fileName: nameCases.fileName,
        fileType: typeCases.fileName,
        type: typeCases,
        zod,
        tmpl: '',
    }

    generateFiles(
        tree,
        pathdir.join(__dirname, 'files', 'common'),
        path,
        generatorOptions,
    )

    if (graphql) {
        generateFiles(
            tree,
            pathdir.join(__dirname, 'files', 'graphql'),
            path,
            generatorOptions,
        )
    }

    if (rest) {
        generateFiles(
            tree,
            pathdir.join(__dirname, 'files', 'rest'),
            path,
            generatorOptions,
        )
    }

    if (test) {
        generateFiles(
            tree,
            pathdir.join(__dirname, 'files', 'jest'),
            path,
            generatorOptions,
        )
    }

    await formatFiles(tree)
}

export default nestCqrsGenerator
