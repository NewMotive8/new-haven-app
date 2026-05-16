import React, { useState } from 'react'
import { toastError } from 'utils/functions/notifications'
import { textTranslated } from 'components/TextTranslated'
import Grid from '../grid'
import Button from '../buttons'
import InputGroup, { uiKitInputProps } from '../inputs/inputGroup'

interface Props extends uiKitInputProps {
    fileName: string,
    hiddenInput?: boolean,
}

export default function ImageUpload({
    hiddenInput, fileName, onChange: onChangeCallBack, ...inputProps
}: Props) {
    const [fileVersion, setFileVersion] = useState(0)
    const handleSubmit = async (files: any) => {
        const file = files[0]
        if (file) {
            const formData = new FormData()
            const fileExtension = file.name.split('.').pop()
            const fileNameWithExtension = `/${fileName}.${fileExtension}`

            formData.append('file', files[0])
            formData.append('fileName', fileNameWithExtension)
            try {
                const response = await fetch('/api/upload', {
                    method: 'POST',
                    body: formData,
                })

                if (response.ok) {
                    const data = await response.json()
                    if (onChangeCallBack) {
                        const fileUrl = `${window.location.origin}${data.path}`
                        onChangeCallBack({
                            target: {
                                name: inputProps.name,
                                id: inputProps.id,
                                value: fileUrl,
                            },
                        } as any)
                        setFileVersion((current) => (1 + current))
                    }
                } else {
                    toastError(textTranslated({ group: 'toast-notifications', key: 'something-went-wrong' }))
                }
            } catch (err) {
                toastError(textTranslated({ group: 'toast-notifications', key: 'something-went-wrong' }))
            }
        }
    }

    return (
        <Grid
            style={{
                opacity: inputProps.inputProps?.disabled ? '0.5' : 1,
                pointerEvents: inputProps.inputProps?.disabled ? 'none' : 'unset',
            }}
        >
            <Grid
                onClick={() => document?.getElementById(`upload-input-${inputProps.id}`)?.click() as any}
            >
                <Grid hidden={hiddenInput}>
                    <InputGroup
                        {
                        ...inputProps
                        }
                        onChange={({ target }) => { }}
                        inputProps={{
                            ...inputProps.inputProps,
                            readOnly: true,
                        }}
                        styles={{
                            ...inputProps.styles,
                            userSelect: 'none',
                        }}
                    />
                </Grid>
            </Grid>
            <Grid gap="0.5rem">
                <Grid width={50}>
                    <input
                        id={`upload-input-${inputProps.id}`}
                        type="file"
                        name="file"
                        onChange={({ target }) => { handleSubmit(target.files) }}
                    />
                </Grid>
                <Grid width="calc(50% - 0.5rem)" onClick={() => document?.getElementById(`upload-input-${inputProps.id}`)?.click() as any}>
                    <img
                        key={fileVersion}
                        src={`${inputProps.value}`}
                        alt="item"
                        height="30px"
                        width="auto"
                    />
                </Grid>
            </Grid>
        </Grid>
    )
}
