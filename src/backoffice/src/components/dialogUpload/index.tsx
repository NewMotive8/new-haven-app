import Card from 'components/cards/card'
import Button from 'components/uiKit/buttons'
import Grid from 'components/uiKit/grid'
import InputFile from 'components/uiKit/inputs/inputFile'
import Typography from 'components/uiKit/typography'
import DialogContext from 'context/dialog'
import React, { ChangeEvent, useContext, useState } from 'react'
import { toastError } from 'utils/functions/notifications'
import fileEventsApi from 'utils/services/api/requests/file/events'

interface DialogUploadProps{
  translateGroup?:string
}

export default function DialogUpload({ translateGroup }:DialogUploadProps) {
  const [loading, setLoading] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const { removeDialog } = useContext(DialogContext)

  const handleFileUpload = () => {
    setLoading(true)

    const formData = new FormData()
    formData.append('file', file as File)

    const config = {
      headers: {
        'content-type': 'multipart/form-data',
      },
    }

    fileEventsApi.submitForm(formData, {
      successCallBack: () => {
        setFile(null)
        setLoading(false)
        removeDialog('UPLOAD-FILE')
      },
      errorCallBack: () => {
        setLoading(false)
      },
      config,
    })
  }

  const handleOnSubmit = (e: ChangeEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (file instanceof File) {
      handleFileUpload()
    } else {
      toastError('Erro ao fazer upload do arquivo')
    }
  }

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files && event.target.files[0]
    if (selectedFile) {
      setFile(selectedFile)
    }
  }

  return (
    <Card
      color="secondary"
      padding={['p-3', 'pt-5']}
      style={{
        width: '600px',
        maxWidth: 'calc(100vw - 2rem)',
      }}
    >
      <Grid>
        <Typography
          translateGroup={translateGroup ? 'dialog' : `dialog-${translateGroup}`}
          translateKey="upload-list-file"
          size="lg"
          weight={600}
          style={{
            width: '100%',
            textAlign: 'center',
          }}
        />
      </Grid>
      <Grid>
        <Typography
          translateGroup={translateGroup ? 'dialog' : `dialog-${translateGroup}`}
          translateKey="subtitle-upload-list-file"
          size="sm"
          weight={600}
          style={{
            width: '100%',
            textAlign: 'center',
          }}
        />
      </Grid>

      <form onSubmit={handleOnSubmit}>
        <Grid horizontalAlgin="space-between" verticalAlgin="flex-start">
          <Grid responsiveWidth={{ sm: 100, md: 'calc(75% - 0.25rem)' }}>
            <InputFile
              name="upload-file"
              id="upload-file"
              value={file}
              onChange={handleFileChange}
            />
          </Grid>
          <Grid responsiveWidth={{ sm: 100, md: 'calc(25% - 0.25rem)' }}>
            <Button
              id="add-item-button"
              type="submit"
              color="primary"
              disabled={loading || !file}
            >
              <Typography
                translateGroup="dialog-button-submit"
                translateKey="import-csv"
                weight={600}
              />
            </Button>
          </Grid>
        </Grid>
      </form>
    </Card>
  )
}
