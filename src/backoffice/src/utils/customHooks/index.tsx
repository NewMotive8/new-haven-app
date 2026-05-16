import { getCookie } from 'cookies-next'
import { useEffect, useState } from 'react'

export function useDebounce(value:any, delay:number) {
    const [debouncedValue, setDebouncedValue] = useState(value)
    useEffect(
      () => {
        const handler = setTimeout(() => {
          setDebouncedValue(value)
        }, delay)
        return () => {
          clearTimeout(handler)
        }
      },
      [value, delay],
    )
    return debouncedValue
  }

export const useThemeWatcher = (intervalMs = 2000) => {
  const cookieName = 'app-theme'
  const [cookieValue, setCookieValue] = useState(() => getCookie(cookieName))

  useEffect(() => {
    const interval = setInterval(() => {
      const currentValue = getCookie(cookieName)
      if (currentValue !== cookieValue) {
        setCookieValue(currentValue)
      }
    }, intervalMs)

    return () => clearInterval(interval)
  }, [cookieName, cookieValue, intervalMs])

  return cookieValue || 'light'
}
