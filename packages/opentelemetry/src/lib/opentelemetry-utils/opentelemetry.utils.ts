import 'reflect-metadata';

export function injectIntoArray(
    arr: any[],
    newElements: {
        newElement: any
        newElementIndex?: number
    }[],
) {
    const result = [...arr]

    for (const { newElement, newElementIndex } of newElements) {
        if (typeof newElementIndex === 'number') {
            result.splice(newElementIndex, 0, newElement)
        }
    }

    return result
}

export const copyMetadata = (from: object, to: object): void => {
    Reflect.getMetadataKeys(from).forEach((key) => {
        Reflect.defineMetadata(key, Reflect.getMetadata(key, from), to)
    })
}
