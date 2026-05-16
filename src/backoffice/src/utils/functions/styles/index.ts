import { breakPointsType } from 'utils/globalTypes'

interface Props {
    setState: Function,
    currentSize: breakPointsType
}

const status = {
    initialized: false,
    currentSize: 'sm',
}
const isMobile = {
    KindleSilk: () => navigator.userAgent.match(/Silk/i),
    Kindle: () => navigator.userAgent.match(/Kindle/i),
    Android: () => navigator.userAgent.match(/Android/i),
    BlackBerry: () => navigator.userAgent.match(/BlackBerry/i),
    iOS: () => navigator.userAgent.match(/iPhone|iPad|iPod/i),
    Opera: () => navigator.userAgent.match(/Opera Mini/i),
    Windows: () => navigator.userAgent.match(/IEMobile/i),
    any: () => isMobile.KindleSilk() || isMobile.Kindle() || isMobile.Android() || isMobile.BlackBerry() || isMobile.iOS() || isMobile.Opera() || isMobile.Windows(),
}
export function getUserDevice() {
    if (typeof window !== 'undefined') {
        const tablet = (window.screen.width < 800) || (window.screen.height < 800)
        const mobile = ((window.screen.width < 450) || (window.screen.height < 450)) && isMobile.any()
        const device = mobile ? 'mobile' : tablet ? 'tablet' : 'desktop'
        return device
    }
    return 'server-side'
}
export function updateAppSizeVersion({ setState, currentSize }: Props) {
    status.currentSize = currentSize
    const queries: Array<{ key: breakPointsType, query: MediaQueryList }> = [
        { key: 'xsm', query: window.matchMedia('(max-width: 299px)') },
        { key: 'sm', query: window.matchMedia('(min-width: 300px) and (max-width: 767px)') },
        { key: 'md', query: window.matchMedia('(min-width: 768px) and (max-width: 991px)') },
        { key: 'lg', query: window.matchMedia('(min-width: 992px) and (max-width: 1200px)') },
        { key: 'xl', query: window.matchMedia('(min-width: 1200px) and (max-width: 1400px)') },
        { key: 'xxl', query: window.matchMedia('(min-width: 1400px)') },
    ]
    function updateSize(size: breakPointsType) {
        if (getUserDevice() === 'mobile' && !size.includes('sm')) {
            setState((old: any) => ({
                ...old,
                appSize: 'sm',
            }))
        } else if (size !== status.currentSize) {
            setState((old: any) => ({
                ...old,
                appSize: size,
            }))
        }
    }
    if (!status.initialized) {
        queries.map((q) => {
            if (currentSize !== q.key && q.query.matches) {
                updateSize(q.key)
            }
            return q.query.addEventListener('change', (e) => e.matches && updateSize(q.key))
        })
        status.initialized = true
    }
}

export function getRealScreenHeight() {
    // function needed because on mobiles the CSS property 100vh have the browser navbar included
    // and this make style mistakes in some components.
    const root: any = document.querySelector(':root')

    if (root) {
        root?.style.setProperty('--vh', `${window.innerHeight - 1}px`)

        window.addEventListener('resize', () => {
            root?.style.setProperty('--vh', `${window.innerHeight - 1}px`)
        })
    }
}
