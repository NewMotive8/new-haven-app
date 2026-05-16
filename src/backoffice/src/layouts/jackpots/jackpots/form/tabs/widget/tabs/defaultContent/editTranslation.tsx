import Card from 'components/cards/card'
import Button from 'components/uiKit/buttons'
import Grid from 'components/uiKit/grid'
import EditorGroup from 'components/uiKit/inputs/Editor'
import Toggle from 'components/uiKit/inputs/Toggle'
import InputGroup from 'components/uiKit/inputs/inputGroup'
import Typography from 'components/uiKit/typography'
import React, { useState } from 'react'
import { BsXLg } from 'react-icons/bs'
import { IoSaveOutline } from 'react-icons/io5'
import { defaultTranslationsI } from 'utils/services/api/requests/defaultTranslations'

interface Props {
    selectedItem: defaultTranslationsI,
    setSelectedItem: Function,
    close: Function,
}

export default function EditTranslation(props: Props) {
    const { selectedItem: si, setSelectedItem: ssi, close } = props
    const [selectedItem, setSelectedItem] = useState(si)

    function updateField(fieldName: string, value: any) {
        setSelectedItem((d: any) => { return { ...d, [fieldName]: value } })
    }

    function handleSave() {
        ssi(selectedItem)
        close()
    }

    function handleCancel() {
        close()
    }

    return (
        <Card
            color="secondary"
            padding={['p-3', 'pt-5']}
            style={{
                width: '600px',
                maxWidth: 'calc(100vw - 2rem)',
                maxHeight: 'calc(100dvh - 4rem)',
                overflowY: 'auto',

            }}
            animateOnScroll
            animation="slide-down"
            animationDuration="200ms"
        >
            <Grid>
                <Typography
                    translateGroup="widget-translation-content"
                    translateKey="update-the-translation-content"
                    size="lg"
                    weight={600}
                    style={{
                        width: '100%',
                        textAlign: 'center',
                    }}
                />
            </Grid>
            <Grid gap="1.5rem">
                <Grid padding={['pb-3']}>
                    <Typography
                        translateGroup="widget-content-translation-keys"
                        translateKey={selectedItem.key}
                    />
                </Grid>
                <Grid>
                    <InputGroup
                        id="locale"
                        name="locale"
                        label="locale"
                        value={selectedItem.locale}
                        onChange={({ target }) => { updateField(target.name, target.value) }}
                    />
                </Grid>
                <Grid>
                    <Grid horizontalAlgin="flex-end">
                        <Grid width="100px" height="50px" style={{ overflow: 'hidden' }}>
                            <Toggle
                                value={selectedItem.isHtml}
                                onChange={({ target }) => updateField('isHtml', target.value)}
                                id="isHtml"
                                name="isHtml"
                                label="rich-text"
                            />
                        </Grid>
                    </Grid>
                    {
                        selectedItem.isHtml
                            ? (
                                <EditorGroup
                                    id="translation"
                                    name="translation"
                                    label="translation"
                                    value={selectedItem.translation}
                                    onChange={({ target }) => { updateField(target.name, target.value) }}
                                />
                            )
                            : (
                                <InputGroup
                                    id="translation"
                                    name="translation"
                                    label="translation"
                                    value={selectedItem.translation}
                                    onChange={({ target }) => { updateField(target.name, target.value) }}
                                />
                            )
                    }
                </Grid>
            </Grid>

            <Grid padding={['pt-5']} horizontalAlgin="space-between">
                <Button
                    id="cancel-cta"
                    onClick={() => handleCancel()}
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
                <Button
                    id="save-cta"
                    type="button"
                    color="primary"
                    onClick={() => handleSave()}
                >
                    <Grid wrap="nowrap" gap="0.25rem" horizontalAlgin="center" verticalAlgin="center">
                        <IoSaveOutline />
                        <Typography
                            translateGroup="global"
                            translateKey="save"
                        />
                    </Grid>
                </Button>
            </Grid>

        </Card>
    )
}
