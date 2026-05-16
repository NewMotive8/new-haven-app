import Card from 'components/cards/card'
import Button from 'components/uiKit/buttons'
import Grid from 'components/uiKit/grid'
import Typography from 'components/uiKit/typography'
import { CrudContext } from 'layouts/jackpots/jackpots'
import { useContext, useEffect, useState } from 'react'
import { BsTrash } from 'react-icons/bs'
import { useThemeWatcher } from 'utils/customHooks'
import { poolsI } from 'utils/services/api/requests/pools'
import ExpandCollapseCard from 'components/cards/expandCollapseCard'
import FormPool from './form'
import { usePoolForm } from './usePool'
import { useSeedForm } from '../seed/useSeed'
import CommonInputs from './form/commonInputs'

interface MenuStates {
  [key: string]: boolean
}
export default function PoolTab() {
  const { selectedItem } = useContext(CrudContext)
  const [menuStates, setMenuStates] = useState<MenuStates>({})

  const { addPool, removePool } = usePoolForm()
  const { addSeed, removeSeed } = useSeedForm()

  const toggleMenu = (attendeeId: string) => {
    setMenuStates((prevState: any) => ({
      ...prevState,
      [attendeeId]: !prevState[attendeeId] || false,
    }))
  }
  useEffect(() => {
    if (!selectedItem.id) {
      toggleMenu('0')
    }
  }, [])

  const theme = useThemeWatcher()
  function handlerDelet(position: any) {
    if (!selectedItem.id) {
      removePool(position)
      removeSeed(position)
    }
  }
  return (
    <>
      {selectedItem?.type !== 'MULTI_LEVEL' ? (
        <FormPool />
      ) : (
        <Grid>
          <Grid padding={['pb-3']}>
            <CommonInputs />
          </Grid>
          <Grid gap="1rem" padding={['pb-3']}>
            {selectedItem?.pools.map((_: poolsI, index: any) => (
              <ExpandCollapseCard
                color="primary-full"
                key={index}
                header={(
                  <Grid wrap="nowrap" horizontalAlgin="space-between">
                    <Grid gap="0.5rem">
                      <Typography
                        translateGroup="jackpot-pool"
                        translateKey="tier"
                      />
                      <Typography>{` ${index + 1}`}</Typography>
                    </Grid>
                    <BsTrash onClick={() => handlerDelet(index)} />
                  </Grid>
                )}
              >
                <Grid
                  style={{
                    padding: menuStates[index] ? '1rem' : '0',
                    transition: 'padding 0.5s ease-in-out',
                  }}
                >
                  <FormPool index={index} isMultiLevel />
                </Grid>
              </ExpandCollapseCard>
            ))}
          </Grid>
          <Grid>
            <Button
              id="crud-cancelButton"
              onClick={() => {
                addPool()
                addSeed()
              }}
              type="button"
              disabled={selectedItem?.id}
              color="primary-outline"
            >
              <Grid
                wrap="nowrap"
                gap="0.25rem"
                horizontalAlgin="center"
                verticalAlgin="center"
              >
                <Typography
                  translateGroup="jackpot-pool"
                  translateKey="add-more-tier"
                />
              </Grid>
            </Button>
          </Grid>
        </Grid>
      )}
    </>
  )
}
