import DialogContext from 'context/dialog'
import { ChangeEvent, useContext, useState } from 'react'
import { toastError } from 'utils/functions/notifications'

export function useUploadCsv({ fileApi, dialogId }:any) {
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
    fileApi.submitForm(formData, {
      successCallBack: () => {
        setFile(null)
        setLoading(false)
        removeDialog(dialogId)
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

  return {
    loading,
    file,
    handleFileUpload,
    handleOnSubmit,
    handleFileChange,
  }
}
