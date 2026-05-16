import Card from 'components/cards/card'
import Button from 'components/uiKit/buttons'
import Grid from 'components/uiKit/grid'
import InputFile from 'components/uiKit/inputs/inputFile'
import Typography from 'components/uiKit/typography'
import { useUploadCsv } from '../useUploadCsv'

interface DialogUploadProps {
  translateGroup?: string
  dialogId:string
  fileApi:any
}

export default function DialogUpload({
  translateGroup,
  dialogId,
  fileApi,
}: DialogUploadProps) {
  const {
 loading, file, handleOnSubmit, handleFileChange,
} = useUploadCsv({ fileApi, dialogId })

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
          translateGroup={
            translateGroup ? 'dialog' : `dialog-${translateGroup}`
          }
          translateKey="upload-file"
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
          translateGroup={
            translateGroup ? 'dialog' : `dialog-${translateGroup}`
          }
          translateKey="subtitle-upload-file"
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
