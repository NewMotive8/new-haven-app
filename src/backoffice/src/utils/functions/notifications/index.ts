import { ReactNode } from 'react'
import { toast, ToastOptions } from 'react-toastify'

export function toastSuccess(content: ReactNode, options?: ToastOptions) {
    const settings: ToastOptions = {
        ...options,
    }
    return toast.success(content, settings)
}

export function toastWarning(content: ReactNode, options?: ToastOptions) {
    const settings: ToastOptions = {
        ...options,
    }
    return toast.warning(content, settings)
}

export function toastInfo(content: ReactNode, options?: ToastOptions) {
    const settings: ToastOptions = {
        ...options,
    }
    return toast.info(content, settings)
}

export function toastError(content: ReactNode, options?: ToastOptions) {
    const settings: ToastOptions = {
        ...options,
    }
    return toast.error(content, settings)
}
