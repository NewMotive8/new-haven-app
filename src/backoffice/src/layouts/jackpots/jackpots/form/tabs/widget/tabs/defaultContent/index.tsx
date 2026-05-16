/* eslint-disable react/no-danger */
import React, { useEffect, useState } from 'react'
import Grid from 'components/uiKit/grid'
import { JackpotI, Widget } from 'utils/services/api/requests/jackpots/types'
import AuthContext from 'context/auth'
import translationsJPApi, { translationsI } from 'utils/services/api/requests/translationsJP'
import { useQuery } from 'react-query'
import Loading from 'assets/loading'
import TypeButton from 'components/uiKit/inputs/TypeButton'
import { textTranslated } from 'components/TextTranslated'
import Typography from 'components/uiKit/typography'
import DataGridV2 from 'components/uiKit/dataGridV2'
import Button from 'components/uiKit/buttons'
import DialogContext from 'context/dialog'
import { defaultTranslationsI } from 'utils/services/api/requests/defaultTranslations'
import { CrudContext } from '../../../../..'
import { FormContext } from '../../../..'
import EditTranslation from './editTranslation'

export default function DefaultContentTab() {
    const {
        jackpotTranslations,
        setJackpotTranslations,
    } = React.useContext(CrudContext)
    const {
        errors,
        updateField,
        setCurrentInfo,
    } = React.useContext(FormContext)

    const [currentLocale, setCurrentLocale] = useState()
    const { displayDialog, removeDialog } = React.useContext(DialogContext)

    function setSelectedItem(item: defaultTranslationsI) {
        setJackpotTranslations((current) => {
            const findIndex = current?.findIndex((v: defaultTranslationsI) => v.key === item.key && v.category === item.category)
            if (findIndex > -1) {
                const newValue = [...current]
                newValue[findIndex] = item
                return (newValue)
            }
            return current
        })
    }

    function handleDisplayEditTranslationDialog(selectedItem: defaultTranslationsI) {
        displayDialog({
            dialogId: 'EDIT-TRANSLATION',
            content: (
                <EditTranslation
                    selectedItem={selectedItem as defaultTranslationsI}
                    setSelectedItem={setSelectedItem as any}
                    close={() => removeDialog('EDIT-TRANSLATION')}
                />),
        })
    }

    return (
        <Grid gap="0.5rem">
            <Grid>
                <DataGridV2
                    data={jackpotTranslations}
                    onRowClick={(row: defaultTranslationsI) => handleDisplayEditTranslationDialog(row)}
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
