import {
    formatFiles,
    generateFiles,
    names,
    Tree,
} from '@nx/devkit'
import * as pathdir from 'path'

import { NestCqrsGeneratorSchema } from './schema'

export async function nestCqrsGenerator(
    tree: Tree,
    options: NestCqrsGeneratorSchema,
) {
    const { name, path, type, graphql, rest, test } = options

    const nameCases = names(name)
    const typeCases = names(type)

    const generatorOptions = {
        name: nameCases,
        fileName: nameCases.fileName,
        fileType: typeCases.fileName,
        type: typeCases,
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
        console.log('rest not implemented yet')
    }

    if (test) {
        console.log('test not implemented yet')
    }

    await formatFiles(tree)
}

export default nestCqrsGenerator
