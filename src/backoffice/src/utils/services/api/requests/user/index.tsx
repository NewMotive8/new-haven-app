import { LoginI } from 'layouts/userForms/login/types'
import { api } from '../..'
import urls from '../../urls'
import { brandI } from '../brand'

async function login(dataForm: LoginI) {
    const response = await api.post(urls.user.login, {
        username: dataForm.login,
        password: dataForm.password,
        rememberMe: dataForm.rememberMe,
    })
    return response
}

export type userRoleType = 'USER' | 'ADMIN' | 'ROOT'
export interface UserAccountInfoI {
    id: number;
    email: string;
    name: string;
    resetKey: string;
    role: userRoleType;
    enabled: boolean;
    brands: brandI[];
  }
async function getUserInfo() {
    return api.get(urls.user.info).then((res) => res.data)
}

const userApi = {
    login,
    getUserInfo,
}

export default userApi
