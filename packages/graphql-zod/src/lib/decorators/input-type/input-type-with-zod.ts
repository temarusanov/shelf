import { InputType, InputTypeOptions } from '@nestjs/graphql'
import type { ZodTypeAny } from 'zod'

import { extractNameAndDescription, parseShape } from '../../helpers'
import { ZodObjectKey } from '../../helpers/constants'
import type { Options } from './options.inteface'

/**
 * Decorator that marks a class as a GraphQL input type.
 *
 * Uses a `zod` object.
 *
 * @export
 * @template T The type of the zod object input.
 * @param {T} input The zod input object.
 * @return {ClassDecorator} A {@link ClassDecorator}.
 */
export function InputTypeWithZod<T extends ZodTypeAny>(input: T): ClassDecorator

/**
 * Decorator that marks a class as a GraphQL input type.
 *
 * Uses a `zod` object.
 *
 * @export
 * @template T The type of the zod object input.
 * @param {T} input The zod input object.
 * @param {Options<T>} options The options for the decorator.
 * @return {ClassDecorator} A {@link ClassDecorator}.
 */
export function InputTypeWithZod<T extends ZodTypeAny>(
    input: T,
    options: Options<T>,
): ClassDecorator

/**
 * Decorator that marks a class as a GraphQL input type.
 *
 * Uses a `zod` object.
 *
 * @export
 * @template T The type of the zod object input.
 * @param {T} input The zod input object.
 * @param {string} name The name of the {@link InputType}.
 * @param {Options<T>} [options] The options for the decorator.
 * @return {ClassDecorator} A {@link ClassDecorator}.
 */
export function InputTypeWithZod<T extends ZodTypeAny>(
    input: T,
    name: string,
    options?: Options<T>,
): ClassDecorator

export function InputTypeWithZod<T extends ZodTypeAny>(
    input: T,
    nameOrOptions?: string | Options<T>,
    options?: Options<T>,
): ClassDecorator {
    //#region Parameter Normalization - `name`, `zodOptions`, `inputTypeOptions`
    if (typeof nameOrOptions === 'object') {
        options = nameOrOptions
        nameOrOptions = undefined
    }

    if (!nameOrOptions) {
        nameOrOptions = options?.name
    }

    const name = nameOrOptions
    let zodOptions = options?.zod

    let inputTypeOptions: InputTypeOptions | undefined
    if (typeof options === 'object') {
        const { name: _, zod: __, ...rest } = options
        inputTypeOptions = rest
    }
    //#endregion

    const decorate = buildInputTypeDecorator(name, inputTypeOptions)

    return function ZodClassDecoratorBase(target: Function) {
        zodOptions ??= {}

        const { prototype } = target
        const { description, name = target.name } = extractNameAndDescription(
            input,
            zodOptions,
        )
        const { keepZodObject = false } = zodOptions

        const returnValue = decorate(target)

        if (keepZodObject) {
            Object.defineProperty(prototype, ZodObjectKey, {
                value: { ...input },
                configurable: false,
                writable: false,
            })
        }

        const parsed = parseShape(input, {
            ...zodOptions,
            name,
            description,
            getDecorator(_, key) {
                // Returning another `@InputType()` as we have another key now, that
                // will be another sub class built, therefore we need to decorate that
                // with another `@InputType()`.
                return buildInputTypeDecorator(key, inputTypeOptions)
            },
            getScalarTypeFor: zodOptions.getScalarTypeFor,
        })

        for (const { descriptor, key, decorateFieldProperty } of parsed) {
            Object.defineProperty(prototype, key as string, descriptor)
            decorateFieldProperty(prototype, key as string)
        }

        return returnValue as void
    }
}

/**
 * Builds an input type decorator for given name and options.
 *
 * @param {string} [name] The name of the property.
 * @param {InputTypeOptions} [opts] The options for the decorator.
 * @return {ClassDecorator} A decorator for the dynamic input type class.
 */
export function buildInputTypeDecorator(
    name?: string,
    opts?: InputTypeOptions,
): ClassDecorator {
    if (typeof opts === 'object') {
        if (typeof name === 'string') {
            return InputType(name, opts)
        }

        return InputType(opts)
    }

    if (typeof name === 'string') {
        return InputType(name)
    }

    return InputType()
}
