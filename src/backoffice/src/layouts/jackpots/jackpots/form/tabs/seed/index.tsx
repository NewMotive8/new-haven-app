import Card from 'components/cards/card'
import Button from 'components/uiKit/buttons'
import Grid from 'components/uiKit/grid'
import Typography from 'components/uiKit/typography'
import { CrudContext } from 'layouts/jackpots/jackpots'
import { useContext, useEffect, useState } from 'react'
import { useThemeWatcher } from 'utils/customHooks'
import { seedsI } from 'utils/services/api/requests/seeds'
import FormSeed from './form'
import { useSeedForm } from './useSeed'
import CommonInputs from './form/commonInputs'

interface MenuStates {
  [key: string]: boolean
}
export default function SeedTab() {
  const [menuStates, setMenuStates] = useState<MenuStates>({})
  const { selectedItem } = useContext(CrudContext)

  const { removeSeed } = useSeedForm()

  const theme = useThemeWatcher()

  const toggleMenu = (attendeeId: string) => {
    setMenuStates((prevState: any) => ({
      ...prevState,
      [attendeeId]: !prevState[attendeeId] || false,
    }))
  }
  function handlerDelet(position: any) {
    if (!selectedItem.id) {
      removeSeed(position)
    }
  }
  useEffect(() => {
    if (!selectedItem.id) {
      toggleMenu('0')
    }
  }, [])
  return (
    <>
      {selectedItem?.type !== 'MULTI_LEVEL' ? (
        <FormSeed />
      ) : (
        <Grid>
          <Grid padding={['p-2', 'pb-3', 'pt-3']}>
            <CommonInputs />
          </Grid>
          {selectedItem?.pools.map((_: seedsI, index: any) => (
            <Grid>
              <Grid margin={['mb-4']}>
                <Button
                  color={theme === 'light' ? 'primary' : 'primary-full'}
                  block
                  onClick={() => { }}
                  style={{ padding: 0 }}
                  id="advanced-toggle"
                >
                  <Grid
                    gap="0.5rem"
                    horizontalAlgin="flex-start"
                    wrap="nowrap"
                    padding={['pe-2']}
                  >
                    <Grid
                      gap="0.5rem"
                      onClick={() => toggleMenu(index)}
                      padding={['p-2']}
                    >
                      <Typography
                        translateGroup="jackpot-pool"
                        translateKey="tier"
                      />
                      <Typography
                        translateGroup="jackpot-pool-tier"
                        translateKey={index + 1}
                      />
                    </Grid>
                  </Grid>
                </Button>
              </Grid>
              <Card
                key={index}
                color="transparent"
                style={{
                  height: 'fit-content',
                  maxHeight: menuStates[index] ? '100%' : '0px',
                  transition: 'max-height 0.5s ease-in-out',
                  overflow: 'hidden',
                  padding: '0',
                }}
              >
                <Grid
                  style={{
                    padding: menuStates[index] ? '1rem' : '0',
                    transition: 'padding 0.5s ease-in-out',
                  }}
                >
                  <FormSeed index={index} isMultiLevel />
                </Grid>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </>
  )
}
