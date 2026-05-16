import Loading from 'assets/loading'
import Card from 'components/cards/card'
import confirmBox from 'components/selectors/confirmBox'
import Button from 'components/uiKit/buttons'
import Grid from 'components/uiKit/grid'
import Typography from 'components/uiKit/typography'
import { useState } from 'react'
import { MdContentCopy } from 'react-icons/md'
import { toastError, toastSuccess } from 'utils/functions/notifications'
import operatorsApi, {
  operatorsI,
} from 'utils/services/api/requests/operators'

interface Props {
  operator: operatorsI;
}

function ApplicationKey({ operator }: Props) {
  const [content, setContent] = useState<'button' | 'keyCard' | 'loading'>(
    'button',
  )
  const [state, setState] = useState({
    key: '',
    message: '',
  })

  function askNewKey() {
    confirmBox({
      confirmMessage: (
        <Typography
          translateGroup="operator-app-key"
          translateKey="Are you sure? when you ask for a new application key you will invalidate the previous one"
        />
      ),
      onConfirm: () => {
        setContent('loading')
        operatorsApi
          .generateNewApplicationKey(operator?.id)
          .then((res) => {
            setState((current) => ({ ...current, key: res.data }))
            setContent('keyCard')
          })
          .catch((err) => {
            setContent('button')
            toastError('something went wrong')
          })
      },
      onCancel: () => {},
    })
  }

  if (content === 'loading') {
    return <Loading />
  }

  if (content === 'keyCard') {
    return (
      <Card className="card" color="primary-outline">
        <Grid className="card-header">
          <Typography
            translateGroup="operator-app-key"
            translateKey="application-key"
            size="md"
            weight={700}
            style={{ width: '100%' }}
          />
        </Grid>
        <Grid gap="1rem">
          <Grid>
            <Typography
              translateGroup="operator-app-key"
              translateKey="New application key created and it will be displayed only now"
              size="md"
              weight={700}
              style={{ width: '100%' }}
            />
          </Grid>
          <Grid>
            <Grid gap="0.5rem">
              <Typography>{state.key}</Typography>
              <MdContentCopy
                cursor="pointer"
                onClick={() => {
                  navigator.clipboard.writeText(state.key)
                  toastSuccess(
                    <Typography
                      translateGroup="global"
                      translateKey="Application key copied!"
                    />,
                  )
                }}
              />
            </Grid>
            <Grid>
              <Typography>{state.message}</Typography>
            </Grid>
          </Grid>
          <Grid>
            <Typography
              translateGroup="operator-app-key"
              translateKey="Please, store it somewhere safe because when you close this page, we will not able to retrieve or restore this generated token."
              style={{ width: '100%' }}
              color="var(--warn)"
            />
          </Grid>
        </Grid>
      </Card>
    )
  }
  return (
    <Card color="primary-full">
      <Typography
        translateGroup="operator-app-key"
        translateKey="application-key"
        size="md"
        weight={700}
        style={{ width: '100%' }}
      />
      <Button
        id="cta-generate-new-app-key"
        onClick={() => askNewKey()}
        disabled={!operator.id}
      >
        <Typography
          translateGroup="operator-app-key"
          translateKey="get-new-application-key"
        />
      </Button>
    </Card>
  )
}

export default ApplicationKey
