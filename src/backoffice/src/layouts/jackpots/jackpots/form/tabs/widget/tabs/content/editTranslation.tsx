import Loading from 'assets/loading'
import Card from 'components/cards/card'
import Button from 'components/uiKit/buttons'
import Grid from 'components/uiKit/grid'
import EditorGroup from 'components/uiKit/inputs/Editor'
import Toggle from 'components/uiKit/inputs/Toggle'
import InputGroup from 'components/uiKit/inputs/inputGroup'
import Typography from 'components/uiKit/typography'
import React, { useState } from 'react'
import { JackpotI } from 'utils/services/api/requests/jackpots/types'
import translationsJPApi, { translationsI } from 'utils/services/api/requests/translationsJP'

interface Props {
    currentTranslation: translationsI,
    currentJackpot: JackpotI,
}

export default function EditTranslation(props: Props) {
    const { currentTranslation, currentJackpot } = props
    const [state, setState] = useState({ ...currentTranslation, jackpot: currentJackpot })
    const [loading, setLoading] = useState(false)

    function updateTranslation() {
        setLoading(true)
        translationsJPApi.submitForm(currentTranslation.id ? 'put' : 'post', [state]).then((() => {
            setLoading(false)
        })).catch((error) => {
            setLoading(false)
        })
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
            <Grid horizontalAlgin="flex-end" padding={['pt-5']}>
                <Grid horizontalAlgin="space-between" verticalAlgin="flex-start" padding={['pb-3']}>
                    <Toggle
                        id="state.isHtml"
                        name="state.isHtml"
                        label="rich-text"
                        value={!!state.isHtml}
                        onChange={({ target }) => setState((current) => ({ ...current, isHtml: target.value }))}
                    />
                    <Button
                        style={{ transform: 'translateY(10px)' }}
                        disabled={loading}
                        id="create-a-new-translation"
                        onClick={() => updateTranslation()}
                    >
                        {loading && <Loading />}
                        <Typography
                            translateGroup="widget-translation-content"
                            translateKey="update-translation"
                            style={{ whiteSpace: 'nowrap' }}
                        />
                    </Button>
                </Grid>
                <Grid>
                    {
                        state.isHtml
                            ? (
                                <EditorGroup
                                    id="translation"
                                    name="translation"
                                    label="translation"
                                    value={state.translation}
                                    onChange={({ target }) => { setState((current) => ({ ...current, translation: target.value })) }}
                                />
                            )
                            : (
                                <InputGroup
                                    id="translation"
                                    name="translation"
                                    label="translation"
                                    value={state.translation}
                                    onChange={({ target }) => { setState((current) => ({ ...current, translation: target.value })) }}
                                />
                            )
                    }
                </Grid>
            </Grid>

        </Card>
    )
}
