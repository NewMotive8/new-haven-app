import Button from 'components/uiKit/buttons'
import Grid from 'components/uiKit/grid'
import Typography from 'components/uiKit/typography'
import DialogContext from 'context/dialog'
import { ReactNode, useContext } from 'react'
import { BsUpload } from 'react-icons/bs'
import fileTranslateApi from 'utils/services/api/requests/file/translation'
import DialogUpload from './DialogUpload'

interface UploadCSVButtonProps {
  translateGroup?: string
  label: ReactNode
}
export function UploadCSVButton({
  translateGroup,
  label,
}: UploadCSVButtonProps) {
  const { displayDialog } = useContext(DialogContext)

  function handleUploadFile() {
    displayDialog({
      dialogId: 'UPLOAD-FILE',
      content: (
        <DialogUpload
          dialogId="UPLOAD-FILE"
          translateGroup={translateGroup}
          fileApi={fileTranslateApi}
        />
      ),
    })
  }
  return (
    <Button
      id="add-item-button"
      onClick={() => handleUploadFile()}
      color="primary"
    >
      <Grid
        wrap="nowrap"
        gap="0.25rem"
        horizontalAlgin="center"
        verticalAlgin="center"
      >
        <BsUpload />
        {typeof label === 'string' ? (
          <Typography
            translateGroup="global"
            translateKey={label}
            weight={600}
          />
        ) : (
          label
        )}
      </Grid>
    </Button>
  )
}
