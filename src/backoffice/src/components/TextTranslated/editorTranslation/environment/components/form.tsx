import { Editor } from '@tinymce/tinymce-react'
import React, { useEffect, useState } from 'react'
import { toastError, toastSuccess } from 'utils/functions/notifications'
import Grid from 'components/uiKit/grid'
import InputGroup from 'components/uiKit/inputs/inputGroup'
import Typography from 'components/uiKit/typography'
import Toggle from 'components/uiKit/inputs/Toggle'
import Button from 'components/uiKit/buttons'
import Loading from 'assets/loading'
import { useRouter } from 'next/router'
import { api } from 'utils/services/api'
import Card from 'components/cards/card'
import { TranslationItemI } from '..'
import { editorInit } from './editorConfig'

interface TranslationFormI {
    currentTranslation?: TranslationItemI;
}

export default function TranslationForm({ currentTranslation }: TranslationFormI) {
    const [loading, setLoading] = useState(false)
    const { locale } = useRouter()
    const client = 'BO'

    const initialData = {
        key: '',
        value: '',
        locale: '',
        client: 'BO',
        group: '',
        isHtml: false,
        paths: [],
        ...currentTranslation,
    }

    const [translation, setTranslation] = useState<TranslationItemI>(initialData)

    async function fetchCurrentTranslation() {
        setLoading(true)
        try {
            const url = `${process.env.NEXT_PUBLIC_API_ENDPOINT}/gateway/api/v1/translations?filterExp=client$eq=${client}[AND]locale$eq=${locale}[and]group$eq=${translation?.group}[and]key$eq=${translation?.key}`
            api.get(url).then((response) => {
                setLoading(false)
                if (response.status < 300) {
                    const { data } = response
                    if (data?.content?.length > 0) {
                        setTranslation(data?.content?.[0])
                    }
                } else {
                    throw new Error('Fetch failed')
                }
            })
        } catch (error) {
            setLoading(false)
            toastError('Something went wrong.')
        }
    }

    useEffect(() => {
        if (currentTranslation?.key && currentTranslation?.group) {
            fetchCurrentTranslation()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentTranslation])

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault()
        const method = translation?.id ? api.put : api.post
        const url = `${process.env.NEXT_PUBLIC_API_ENDPOINT}/gateway/api/v1/translations`
        setLoading(true)
        try {
            const response = await method(url, translation)
            if (response.status < 300) {
                setLoading(false)
                const { data } = response
                setTranslation((old) => ({ ...old, ...data }))
                toastSuccess(translation?.id ? 'Translation updated successfully' : 'Translation created successfully')
            } else {
                setLoading(false)
                toastError('Something went wrong.')
            }
        } catch (error) {
            setLoading(false)
            toastError('Something went wrong.')
        }
    }

    return (
        <Grid>
            <form onSubmit={handleSubmit}>
                <Grid>
                    <Grid width={100}>
                        <Typography
                            weight={800}
                            elementType="h3"
                        >
                            EDIT TRANSLATION CONTENT
                        </Typography>
                    </Grid>
                    <Grid width={100} margin="mb-1">
                        <Typography
                            weight={500}
                            elementType="h6"
                        >
                            Translation Details:
                        </Typography>
                    </Grid>
                    <Grid width={100} gap="10px" margin="mb-3">
                        <Typography
                            elementType="p"
                        >
                            GROUP:
                        </Typography>
                        <Typography
                            weight={800}
                            elementType="p"
                        >
                            {translation?.group}
                        </Typography>
                        <Typography
                            elementType="p"
                        >
                            KEY:
                        </Typography>
                        <Typography
                            weight={800}
                            elementType="p"
                        >
                            {translation?.key}
                        </Typography>
                        <Typography
                            elementType="p"
                        >
                            LOCALE:
                        </Typography>
                        <Typography
                            weight={800}
                            elementType="p"
                        >
                            {translation?.locale}
                        </Typography>
                    </Grid>
                </Grid>

                <Grid
                    style={{
                        opacity: loading ? 0.5 : 1,
                        pointerEvents: loading ? 'none' : 'auto',
                    }}
                >
                    <Grid padding={['pt-3', 'pb-5']}>
                        <Grid>
                            <Toggle
                                label={<p>is Html? (Rich text)</p>}
                                name="isHtmlTranslationToggle"
                                id="isHtmlTranslationToggle"
                                value={!!translation?.isHtml}
                                onChange={() => setTranslation((old) => ({ ...old, isHtml: !old.isHtml }))}
                            />
                        </Grid>
                    </Grid>

                    <Grid padding={['pt-3']}>
                        {
                            translation?.isHtml
                                ? (
                                    <Editor
                                        id="value"
                                        tagName="value"
                                        apiKey="6b7gpn9fu2gatkowxbys5ueortlsf1w1gelalgtbre7sl92i"
                                        value={translation?.value}
                                        init={editorInit('editorTranslationValue') as any}
                                        onEditorChange={(content) => (setTranslation((old) => ({ ...old, value: content })))}
                                    />
                                )
                                : (
                                    <InputGroup
                                        label={(
                                            <Typography>
                                                value
                                            </Typography>
                                        )}
                                        id="value"
                                        name="value"
                                        noEditTranslation
                                        value={translation?.value}
                                        onChange={({ target }) => (setTranslation((old) => ({ ...old, value: target.value })))}
                                    />
                                )
                        }

                    </Grid>

                    <Grid hidden={!currentTranslation?.replaces?.length}>
                        <Grid>
                            <h3>
                                translation variables
                            </h3>
                        </Grid>
                        <div>
                            {
                                currentTranslation?.replaces?.map((variable) => {
                                    return (
                                        <Card
                                            width="fit-content"
                                            color="primary-outline"
                                            gap="0.5rem"
                                            margin={['mb-3']}
                                            style={{ cursor: 'pointer' }}
                                            onClick={() => {
                                                navigator.clipboard.writeText(variable.code).then(() => {
                                                    toastSuccess('Variable successfully copied to clipboard')
                                                })
                                            }}
                                        >
                                            <div>
                                                <div>
                                                    <b>Code </b>
                                                    <span>{` ${variable.code}`}</span>
                                                </div>
                                                <div>
                                                    <b>Current Value </b>
                                                    <span>{` ${variable.value}`}</span>
                                                </div>
                                            </div>
                                        </Card>
                                    )
                                })
                            }
                        </div>
                    </Grid>
                </Grid>
                <Grid padding={['pt-5', 'pb-3']} horizontalAlgin="flex-end">
                    <Button id="translation-login-cta" type="submit">
                        {
                            loading && <Loading />
                        }
                        save
                    </Button>
                </Grid>
            </form>
        </Grid>
    )
}
