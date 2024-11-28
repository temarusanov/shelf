import { Inject, Injectable, Logger } from '@nestjs/common'
import {
    Decorator,
    Expression,
    Project,
    SourceFile,
    SyntaxKind,
} from 'ts-morph'

import { DecoratorGeneratorMetadata } from '../interfaces/generator.interface'
import { ProcedureGenerator } from './procedure.generator'

@Injectable()
export class DecoratorGenerator {
    private readonly logger = new Logger(DecoratorGenerator.name)

    @Inject(ProcedureGenerator)
    private readonly procedureGenerator!: ProcedureGenerator

    public serializeProcedureDecorators(
        appRouterSourceFile: SourceFile,
        decorators: Decorator[],
        sourceFile: SourceFile,
        project: Project,
    ): Array<DecoratorGeneratorMetadata> {
        return decorators.reduce<DecoratorGeneratorMetadata[]>(
            (array, decorator) => {
                const decoratorName = decorator.getName()

                if (decoratorName === 'Query' || decoratorName === 'Mutation') {
                    const input = this.getDecoratorPropertyValue(
                        appRouterSourceFile,
                        decorator,
                        'input',
                        sourceFile,
                        project,
                    )
                    const output = this.getDecoratorPropertyValue(
                        appRouterSourceFile,
                        decorator,
                        'output',
                        sourceFile,
                        project,
                    )

                    array.push({
                        name: decoratorName,
                        arguments: {
                            ...(input ? { input } : {}),
                            ...(output ? { output } : {}),
                        },
                    })
                } else if (
                    decoratorName === 'UseMiddlewares' ||
                    decoratorName === 'Middlewares'
                ) {
                    return array
                } else {
                    this.logger.warn(
                        `Decorator ${decoratorName}, not supported.`,
                    )
                }

                return array
            },
            [],
        )
    }

    public getDecoratorPropertyValue(
        appRouterSourceFile: SourceFile,
        decorator: Decorator,
        propertyName: string,
        sourceFile: SourceFile,
        project: Project,
    ): string | null {
        const args = decorator.getArguments()

        for (const arg of args) {
            if (arg.getKind() === SyntaxKind.ObjectLiteralExpression) {
                const properties = (arg as any).getProperties()
                const property = properties.find(
                    (p: any) => p.getName() === propertyName,
                )

                if (!property) {
                    return null
                }

                const propertyInitializer: Expression =
                    property.getInitializer()
                return this.procedureGenerator.flattenZodSchema(
                    appRouterSourceFile,
                    propertyInitializer,
                    sourceFile,
                    project,
                    propertyInitializer.getText(),
                )
            }
        }

        return null
    }
}
