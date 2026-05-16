import Loading from 'assets/loading'
import Button from 'components/uiKit/buttons'
import Grid from 'components/uiKit/grid'
import Typography from 'components/uiKit/typography'
import React, { useContext } from 'react'
import { BsTrash, BsXLg } from 'react-icons/bs'
import { IoSaveOutline } from 'react-icons/io5'
import { CrudContext } from '..'

export default function FooterForm() {
    const {
        setSelectedItem,
        deleteItem,
        loading,
        selectedItem,
        submitForm,
    } = useContext(CrudContext)

    // Guard to safely check if selectedItem exists and has a valid id
    const hasValidId = selectedItem && typeof selectedItem.id === 'number' && selectedItem.id > 0

    return (
        <>
            <div style={{ margin: '2.5rem 0'}} />
            <Grid wrap="nowrap" margin={['mt-5', 'mb-3']} horizontalAlgin="space-between">
                <Grid horizontalAlgin="flex-start" verticalAlgin="center" gap="0.5rem">
                    <Button
                        id='crud-cancelButton'
                        onClick={() => setSelectedItem(null)}
                        type="button"
                        color="primary-outline"
                    >
                        <Grid wrap="nowrap" gap="0.25rem" horizontalAlgin="center" verticalAlgin="center">
                            <BsXLg />
                            <Typography translateGroup="global" translateKey="cancel" />
                        </Grid>
                    </Button>

                    {hasValidId && (
                        <Button
                            id='crud-delete-button'
                            onClick={() => deleteItem()}
                            type="button"
                            color="danger-outline"
                        >
                            <Grid wrap="nowrap" gap="0.25rem" horizontalAlgin="center" verticalAlgin="center">
                                <BsTrash />
                                <Typography translateGroup="global" translateKey="delete" />
                            </Grid>
                        </Button>
                    )}
                </Grid>

                <Button
                    id='crud-button-submit'
                    disabled={loading}
                    type="button"
                    color="primary"
                    onClick={() => submitForm()}
                >
                    <Grid wrap="nowrap" gap="0.25rem" horizontalAlgin="center" verticalAlgin="center">
                        <IoSaveOutline />
                        <Typography translateGroup="global" translateKey="save" />
                        {loading && <Loading size={30} />}
                    </Grid>
                </Button>
            </Grid>
        </>
    )
}
