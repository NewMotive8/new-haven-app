export function parseExactMatchOptions(sentences: string) {
    const options = sentences.split(',').map((item: string) => ({ value: item, label: item }))
    return [{ value: '', label: 'No Filter' }, ...options]
}
export function getObjectData<T>(object: T, propertyString: string): any {
    const properties = propertyString.split('.')

    const result = properties.reduce((currentLevel: any, property) => {
        return currentLevel && currentLevel[property] !== undefined
            ? currentLevel[property]
            : undefined
    }, object)

    return result || ''
}
