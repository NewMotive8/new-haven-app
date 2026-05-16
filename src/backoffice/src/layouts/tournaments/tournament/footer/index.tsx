import Loading from 'assets/loading'
import Button from 'components/uiKit/buttons'
import Grid from 'components/uiKit/grid'
import Typography from 'components/uiKit/typography'
import React, { useContext } from 'react'
import { BsTrash, BsXLg } from 'react-icons/bs'
import { IoSaveOutline } from 'react-icons/io5'
import { CrudContext } from '..'
import { FormContext } from '../form'

export default function FooterForm() {
    const {
        setSelectedItem,
        deleteItem,
        loading,
        selectedItem,
    } = useContext(CrudContext)
    const {
        currentTab
    } = React.useContext(FormContext)
    const hiddenDeleteSave = ['segments', 'events', 'payouts', 'instances']
    return (
        <>
            <div style={{ margin: '2.5rem 0' }} />
            <Grid wrap="nowrap" margin={['mt-5', 'mb-3']} horizontalAlgin="space-between">
                <Grid horizontalAlgin="flex-start" verticalAlgin="center" gap="0.5rem">
                    {selectedItem.id >= 1 && !hiddenDeleteSave.includes(currentTab.value as any)
                        ? (
                            <Button
                                id='crud-cancel-button'
                                onClick={() => deleteItem()}
                                type="button"
                                color="danger-outline"
                            >
                                <Grid wrap="nowrap" gap="0.25rem" horizontalAlgin="center" verticalAlgin="center">
                                    <BsTrash />
                                    <Typography
                                        translateGroup="global"
                                        translateKey="delete"
                                    />
                                </Grid>
                            </Button>
                        ) : ('')}
                </Grid>
                {
                    !hiddenDeleteSave.includes(currentTab.value as any) && (

                        <Button id='crud-button-submit' disabled={loading} type="submit" color="primary">
                            <Grid wrap="nowrap" gap="0.25rem" horizontalAlgin="center" verticalAlgin="center">
                                <IoSaveOutline />
                                <Typography
                                    translateGroup="global"
                                    translateKey="save"
                                />
                                {
                                    loading && (
                                        <Loading size={30} />
                                    )
                                }
                            </Grid>
                        </Button>
                    )
                }
            </Grid>
        </>
    )
}
