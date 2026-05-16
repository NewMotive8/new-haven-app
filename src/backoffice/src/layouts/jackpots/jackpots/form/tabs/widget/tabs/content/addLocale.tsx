import Card from 'components/cards/card'
import InfoCard from 'components/cards/infoCard'
import confirmBox from 'components/selectors/confirmBox'
import Button from 'components/uiKit/buttons'
import Grid from 'components/uiKit/grid'
import SelectGroup from 'components/uiKit/inputs/selectGroup'
import Typography from 'components/uiKit/typography'
import { externalDialogCall } from 'context/dialog'
import { useState } from 'react'
import { TiInfoLargeOutline } from 'react-icons/ti'
import { OptionSelect } from 'utils/functions/locale'
import { toastError, toastSuccess } from 'utils/functions/notifications'
import { JackpotI } from 'utils/services/api/requests/jackpots/types'
import translationsJPApi from 'utils/services/api/requests/translationsJP'
import { translationsDefault } from './defaultTranslations'

interface Props {
  currentJackpot: JackpotI
}

export default function AddLocale(props: Props) {
  const { currentJackpot } = props
  const [locale, setLocale] = useState('')
  const [loading, setLoading] = useState(false)

  const defaultTranslations = translationsDefault.map((item: any) => ({
    ...item,
    locale,
    jackpot: currentJackpot,
  }))

  function handleConfirmCreate() {
    confirmBox({
      confirmMessage: 'Are you sure you want to create a new locale?',
      onConfirm: () => {
        setLoading(true)
        translationsJPApi
          .submitForm('post', defaultTranslations, { silent: true })
          .then(() => {
            toastSuccess('New locale was successfully created!')
            setLoading(false)
            externalDialogCall.removeDialog('ADD-LOCALE')
          })
          .catch(() => {
            toastError('Something went wrong')
            setLoading(false)
            externalDialogCall.removeDialog('ADD-LOCALE')
          })
      },
    })
  }

  return (
    <Card
      color="secondary"
      padding={['p-3', 'pt-5']}
      style={{
        width: '600px',
        maxWidth: 'calc(100vw - 2rem)',
        maxHeight: 'calc(100dvh - 4rem)',
        overflowY: 'auto',

      }}
      animateOnScroll
      animation="zoom-in"
    >
      <Grid>
        <Typography
          translateGroup="widget-translation-content"
          translateKey="add-a-new-locale"
          size="lg"
          weight={600}
          style={{
            width: '100%',
            textAlign: 'center',
          }}
        />
      </Grid>
      <InfoCard
        color="info-outline"
        icon={<TiInfoLargeOutline />}
        label="what-is-a-new-locale"
        content="what-is-a-new-locale-explained"
        contentProps={{ weight: 500, size: 'normal' }}
      />
      <Grid wrap="nowrap" gap="0.5rem">
        <Grid>
          <SelectGroup
            value={OptionSelect().filter((d) => d.value === locale)}
            id="locale"
            label="locale"
            name="locale"
            placeholder={(
              <Typography
                translateGroup="input-group-label"
                translateKey="locale"
                size="sm"
              />
            )}
            onChange={({ target }) => {
              setLocale(target.value)
            }}
            options={OptionSelect()}
          />
        </Grid>
        <Grid responsiveWidth={{ sm: 20 }}>
          <Button
            disabled={!locale || loading}
            id="create-a-new-locale"
            onClick={() => handleConfirmCreate()}
          >
            <Typography
              translateGroup="widget-translation-content"
              translateKey="add-locale"
              style={{ whiteSpace: 'nowrap' }}
            />
          </Button>
        </Grid>
      </Grid>
    </Card>
  )
}
