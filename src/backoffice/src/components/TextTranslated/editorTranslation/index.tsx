import React, { useContext } from 'react'
import { BsPen, BsTranslate } from 'react-icons/bs'
import Grid from 'components/uiKit/grid'
import DialogContext from 'context/dialog'
import Card from 'components/cards/card'
import TranslationsEnv, { TranslationItemI } from './environment'

interface Props {
    currentTranslation?: TranslationItemI;
}
export default function EditTranslation({ currentTranslation }: Props) {
    const { displayDialog } = useContext(DialogContext)

    function handleDisplayDialog() {
        displayDialog({
            dialogId: 'TRANSLATIONS-EDIT-DIALOG',
            content: (
                <Grid>
                    <Card color="secondary">
                        <TranslationsEnv currentTranslation={currentTranslation} />
                    </Card>
                </Grid>
            ),
        })
    }

    return (
        <Grid
            width="fit-content"
            gap="0.5rem"
            onClick={() => handleDisplayDialog()}
            style={{ cursor: 'pointer' }}
        >
            <BsTranslate />
            <BsPen />
        </Grid>
    )
}
