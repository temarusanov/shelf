import { registerEnumType } from '@nestjs/graphql'
import { infer as Infer, ZodEnum, ZodNativeEnum, ZodTypeAny } from 'zod'

import { getDefaultEnumProvider } from '../decorators/common'
import type { IModelFromZodOptions } from '../model-from-zod'
import { getRegisterCount } from './constants'
import type { ZodTypeInfo } from './get-field-info-from-zod'
import { isZodInstance } from './is-zod-instance'
import { toTitleCase } from './to-title-case'
import { withSuffix } from './with-suffix'
/**
 * Builds an enum type for GraphQL schema.
 *
 * @export
 * @template T The type of the zod object.
 * @param {keyof zod.infer<T>} key The key of the zod object.
 * @param {ZodTypeInfo} typeInfo The parsed zod type info.
 * @param {IModelFromZodOptions<zod.infer<T>>} options The options for building
 * enum type.
 *
 * @return {object} The enum object.
 */
export function buildEnumType<T extends ZodTypeAny>(
    key: keyof Infer<T>,
    typeInfo: ZodTypeInfo,
    options: IModelFromZodOptions<T>,
): object {
    const { type } = typeInfo

    const isNative = isZodInstance(ZodNativeEnum, type)

    if (isZodInstance(ZodEnum, type) || isNative) {
        const Enum = isNative ? type.enum : type.Enum

        let enumProvider = options.getEnumType ?? getDefaultEnumProvider()

        if (typeof enumProvider === 'function') {
            const replacement = enumProvider(Enum, {
                isNative,
                name: String(key),
                parentName: options.name,
                description: type.description,
            })

            if (typeof replacement === 'object' && Enum !== replacement) {
                return (typeInfo.type = replacement)
            }
        }

        const incompatibleKey = getFirstIncompatibleEnumKey(Enum)
        if (incompatibleKey) {
            throw new Error(
                `The value of the Key("${incompatibleKey}") of ${options.name}.${String(key)} Enum was not valid`,
            )
        }

        const parentName = options.name
        const enumName = withSuffix('Enum')(toTitleCase(key as string))
        const registerCount = getRegisterCount()

        registerEnumType(Enum, {
            name: toTitleCase(`${parentName}_${enumName}_${registerCount}`),
            description:
                type.description ??
                `Enum values for ${options.name}.${String(key)}`,
        })

        return (typeInfo.type = Enum)
    } else if (Array.isArray(type)) {
        const dynamicEnumClass = buildEnumType(
            key,
            {
                type: type[0],
                isNullable: !!typeInfo.isItemNullable,
                isOptional: !!typeInfo.isItemOptional,
            },
            options,
        )

        return (typeInfo.type = [dynamicEnumClass])
    } else {
        throw new Error(`Unexpected enum type for Key("${String(key)}")`)
    }
}

function getFirstIncompatibleEnumKey(input: Record<string, string | number>) {
    const digitTest = /^\s*?\d/

    for (const key in input) {
        const value = input[key]
        if (typeof value !== 'string') return key
        if (digitTest.test(value)) return key
    }

    return
}
