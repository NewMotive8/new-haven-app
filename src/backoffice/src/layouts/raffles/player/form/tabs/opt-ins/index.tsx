import React, { useContext, useState } from 'react'
import Grid from 'components/uiKit/grid'
import { useQuery } from 'react-query'
import DataGridV2 from 'components/uiKit/dataGridV2'
import DialogContext from 'context/dialog'
import Typography from 'components/uiKit/typography'
import Button from 'components/uiKit/buttons'
import playerOptinsApi, { playerOptinsI } from 'utils/services/api/requests/raffle-api/playerOptins'
import { CrudContext } from '../../..'
import { columns } from './listSettings'
import raffleApi from 'utils/services/api/requests/raffle-api/raffle'

export default function OptInTab() {
  const { selectedItem } = useContext(CrudContext)
  const [selectJackpot, setSelectJackpot] = useState<any>()

  const { data: playerOption, refetch: playerOptionRefetch } = useQuery(
    ['playerOption', `${selectedItem?.id}`],
    () => playerOptinsApi.getByPlayer({
      playerId: selectedItem?.id, brandId: selectedItem?.brand?.id,
    }),
    { enabled: !!selectedItem?.id && !!selectedItem?.brand?.id },
  )

  const { data: jackpots, refetch: jackpotRefetch } = useQuery('raffles', () => raffleApi.getItems())
  const { removeDialog, displayDialog } = useContext(DialogContext)


  function handleSuccess() {
    playerOptionRefetch()
    jackpotRefetch()
    setSelectJackpot(undefined)
    removeDialog('alert-jackpot-opt')
  }
  async function handleConfirm(value: any) {
    if (value?.playerOption) {
      await playerOptinsApi.submitForm(
        {
          ...value?.playerOption,
          optin: !value.playerOption.optin,
        } as playerOptinsI,
        { successCallBack: handleSuccess },
      )
    } else {
      await playerOptinsApi.submitForm(
        {
          raffleId: value.id,
          player: selectedItem,
          optin: true,
        } as playerOptinsI,
        { successCallBack: handleSuccess },
      )
    }
  }

  function handleDisplayDialog(value: any) {
    displayDialog({
      dialogId: 'alert-jackpot-opt',
      content: (
        <Grid
          style={{
            width: '750px',
            maxWidth: '90vw',
            background: 'var(--root-bg)',
            borderRadius: '4pt',
          }}
          padding={['pt-5', 'pb-5', 'ps-3', 'pe-3']}
        >
          <Grid margin="mb-5" horizontalAlgin="center">
            <Typography
              weight={700}
              size="xl"
              translateGroup="raffle-opt-in-Tab-dialog-alert"
              translateKey="Attention!"
            />
          </Grid>
          <Grid horizontalAlgin="center">
            <Typography
              translateGroup="raffle-opt-in-Tab-dialog-alert"
              translateKey="jackpotTab-dialog-alert-text"
              weight={600}
              style={{ textAlign: 'center' }}
            />
          </Grid>
          <Grid horizontalAlgin="center" margin="mb-5">
            <Typography
              translateGroup="raffle-opt-in-Tab-dialog-alert"
              translateKey="jackpotTab-dialog-alert-question"
              weight={600}
              style={{ textAlign: 'center' }}
            />
          </Grid>
          <Grid horizontalAlgin="space-between">
            <Grid width={45}>
              <Button
                id="confirm-dialog-cancel-cta"
                type="button"
                block
                onClick={() => removeDialog('alet-jackpot-opt')}
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
                id="confirm-dialog-confirm-cta"
                type="button"
                block
                onClick={() => handleConfirm(value)}
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
        </Grid>
      ),
    })
  }
  const raffleIds = new Set(
    playerOption?.content.map((item: any) => item.raffleId),
  )
  const filtroJackpot = playerOption?.content.map((item: any) => {
    if (raffleIds.has(item.raffleId)) {
      const matchingItem = jackpots?.content.find(
        (element: any) => element.id === item.raffleId,
      )
      return {
        playerOption: item,
        ...matchingItem,
      }
    }
    return item
  })
  const filtroExitJackpot = jackpots?.content.filter(
    (item: any) => !raffleIds.has(item.id),
  )
  return (
    <Grid gap="0.5rem">
      <Grid responsiveWidth={{ sm: 100, md: 'calc(100% - 0.25rem)' }}>
        <Grid margin="mb-2">
          <Typography
            weight={700}
            size="md"
            translateGroup="raffle-opt-in-Tab-table-title"
            translateKey="Jackpots race opted in history"
          />
        </Grid>
        <DataGridV2
          data={filtroJackpot || []}
          columns={columns}
          onRowClick={(row: any) => {
            setSelectJackpot(row)
            handleDisplayDialog(row)
          }}
          selectedId={selectJackpot?.id}
        />
        <Grid margin={['mb-2', 'mt-5']}>
          <Typography
            weight={700}
            size="md"
            translateGroup="raffle-opt-in-Tab-table-title"
            translateKey="Raffle never opted before"
          />
        </Grid>
        <DataGridV2
          data={filtroExitJackpot || []}
          columns={columns}
          onRowClick={(row: any) => {
            setSelectJackpot(row)
            handleDisplayDialog(row)
          }}
          selectedId={selectJackpot?.id}
        />
      </Grid>
    </Grid>
  )
}
