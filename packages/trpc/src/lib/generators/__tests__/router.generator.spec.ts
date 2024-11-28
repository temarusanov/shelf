import { Test, TestingModule } from '@nestjs/testing'
import { Project, SourceFile } from 'ts-morph'
import { z } from 'zod'

import { Mutation, Query } from '../../decorators'
import { RoutersFactoryMetadata } from '../../interfaces/factory.interface'
import {
    DecoratorGeneratorMetadata,
    RouterGeneratorMetadata,
} from '../../interfaces/generator.interface'
import { DecoratorGenerator } from '../decorator.generator'
import { RouterGenerator } from '../router.generator'

jest.mock('func-loc', () => ({
    locate: jest.fn().mockResolvedValue({ path: 'test.ts' }),
}))

describe('RouterGenerator', () => {
    let routerGenerator: RouterGenerator
    let decoratorGenerator: jest.Mocked<DecoratorGenerator>
    let project: Project
    let sourceFile: SourceFile

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                RouterGenerator,
                {
                    provide: DecoratorGenerator,
                    useValue: {
                        serializeProcedureDecorators: jest.fn(),
                    },
                },
            ],
        }).compile()

        routerGenerator = module.get<RouterGenerator>(RouterGenerator)
        decoratorGenerator = module.get(DecoratorGenerator)
        project = new Project()

        sourceFile = project.createSourceFile(
            'test.ts',
            `
      import { Query, Mutation } from '../../decorators';
      import { z } from 'zod';

      export class TestRouter {
        @Query()
        testQuery() {
          return 'test query';
        }

        @Mutation()
        testMutation() {
          return 'test mutation';
        }
      }
      `,
            { overwrite: true },
        )
    })

    it('should be defined', () => {
        expect(routerGenerator).toBeDefined()
    })

    describe('serializeRouters', () => {
        it('should serialize routers', async () => {
            class TestRouter {
                @Query()
                testQuery() {
                    return 'test query'
                }

                @Mutation()
                testMutation() {
                    return 'test mutation'
                }
            }

            const mockRouter: RoutersFactoryMetadata = {
                name: 'TestRouter',
                alias: 'test',
                instance: {
                    name: 'TestRouter',
                    instance: jest.fn(),
                    alias: 'test',
                },
                procedures: [
                    {
                        name: 'testQuery',
                        implementation: TestRouter.prototype.testQuery,
                        type: 'query',
                        input: z.string(),
                        output: z.string(),
                        params: [],
                    },
                    {
                        name: 'testMutation',
                        implementation: TestRouter.prototype.testMutation,
                        type: 'mutation',
                        input: z.string(),
                        output: z.string(),
                        params: [],
                    },
                ],
            }

            const mockTestQueryDecoratorMetadata: DecoratorGeneratorMetadata[] =
                [{ name: 'Query', arguments: {} }]
            const mockTestMutationDecoratorMetadata: DecoratorGeneratorMetadata[] =
                [{ name: 'Mutation', arguments: {} }]

            decoratorGenerator.serializeProcedureDecorators
                .mockReturnValueOnce(mockTestQueryDecoratorMetadata)
                .mockReturnValue(mockTestMutationDecoratorMetadata)

            jest.spyOn(project, 'addSourceFileAtPath').mockReturnValue(
                sourceFile,
            )

            const result = await routerGenerator.serializeRouters(
                [mockRouter],
                project,
            )

            expect(result).toEqual<Array<RouterGeneratorMetadata>>([
                {
                    name: 'TestRouter',
                    alias: 'test',
                    procedures: [
                        {
                            name: 'testQuery',
                            decorators: [{ name: 'Query', arguments: {} }],
                        },
                        {
                            name: 'testMutation',
                            decorators: [{ name: 'Mutation', arguments: {} }],
                        },
                    ],
                },
            ])
        })
    })

    describe('generateRoutersStringFromMetadata', () => {
        it('should generate router string from metadata', () => {
            const mockRouterMetadata: Array<RouterGeneratorMetadata> = [
                {
                    name: 'TestRouter',
                    alias: 'test',
                    procedures: [
                        {
                            name: 'testQuery',
                            decorators: [{ name: 'Query', arguments: {} }],
                        },
                        {
                            name: 'testMutation',
                            decorators: [{ name: 'Mutation', arguments: {} }],
                        },
                    ],
                },
            ]

            const result =
                routerGenerator.generateRoutersStringFromMetadata(
                    mockRouterMetadata,
                )

            expect(result).toBe(
                'test: t.router({ ' +
                    'testQuery: publicProcedure.query(async () => "PLACEHOLDER_DO_NOT_REMOVE" as any ),\n' +
                    'testMutation: publicProcedure.mutation(async () => "PLACEHOLDER_DO_NOT_REMOVE" as any ) ' +
                    '})',
            )
        })
    })
})
