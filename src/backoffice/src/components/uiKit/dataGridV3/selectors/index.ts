export const pageSizeOptions = [
    { label: '10', value: 10 },
    { label: '20', value: 20 },
    { label: '50', value: 50 },
    { label: '100', value: 100 },
]

export const pageSelectorOptions = (totalPages: number) => {
    const options = []
    for (let i = 0; i <= (totalPages - 1); i += 1) {
        options.push({ label: (i + 1).toString(), value: i })
    }
    return options
}
