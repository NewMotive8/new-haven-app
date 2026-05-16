export interface AuthContextInterface {
    isAuthenticated: boolean,
    saveNewToken: Function,
    logout: Function,
    token: string | undefined,
}
