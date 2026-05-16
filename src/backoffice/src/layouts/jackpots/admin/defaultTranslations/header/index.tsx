import Button from 'components/uiKit/buttons'
import Grid from 'components/uiKit/grid'
import Typography from 'components/uiKit/typography'
import AuthContext from 'context/auth'
import React, { useState } from 'react'
import { useQuery } from 'react-query'
import defaultTranslationsApi, { defaultTranslationsI } from 'utils/services/api/requests/defaultTranslations'
import userApi from 'utils/services/api/requests/user'
import Loading from 'assets/loading'
import { CrudContext } from '..'

const defaultData = [
    {
        locale: 'en-GB',
        key: 'optInButton',
        translation: 'Jackpot Opt-In',
        enabled: true,
        category: 'widget',
        isHtml: false,
    },
    {
        locale: 'en-GB',
        key: 'optOutButton',
        translation: 'Jackpot Opt-Out',
        enabled: true,
        category: 'widget',
        isHtml: false,
    },
    {
        locale: 'en-GB',
        key: 'loading',
        translation: 'Loading',
        enabled: true,
        category: 'widget',
        isHtml: false,
    },
    {
        locale: 'en-GB',
        key: 'errorDefaultMessage',
        translation: 'Sorry, Something went wrong, try again later.',
        enabled: true,
        category: 'widget',
        isHtml: false,
    },
    {
        locale: 'en-GB',
        key: 'userInLabel',
        translation: "You're in, good luck!",
        enabled: true,
        category: 'widget',
        isHtml: false,
    },
    {
        locale: 'en-GB',
        key: 'userOutLabel',
        translation: "You've opted out of this Jackpot",
        enabled: true,
        category: 'widget',
        isHtml: false,
    },
    {
        locale: 'en-GB',
        key: 'winMessage',
        translation: 'CONGRATS!<br/> YOU WON THE JACKPOT!',
        enabled: true,
        category: 'widget',
        isHtml: true,
    },
    {
        locale: 'en-GB',
        key: 'closeWidgetConfirmMessage',
        translation: 'Are you sure?',
        enabled: true,
        category: 'widget',
        isHtml: false,
    },
    {
        locale: 'en-GB',
        key: 'termsAndConditionsContent',
        translation: 'Terms and Conditions',
        enabled: true,
        category: 'widget',
        isHtml: false,
    },
    {
        locale: 'en-GB',
        key: 'description',
        translation: 'Description',
        enabled: true,
        category: 'widget',
        isHtml: false,
    },
    {
        locale: 'en-GB',
        key: 'termsPopupAcceptButtonLabel',
        translation: 'Click below to join this Jackpot',
        enabled: true,
        category: 'widget',
        isHtml: false,
    },
    {
        locale: 'en-GB',
        key: 'termsPopupGetOutButtonLabel',
        translation: 'Click bellow to opt out of this Jackpot',
        enabled: true,
        category: 'widget',
        isHtml: false,
    },
    {
        locale: 'en-GB',
        key: 'jackpotWin',
        translation: 'This Jackpot was won!',
        enabled: true,
        category: 'widget',
        isHtml: false,
    },
    {
        locale: 'en-GB',
        key: 'communityJackpotWin',
        translation: 'This community Jackpot was won!',
        enabled: true,
        category: 'widget',
        isHtml: false,
    },
    {
        locale: 'en-GB',
        key: 'titlePopup',
        translation: 'Terms and Conditions',
        enabled: true,
        category: 'widget',
        isHtml: false,
    },
]

export default function DefaultTranslationsHeader() {
    const {
        askRefresh,
    } = React.useContext(CrudContext)
    const [loading, setLoading] = useState(false)
    const { isAuthenticated, token } = React.useContext(AuthContext)
    const { data, isLoading, error } = useQuery(['account-info', token], userApi.getUserInfo, {
        enabled: !!isAuthenticated,
    })
    function createDefault() {
        setLoading(false)
        defaultData.forEach((item, i) => {
            const isLastOne = !!((i + 1) === defaultData.length)
            setTimeout(() => {
                defaultTranslationsApi.submitForm(item as defaultTranslationsI, { silent: !isLastOne })
                if (isLastOne && askRefresh) {
                    askRefresh()
                }
                if (isLastOne) {
                    setLoading(false)
                }
            }, i * 200)
        })
    }

    return (
        <Grid>
            <Typography
                translateGroup="default-translations"
                translateKey="default-translations"
                weight={600}
                elementType="h5"
                margin="mb-1"
                style={{
                    textTransform: 'capitalize',
                    width: '100%',
                }}
            />

            <Typography
                translateGroup="default-translations"
                translateKey="default-translations-administration"
                weight={400}
                elementType="p"
                margin="mb-3"
                style={{
                    textTransform: 'capitalize',
                }}
            />
            <Grid hidden={isLoading || data.role !== 'ROOT'}>
                <Button disabled={loading} onClick={() => createDefault()} id="create-defaults">
                    {
                        loading && <Loading />
                    }
                    <Typography
                        translateGroup="default-translations"
                        translateKey="create-defaults"
                    />
                </Button>
            </Grid>
        </Grid>
    )
}
