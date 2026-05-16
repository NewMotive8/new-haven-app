import React, { useEffect } from 'react'
import Grid from 'components/uiKit/grid'
import dynamic from 'next/dynamic'
import { MdOutlineExitToApp } from 'react-icons/md'
import Typography from 'components/uiKit/typography'
import Button from 'components/uiKit/buttons'
import AuthContext from 'context/auth'
import BrandContext from 'context/brand'
import DialogContext from 'context/dialog'
import BrandSelector from 'components/selectors/brand'
import { useRouter } from 'next/router'
import styles from './styles.module.scss'
import { useAccountInfo } from 'utils/customHooks/useRole'
import { Clock } from 'components/clock'

const AppLogo = dynamic(() => import('assets/logo'), { ssr: false })
export default function NavbarMD() {
    const { isLoading: isLoadingAccountInfo, role } = useAccountInfo()
    const { logout } = React.useContext(AuthContext)
    const { currentBrand, setCurrentBrand } = React.useContext(BrandContext)
    const { displayDialog, removeDialog } = React.useContext(DialogContext)
    const { push } = useRouter()
    function handleChooseBrand() {
        displayDialog({
            dialogId: 'BRAND-SELECTOR',
            content: (<BrandSelector onChange={(brand: any) => { setCurrentBrand(brand); removeDialog('BRAND-SELECTOR') }} />),
            dialogProps: {
                disableOverlayClose: true,
                displayClose: false,
            },
        })
    }


    useEffect(() => {
        if (!isLoadingAccountInfo && role !== 'ROOT' && !currentBrand) {
            handleChooseBrand()
        }
    }, [role])

    return (
        <Grid
            verticalAlgin="center"
            className={styles.wrapper}
            horizontalAlgin="space-between"
            wrap="nowrap"
            padding={['p-3']}
        >
            <Grid onClick={() => push('/')} style={{ cursor: 'pointer'}}>
                <AppLogo height={40} width={100} />
            </Grid>
            <Grid gap="0.5rem"><Clock /></Grid>
            <Grid gap="0.5rem" horizontalAlgin="flex-end" verticalAlgin="center">
                <Button onClick={() => handleChooseBrand()} id="pick-brand" color="secondary">
                    <Grid gap="0.5rem" verticalAlgin="center">
                        <img src={currentBrand?.logo} alt="brand-logo" width="30px" height="30px" style={{ borderRadius: '50%', overflow: 'hidden' }} />
                        <Typography>
                            {currentBrand?.name}
                        </Typography>
                    </Grid>
                </Button>
                <Button id="logout" onClick={() => logout()}>
                    <Grid gap="0.5rem" verticalAlgin="center" horizontalAlgin="center">
                        <MdOutlineExitToApp />
                        <Typography
                            translateGroup="global"
                            translateKey="logout"
                        />
                    </Grid>
                </Button>
            </Grid>
        </Grid>
    )
}
