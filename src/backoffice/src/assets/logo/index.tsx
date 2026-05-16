import dynamic from 'next/dynamic'

const AppLogo = dynamic(() => import('./appLogo'), { ssr: false })
export default AppLogo
