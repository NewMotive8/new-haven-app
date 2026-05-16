import React, { useContext, useEffect, useState } from 'react'
import Grid from 'components/uiKit/grid'
import { useQuery } from 'react-query'
import jackpotsApi from 'utils/services/api/requests/jackpots'
import DataGridV2 from 'components/uiKit/dataGridV2'
import DialogContext from 'context/dialog'
import Typography from 'components/uiKit/typography'
import Button from 'components/uiKit/buttons'
import playerOptinsApi, {
  playerOptinsI,
} from 'utils/services/api/requests/playerOptins'
import { CrudContext, FooterStatus } from '../../..'
import { columns } from './listSettings'

export default function JackpotTab() {
  const { handelerOptionSet, selectedItem } = useContext(CrudContext)
  const [selectJackpot, setSelectJackpot] = useState<any>()
  const { data: playerOption, refetch: playerOptionRefetch } = useQuery(
    ['playerOption', `${selectedItem?.id}`],
    () => playerOptinsApi.getByPlayer({
        playerId: selectedItem?.id, brandId: selectedItem?.brand?.id,
      }),
    { enabled: !!selectedItem?.id && !!selectedItem?.brand?.id },
  )
  const { data: jackpots, refetch: jackpotRefetch } = useQuery('jackpots', () => jackpotsApi.getItems())
  const { removeDialog, displayDialog } = useContext(DialogContext)

  useEffect(() => {
    handelerOptionSet({
      isCancel: false,
      isDelete: false,
      isSave: false,
    } as FooterStatus)
  }, [])
  function handleSuccess() {
    playerOptionRefetch()
    jackpotRefetch()
    setSelectJackpot(undefined)
    removeDialog('alet-jackpot-opt')
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
          jackpotId: value.id,
          player: selectedItem,
          optin: true,
        } as playerOptinsI,
        { successCallBack: handleSuccess },
      )
    }
  }

  function handleDisplayDialog(value: any) {
    displayDialog({
      dialogId: 'alet-jackpot-opt',
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
              translateGroup="jackpotTab-dialog-alert"
              translateKey="Attention!"
            />
          </Grid>
          <Grid horizontalAlgin="center">
            <Typography
              translateGroup="jackpotTab-dialog-alert"
              translateKey="jackpotTab-dialog-alert-text"
              weight={600}
              style={{ textAlign: 'center' }}
            />
          </Grid>
          <Grid horizontalAlgin="center" margin="mb-5">
            <Typography
              translateGroup="jackpotTab-dialog-alert"
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
  const jackpotIds = new Set(
    playerOption?.content.map((item: any) => item.jackpotId),
  )
  const filtroJackpot = playerOption?.content.map((item: any) => {
    if (jackpotIds.has(item.jackpotId)) {
      const matchingItem = jackpots?.content.find(
        (element: any) => element.id === item.jackpotId,
      )
      return {
        playerOption: item,
        ...matchingItem,
      }
    }
    return item
  })
  const filtroExitJackpot = jackpots?.content.filter(
    (item: any) => !jackpotIds.has(item.id),
  )
  return (
    <Grid gap="0.5rem">
      <Grid responsiveWidth={{ sm: 100, md: 'calc(100% - 0.25rem)' }}>
        <Grid margin="mb-2">
          <Typography
            weight={700}
            size="md"
            translateGroup="jackpotTab-table-title"
            translateKey="Jackpots opted in history"
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
            translateGroup="jackpotTab-table-title"
            translateKey="Jackpots never opted before"
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
