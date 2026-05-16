import { textTranslated } from 'components/TextTranslated'
import Card from 'components/cards/card'
import Button from 'components/uiKit/buttons'
import Grid from 'components/uiKit/grid'
import InputGroup from 'components/uiKit/inputs/inputGroup'
import Typography from 'components/uiKit/typography'
import DialogContext from 'context/dialog'
import { useContext, useState } from 'react'
import { toastError } from 'utils/functions/notifications'
import usersApi from 'utils/services/api/requests/users'
import validateForm from './formValidation'

export default function ResetPassword() {
  const [email, setEmail] = useState<string>('')
  const [errors, setErrors] = useState<any>({ count: 0 })
  const { removeDialog } = useContext(DialogContext)
  async function handleConfirm() {
    const validationFormResult = validateForm({ email })
    setErrors(validationFormResult)
    if (validationFormResult?.count) {
      setErrors(validationFormResult)
      toastError(
        textTranslated({
          group: 'toast-notifications',
          key: 'something-wrong-with-your-data',
        }),
      )
    } else {
      await usersApi.resetPassword({ email, disableConfirmation: true })
      removeDialog('RESET-PASSWORD')
    }
  }
  return (
    <Card
      color="secondary"
      padding={['p-3', 'pt-5']}
      style={{
        width: '400px',
        maxWidth: 'calc(100vw - 2rem)',
        maxHeight: 'calc(100dvh - 4rem)',
        overflowY: 'auto',
      }}
      animateOnScroll
      animation="zoom-in"
      animationDuration="100ms"
    >
      <Grid responsiveWidth={{ sm: 100 }} horizontalAlgin="center">
        <Typography
          translateGroup="dialog"
          translateKey="reset-password"
          weight={800}
          size="lg"
        />
      </Grid>
      <Grid responsiveWidth={{ sm: 100 }}>
        <InputGroup
          id="email"
          name="email"
          label="email"
          feedback={errors?.email}
          status={errors?.email && 'error'}
          value={email}
          onChange={({ target }) => {
            setEmail(target.value)
            setErrors({ count: 0 })
          }}

        />
      </Grid>
      <Grid horizontalAlgin="space-between">
        <Grid width={45}>
          <Button
            id="confirm-dialog-cancel-reset"
            type="button"
            block
            onClick={() => removeDialog('RESET-PASSWORD')}
            color="secondary"
          >
            <Typography
              translateGroup="global"
              translateKey="cancel"
              weight={600}
            />
          </Button>
        </Grid>
        <Grid width={45}>
          <Button
            id="confirm-dialog-confirm-reset"
            type="button"
            block
            onClick={() => handleConfirm()}
            color="primary"
          >
            <Typography
              translateGroup="global"
              translateKey="continue"
              weight={600}
            />
          </Button>
        </Grid>
      </Grid>
    </Card>
  )
}
