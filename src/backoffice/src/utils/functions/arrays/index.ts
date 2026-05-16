export function splitArrayIntoGroups(arr: Array<any>, groupSize: number) {
    const result: Array<any> = []
    for (let i = 0; i < arr.length; i += groupSize) {
        result.push(arr.slice(i, i + groupSize))
    }
    return result
}
interface OrderedListI {
    data: Array<any>,
    key: string,
    order: 'asc' | 'desc',
}
export function orderList({ data, key, order = 'asc' }: OrderedListI) {
    if (!Array.isArray(data) || typeof key !== 'string') {
        throw new Error('Invalid input parameters')
    }

    return data.sort((a, b) => {
        if (a[key] < b[key]) return order === 'asc' ? -1 : 1
        if (a[key] > b[key]) return order === 'asc' ? 1 : -1
        return 0
    })
}
