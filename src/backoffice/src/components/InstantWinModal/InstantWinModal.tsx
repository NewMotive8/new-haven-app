import React, { useState } from 'react'
import Dialog from 'components/uiKit/dialogs/index'
import Grid from 'components/uiKit/grid'
import Typography from 'components/uiKit/typography'
import InstantWinEditor from '../instantWinEditor/InstantWinEditor'
import Button from 'components/uiKit/buttons'
import { FaTrashAlt } from 'react-icons/fa'
import { FaRegSave } from "react-icons/fa";
interface Props {
  value?: string | null
  onSave: (value: string) => void
  onClose: () => void
}

export default function InstantWinModal({
  value,
  onSave,
  onClose,
}: Props) {
  const [localValue, setLocalValue] = useState<string>(value ?? '')

  return (
    <Dialog
      anchor="center"
      height="fit-content"
      displayClose
      onClose={onClose}
    >
      <Grid gap="1rem"  style={{
          minWidth: 560,
          maxWidth: 640,
          overflow: 'visible',
        }}>
       <Typography
  weight={600}
  translateGroup="instant-wins-header"
  translateKey="edit-instant-wins-title"
/>

        <InstantWinEditor
          value={localValue}
          onChange={setLocalValue}
        />

        <Grid horizontalAlgin="flex-end" gap="0.5rem">
          <Button
                      type="button"
                      color="danger"
                      onClick={onClose} id={'cancel-instant-win-save-cta'}          >
                      <FaTrashAlt style={{ marginRight: '0.5rem' }} />
           <Typography
  weight={600}
  translateGroup="instant-wins-buttons"
  translateKey="edit-instant-wins-cancel"
/>
          </Button>
          <Button
                      type="button"
                      color="primary"
                      onClick={() => onSave(localValue)} id={'save-instant-win-cta'}>
                  <FaRegSave style={{ marginRight: '0.5rem' }} />
           <Typography
  weight={600}
  translateGroup="instant-wins-buttons"
  translateKey="edit-instant-wins-save"
/>
          </Button>
        </Grid>
      </Grid>
    </Dialog>
  )
}
