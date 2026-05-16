import Loading from 'assets/loading'
import Button from 'components/uiKit/buttons'
import Grid from 'components/uiKit/grid'
import Typography from 'components/uiKit/typography'
import React, { useContext } from 'react'
import { BsTrash, BsXLg } from 'react-icons/bs'
import { IoSaveOutline } from 'react-icons/io5'
import { MdNavigateBefore, MdNavigateNext } from 'react-icons/md'
import { CrudContext } from '..'
import { FormContext } from '../form'
import { TabsKeysT } from '../form/types'

export default function FooterForm() {
    const {
        setSelectedItem,
        deleteItem,
        loading,
        selectedItem,
    } = useContext(CrudContext)
    const {
        formTabsValidation,
        currentTab,
        goPreviousTab,
        goNextTab,
        errors,
    } = useContext(FormContext)

    function hasAnyTabInvalid(): boolean {
        return Object.values(formTabsValidation).some((tab) => tab.status === 'invalid')
    }

    function handleGoNextTab(): void {
        if (!hasAnyTabInvalid()) {
            goNextTab()
        }
    }

    return (
        <>
            <div style={{ margin: '2.5rem 0' }} />
            <Grid wrap="nowrap" margin={['mt-5', 'mb-3']} horizontalAlgin="space-between">
                <Grid horizontalAlgin="flex-start" verticalAlgin="center" gap="0.5rem">
                    <Button
                        id="crud-cancelButton"
                        onClick={() => setSelectedItem(null)}
                        type="button"
                        color="primary-outline"
                    >
                        <Grid wrap="nowrap" gap="0.25rem" horizontalAlgin="center" verticalAlgin="center">
                            <BsXLg />
                            <Typography
                                translateGroup="global"
                                translateKey="cancel"
                            />
                        </Grid>
                    </Button>
                    {selectedItem.id >= 1
                        ? (
                            <Button
                                id="crud-cancel-button"
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
                <Grid horizontalAlgin="flex-end" verticalAlgin="center" gap="0.5rem">
                    <Button
                        id="crud-next-tab"
                        disabled={formTabsValidation[currentTab.value as TabsKeysT].order === 0}
                        type="button"
                        color="primary"
                        onClick={() => goPreviousTab()}
                    >
                        <Grid wrap="nowrap" gap="0.25rem" horizontalAlgin="center" verticalAlgin="center">
                            <MdNavigateBefore />
                            <Typography
                                translateGroup="global"
                                translateKey="back"
                            />
                            {
                                loading && (
                                    <Loading size={30} />
                                )
                            }
                        </Grid>
                    </Button>
                    <Button
                        id="crud-next-tab"
                        disabled={formTabsValidation[currentTab.value as TabsKeysT].status !== 'valid' || errors?.count > 0}
                        type="button"
                        color="primary"
                        onClick={() => goNextTab()}
                    >
                        <Grid wrap="nowrap" gap="0.25rem" horizontalAlgin="center" verticalAlgin="center">
                            <Typography
                                translateGroup="global"
                                translateKey="next"
                            />
                            <MdNavigateNext />
                            {
                                loading && (
                                    <Loading size={30} />
                                )
                            }
                        </Grid>
                    </Button>
                    {
                        (currentTab?.value === 'summary' || !!selectedItem?.id) && (
                            <Button
                                id="crud-button-submit"
                                disabled={loading || hasAnyTabInvalid()}
                                type="submit"
                                color="primary"
                            >
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
            </Grid>
        </>
    )
}
