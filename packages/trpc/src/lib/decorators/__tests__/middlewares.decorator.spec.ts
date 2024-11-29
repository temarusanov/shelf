import 'reflect-metadata'

import {
    MiddlewareOptions,
    MiddlewareResponse,
    TRPCMiddleware,
} from '../../interfaces'
import { MIDDLEWARES_KEY } from '../../trpc.constants'
import { UseMiddlewares } from '../middlewares.decorator'

describe('UseMiddlewares Decorator', () => {
    const mockMiddleware = () => ({})

    it('should add metadata to the class', () => {
        @UseMiddlewares(mockMiddleware)
        class TestClass {}

        const metadata = Reflect.getMetadata(MIDDLEWARES_KEY, TestClass)
        expect(metadata).toBe(mockMiddleware)
    })

    it('should add metadata to the method', () => {
        class TestClass {
            @UseMiddlewares(mockMiddleware)
            testMethod() {}
        }

        const metadata = Reflect.getMetadata(
            MIDDLEWARES_KEY,
            TestClass.prototype.testMethod,
        )
        expect(metadata).toBe(mockMiddleware)
    })

    it('should throw an error for invalid middleware on class', () => {
        expect(() => {
            @UseMiddlewares({} as any)
            class TestClass {}
        }).toThrow()
    })

    it('should throw an error for invalid middleware on method', () => {
        expect(() => {
            class TestClass {
                @UseMiddlewares({} as any)
                testMethod() {}
            }
        }).toThrow()
    })

    it('should accept middleware with use method', () => {
        class MiddlewareWithUse implements TRPCMiddleware {
            use(
                opts: MiddlewareOptions<object>,
            ): MiddlewareResponse | Promise<MiddlewareResponse> {
                throw new Error('Method not implemented.')
            }
        }

        @UseMiddlewares(MiddlewareWithUse)
        class TestClass {}

        const metadata = Reflect.getMetadata(MIDDLEWARES_KEY, TestClass)
        expect(metadata).toBe(MiddlewareWithUse)
    })
})
