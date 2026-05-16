import { deleteCookie, getCookie, setCookie } from 'cookies-next'
import React, { createContext, useState } from 'react'
import { SsrProps } from 'utils/globalTypes'
import { api } from 'utils/services/api'
import { AuthContextInterface } from './types'

const AuthContext = createContext<AuthContextInterface>({
    isAuthenticated: false,
    saveNewToken: () => { },
    logout: () => { },
    token: '',
})
interface Props {
    children: React.ReactNode,
    pageProps: SsrProps,
}
interface externalGetAuthStatusInterface {
    isAuthenticated: boolean,
    token: string | undefined | null,
    logout: Function
}

export const externalGetAuthStatus: externalGetAuthStatusInterface = {
    isAuthenticated: false,
    token: '',
    logout: () => { },
}

export function AuthProvider({
    children,
    pageProps,
}: Props) {
    const [isAuthenticated, setisAuthenticated] = useState(!!pageProps?.jwtToken)
    const [token, setToken] = useState(pageProps?.jwtToken)
    externalGetAuthStatus.isAuthenticated = isAuthenticated
    externalGetAuthStatus.token = token

    if (token) {
        api.defaults.headers.common.Authorization = `Bearer ${token}`
    }

    async function saveNewToken(newToken: string) {
        const date = new Date()
        date.setDate(date.getDate() + 30)
        setCookie(process.env.NEXT_PUBLIC_API_JWT_NAME || '', newToken, { expires: date })
        setToken(newToken)
        api.defaults.headers.common.Authorization = `Bearer ${newToken}`
        setisAuthenticated(true)
        externalGetAuthStatus.isAuthenticated = true
        externalGetAuthStatus.token = `Bearer ${newToken}`
    }

    function logout() {
        deleteCookie(process.env.NEXT_PUBLIC_API_JWT_NAME || '')
        setToken(undefined)
        setisAuthenticated(false)
        api.defaults.headers.common.Authorization = ''
        externalGetAuthStatus.isAuthenticated = false
        externalGetAuthStatus.token = ''
        sessionStorage.clear()
        localStorage.clear()
    }
    externalGetAuthStatus.logout = logout

    return (
        <AuthContext.Provider
            value={{
                isAuthenticated,
                saveNewToken,
                logout,
                token,
            }}
        >

            {children}
        </AuthContext.Provider>
    )
}
export default AuthContext
