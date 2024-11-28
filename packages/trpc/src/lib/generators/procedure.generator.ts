import { Inject, Injectable } from '@nestjs/common'
import { Node, Project, SourceFile } from 'ts-morph'

import { ProcedureGeneratorMetadata } from '../interfaces/generator.interface'
import { ImportsScanner } from '../scanners/imports.scanner'
import { ProcedureType } from '../trpc.enum'
import { StaticGenerator } from './static.generator'

@Injectable()
export class ProcedureGenerator {
    @Inject(ImportsScanner)
    private readonly importsScanner!: ImportsScanner

    @Inject(StaticGenerator)
    private readonly staticGenerator!: StaticGenerator

    public generateProcedureString(
        procedure: ProcedureGeneratorMetadata,
    ): string {
        const { name, decorators } = procedure
        const decorator = decorators.find(
            (decorator) =>
                decorator.name === ProcedureType.Mutation ||
                decorator.name === ProcedureType.Query,
        )

        if (!decorator) {
            return ''
        }

        const decoratorArgumentsArray = Object.entries(decorator.arguments)
            .map(([key, value]) => `.${key}(${value})`)
            .join('')

        return `${name}: publicProcedure${decoratorArgumentsArray}.${decorator.name.toLowerCase()}(async () => "PLACEHOLDER_DO_NOT_REMOVE" as any )`
    }

    public flattenZodSchema(
        appRouterSourceFile: SourceFile,
        node: Node,
        sourceFile: SourceFile,
        project: Project,
        schema: string,
    ): string {
        const importsMap = this.importsScanner.buildSourceFileImportsMap(
            sourceFile,
            project,
        )
        if (Node.isIdentifier(node)) {
            const identifierName = node.getText()
            const identifierDeclaration =
                sourceFile.getVariableDeclaration(identifierName)

            if (identifierDeclaration != null) {
                const identifierInitializer =
                    identifierDeclaration.getInitializer()

                if (identifierInitializer != null) {
                    const identifierSchema = this.flattenZodSchema(
                        appRouterSourceFile,
                        identifierInitializer,
                        sourceFile,
                        project,
                        identifierInitializer.getText(),
                    )

                    schema = schema.replace(identifierName, identifierSchema)
                }
            } else if (importsMap.has(identifierName)) {
                const importedIdentifier = importsMap.get(identifierName)

                if (importedIdentifier != null) {
                    const { initializer } = importedIdentifier
                    const identifierSchema = this.flattenZodSchema(
                        appRouterSourceFile,
                        initializer,
                        importedIdentifier.sourceFile,
                        project,
                        initializer.getText(),
                    )

                    schema = schema.replace(identifierName, identifierSchema)
                }
            }
        } else if (Node.isObjectLiteralExpression(node)) {
            for (const property of node.getProperties()) {
                if (Node.isPropertyAssignment(property)) {
                    const propertyText = property.getText()
                    const propertyInitializer = property.getInitializer()

                    if (propertyInitializer != null) {
                        schema = schema.replace(
                            propertyText,
                            this.flattenZodSchema(
                                appRouterSourceFile,
                                propertyInitializer,
                                sourceFile,
                                project,
                                propertyText,
                            ),
                        )
                    }
                }
            }
        } else if (Node.isArrayLiteralExpression(node)) {
            for (const element of node.getElements()) {
                const elementText = element.getText()
                schema = schema.replace(
                    elementText,
                    this.flattenZodSchema(
                        appRouterSourceFile,
                        element,
                        sourceFile,
                        project,
                        elementText,
                    ),
                )
            }
        } else if (Node.isCallExpression(node)) {
            const expression = node.getExpression()
            if (
                Node.isPropertyAccessExpression(expression) &&
                !expression.getText().startsWith('z')
            ) {
                const baseSchema = this.flattenZodSchema(
                    appRouterSourceFile,
                    expression,
                    sourceFile,
                    project,
                    expression.getText(),
                )
                const propertyName = expression.getName()
                schema = schema.replace(
                    expression.getText(),
                    `${baseSchema}.${propertyName}`,
                )
            } else if (!expression.getText().startsWith('z')) {
                this.staticGenerator.addSchemaImports(
                    appRouterSourceFile,
                    [expression.getText()],
                    importsMap,
                )
            }

            for (const arg of node.getArguments()) {
                const argText = arg.getText()
                schema = schema.replace(
                    argText,
                    this.flattenZodSchema(
                        appRouterSourceFile,
                        arg,
                        sourceFile,
                        project,
                        argText,
                    ),
                )
            }
        } else if (Node.isPropertyAccessExpression(node)) {
            schema = this.flattenZodSchema(
                appRouterSourceFile,
                node.getExpression(),
                sourceFile,
                project,
                node.getExpression().getText(),
            )
        }

        return schema
    }
}
