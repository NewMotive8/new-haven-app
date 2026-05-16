import AuthContext from 'context/auth'
import { useContext } from 'react'
import { useQuery } from 'react-query'
import userApi, { UserAccountInfoI, userRoleType } from 'utils/services/api/requests/user'

export const userAccessByRole: { [key in userRoleType]: userRoleType[] } = {
    USER: ['USER'],
    ADMIN: ['USER', 'ADMIN'],
    ROOT: ['USER', 'ADMIN', 'ROOT'],
}

interface returnUserAccountInfo extends UserAccountInfoI {
    role: userRoleType,
    isLoading: boolean
}

export function useAccountInfo(): returnUserAccountInfo {
    const { isAuthenticated, token } = useContext(AuthContext)
    const { data, isLoading, error } = useQuery(['account-info', token], userApi.getUserInfo, {
        enabled: !!isAuthenticated,
    })

    return {
        role: (data?.role) || 'USER' as userRoleType,
        ...data,
        isLoading,
    }
}
