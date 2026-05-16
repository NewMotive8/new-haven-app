/* eslint-disable react/no-danger */
import Loading from 'assets/loading'
import { textTranslated } from 'components/TextTranslated'
import Button from 'components/uiKit/buttons'
import DataGridV2 from 'components/uiKit/dataGridV2'
import Grid from 'components/uiKit/grid'
import TypeButton from 'components/uiKit/inputs/TypeButton'
import Typography from 'components/uiKit/typography'
import AuthContext from 'context/auth'
import BrandContext from 'context/brand'
import DialogContext from 'context/dialog'
import React, { useEffect, useState } from 'react'
import { useQuery } from 'react-query'
import translationsJPApi, { translationsI } from 'utils/services/api/requests/translationsJP'
import { FormContext } from '../../../..'
import { CrudContext } from '../../../../..'
import AddLocale from './addLocale'
import EditTranslation from './editTranslation'

export default function ContentTab() {
    const {
        selectedItem,
    } = React.useContext(CrudContext)
    const { brandId } = React.useContext(BrandContext)
    const {
        setCurrentInfo,
    } = React.useContext(FormContext)
    const { isAuthenticated, token } = React.useContext(AuthContext)
    const { data: allTranslations, isLoading, refetch } = useQuery(
        [`widget-translations-${selectedItem}`, token],
        () => translationsJPApi.getItemsByJackpot(selectedItem.id),
        {
            enabled: !!(!!isAuthenticated && selectedItem.id),
        },
    )

    const { data: defaultTranslations, isLoading: isLoadingDefault, error } = useQuery([`default-translations-${brandId}`, token], () => translationsJPApi.getDefaultTranslations(), {
        enabled: !!isAuthenticated,
    })

    const [currentLocale, setCurrentLocale] = useState()
    const missingTranslations = defaultTranslations
        .filter((defaultItem: translationsI) => !allTranslations?.some((currentItem: translationsI) => currentItem.key === defaultItem.key))
        .map((item: translationsI) => ({
            ...item, id: null, jackpot: selectedItem, locale: (currentLocale as any),
        }))
    const locales: any = Array.from(new Set((allTranslations || []).map((item: any) => item?.locale)))

    const { displayDialog, removeDialog } = React.useContext(DialogContext)

    function handleDisplayAddLocaleDialog() {
        displayDialog({
            dialogId: 'ADD-LOCALE',
            content: (<AddLocale currentJackpot={selectedItem} />),
            onCloseCallback: () => refetch(),
        })
    }
    function handleDisplayEditTranslationDialog(translation: translationsI) {
        displayDialog({
            dialogId: 'EDIT-TRANSLATION',
            content: (<EditTranslation currentJackpot={selectedItem} currentTranslation={translation} />),
            onCloseCallback: () => refetch(),
        })
    }

    useEffect(() => {
        if (!currentLocale && locales?.length) {
            setCurrentLocale(locales[0])
        }
    }, [locales])

    if (isLoading || isLoadingDefault) {
        return <Loading />
    }

    return (
        <Grid gap="0.5rem">
            <Grid gap="0.5rem" horizontalAlgin="space-between" verticalAlgin="flex-end">
                <TypeButton
                    name="currentLocale"
                    label="currentLocale"
                    onChange={({ target }) => setCurrentLocale(target.value)}
                    value={currentLocale}
                    onFocus={() => setCurrentInfo(textTranslated({ group: 'forms-tabs-helpers', key: 'input-widget-currentLocale-widgetDesign-help', returnDefault: 'nothing' }))}
                    options={locales.map((item: any) => ({
                        label: <Typography style={{ textTransform: 'none' }}>{item}</Typography>,
                        value: item,
                    }))}
                    gridProds={{ width: 'fit-content' }}
                />
                <Button onClick={() => handleDisplayAddLocaleDialog()} id="add-translation-locale-cta" color="primary-outline">
                    <Typography
                        translateGroup="widget-translation-content"
                        translateKey="add-locale"
                    />
                </Button>
            </Grid>
            <Grid>
                <DataGridV2
                    data={[
                        ...allTranslations.filter((item: any) => item.locale === currentLocale),
                        ...missingTranslations,
                    ]}
                    onRowClick={(row: translationsI) => handleDisplayEditTranslationDialog(row)}
                    columns={[
                        {
                            key: 'key',
                            label: 'translation-key',
                            uniqueId: 'translation-key',
                            filter: true,
                            render: (value: string) => {
                                return (
                                    <Typography
                                        translateGroup="widget-content-translation-keys"
                                        translateKey={value}
                                    />
                                )
                            },
                        },
                        {
                            key: 'translation',
                            label: 'translation-value',
                            uniqueId: 'translation-value',
                            filter: true,
                            render: (value: string) => {
                                return (
                                    <section
                                        dangerouslySetInnerHTML={{ __html: value }}
                                    />
                                )
                            },
                        },
                    ]}
                    pagination
                />
            </Grid>
        </Grid>
    )
}
