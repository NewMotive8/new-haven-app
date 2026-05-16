import { pageableProps } from 'utils/services/api/types'

export function parseParamsToAddFilterById(id: number, params?: pageableProps): pageableProps {
    const filterExp = params?.filterExp
        ? `${params.filterExp}[and]id$eq=${id}`
        : `id$eq=${id}`

    return {
        ...params,
        filterExp,
    }
}

export function parseParamsToAddFilterByApproved(approved: boolean | string, params?: pageableProps): pageableProps {
    const filterExp = params?.filterExp
        ? `${params.filterExp}[and]approved$eq=${approved}`
        : `approved$eq=${approved}`

    return {
        ...params,
        filterExp,
    }
}

export type jackpotStatus = 'active' | 'template' | 'disabled'

export function parseParamsToAddFilterByJackpotStatus(status: jackpotStatus, params?: pageableProps): pageableProps {
    const exp = status === 'active'
        ? 'template$eq=false[and]enabled$eq=true'
        : status === 'template'
            ? 'template$eq=true'
            : 'template$eq=false[and]enabled$eq=false'

    const filterExp = params?.filterExp
        ? `${params.filterExp}[and]${exp}`
        : exp

    return {
        ...params,
        filterExp,
    }
}
export function parseParamsToAddFilterByJackpotDash(status: jackpotStatus, params?: pageableProps): pageableProps {
    const exp = status === 'active'
        ? 'enabled$eq=true'
        : 'enabled$eq=false'

    const filterExp = params?.filterExp
        ? `${params.filterExp}[and]${exp}`
        : exp

    return {
        ...params,
        filterExp,
    }
}
