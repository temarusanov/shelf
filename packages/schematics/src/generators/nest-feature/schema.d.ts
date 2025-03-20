export interface NestCqrsGeneratorSchema {
    type: 'command' | 'query'
    name: string
    path: string
    graphql?: boolean
    rest?: boolean
    test?: boolean
    zod?: boolean
}
