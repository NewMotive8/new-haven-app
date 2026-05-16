import Loading from 'assets/loading'
import Button from 'components/uiKit/buttons'
import Grid from 'components/uiKit/grid'
import Typography from 'components/uiKit/typography'
import { useState } from 'react'
import { BsDownload } from 'react-icons/bs'
import { toastError } from 'utils/functions/notifications'

interface DownloadCSVButtonProps{
  getCsvBlob:any,
  fileName:string
  disabled?:boolean
}
export function DownloadCSVButton({ getCsvBlob, fileName, disabled = false }: DownloadCSVButtonProps) {
  const [loading, setLoading] = useState(false)
  async function handleDownloadCSV() {
    setLoading(true)
    try {
      const response = await getCsvBlob()
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', fileName)
      document.body.appendChild(link)
      link.click()
      if (link.parentNode) {
        link.parentNode.removeChild(link)
      }
      window.URL.revokeObjectURL(url)
    } catch (error) {
      toastError('Something went wrong.')
    }
    setLoading(false)
  }
  return (
    <Button
      id="download-item-button"
      onClick={() => handleDownloadCSV()}
      color="primary"
      disabled={disabled || loading}
    >
      <Grid
        wrap="nowrap"
        gap="0.25rem"
        horizontalAlgin="center"
        verticalAlgin="center"
      >
        {loading && (<Loading />)}
        <BsDownload />
        <Typography
          translateGroup="global"
          translateKey="Export-CSV"
          weight={600}
        />
      </Grid>
    </Button>
  )
}
