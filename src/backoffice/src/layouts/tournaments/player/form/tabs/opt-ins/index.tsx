import React, { useContext, useState } from 'react'
import Grid from 'components/uiKit/grid'
import { useQuery } from 'react-query'
import DataGridV2 from 'components/uiKit/dataGridV2'
import DialogContext from 'context/dialog'
import Typography from 'components/uiKit/typography'
import Button from 'components/uiKit/buttons'
import playerOptinsApi, { playerOptinsI } from 'utils/services/api/requests/tournament-api/playerOptins'
import { CrudContext } from '../../..'
import { columns } from './listSettings'
import tournamentRaceApi from 'utils/services/api/requests/tournament-api/tournamentRace'

export default function OptInTab() {
  const { selectedItem } = useContext(CrudContext)
  const [selectTournament, setSelectTournament] = useState<any>()

  const { data: playerOption, refetch: playerOptionRefetch } = useQuery(
    ['playerOption', `${selectedItem?.id}`],
    () => playerOptinsApi.getByPlayer({
      playerId: selectedItem?.id, brandId: selectedItem?.brand?.id,
    }),
    { enabled: !!selectedItem?.id && !!selectedItem?.brand?.id },
  )

  const { data: tournaments, refetch: tournamentRefetch } = useQuery('tournament-races', () => tournamentRaceApi.getItems())
  const { removeDialog, displayDialog } = useContext(DialogContext)


  function handleSuccess() {
    playerOptionRefetch()
    tournamentRefetch()
    setSelectTournament(undefined)
    removeDialog('alert-tournament-opt')
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
          tournamentId: value.id,
          player: selectedItem,
          optin: true,
        } as playerOptinsI,
        { successCallBack: handleSuccess },
      )
    }
  }

  function handleDisplayDialog(value: any) {
    displayDialog({
      dialogId: 'alert-tournament-opt',
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
              translateGroup="tournament-race-opt-in-Tab-dialog-alert"
              translateKey="Attention!"
            />
          </Grid>
          <Grid horizontalAlgin="center">
            <Typography
              translateGroup="tournament-race-opt-in-Tab-dialog-alert"
              translateKey="tournamentTab-dialog-alert-text"
              weight={600}
              style={{ textAlign: 'center' }}
            />
          </Grid>
          <Grid horizontalAlgin="center" margin="mb-5">
            <Typography
              translateGroup="tournament-race-opt-in-Tab-dialog-alert"
              translateKey="tournamentTab-dialog-alert-question"
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
                onClick={() => removeDialog('alert-tournament-opt')}
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
  const tournamentsIds = new Set(
    playerOption?.content.map((item: any) => item.tournamentId),
  )
  const filtroTournament = playerOption?.content.map((item: any) => {
    if (tournamentsIds.has(item.tournamentId)) {
      const matchingItem = tournaments?.content.find(
        (element: any) => element.id === item.tournamentId,
      )
      return {
        playerOption: item,
        ...matchingItem,
      }
    }
    return item
  })
  const filtroExitTournament = tournaments?.content.filter(
    (item: any) => !tournamentsIds.has(item.id),
  )
  return (
    <Grid gap="0.5rem">
      <Grid responsiveWidth={{ sm: 100, md: 'calc(100% - 0.25rem)' }}>
        <Grid margin="mb-2">
          <Typography
            weight={700}
            size="md"
            translateGroup="tournament-race-opt-in-Tab-table-title"
            translateKey="Tournament race opted in history"
          />
        </Grid>
        <DataGridV2
          data={filtroTournament || []}
          columns={columns}
          onRowClick={(row: any) => {
            setSelectTournament(row)
            handleDisplayDialog(row)
          }}
          selectedId={selectTournament?.id}
        />
        <Grid margin={['mb-2', 'mt-5']}>
          <Typography
            weight={700}
            size="md"
            translateGroup="tournament-race-opt-in-Tab-table-title"
            translateKey="Tournament race never opted before"
          />
        </Grid>
        <DataGridV2
          data={filtroExitTournament || []}
          columns={columns}
          onRowClick={(row: any) => {
            setSelectTournament(row)
            handleDisplayDialog(row)
          }}
          selectedId={selectTournament?.id}
        />
      </Grid>
    </Grid>
  )
}
