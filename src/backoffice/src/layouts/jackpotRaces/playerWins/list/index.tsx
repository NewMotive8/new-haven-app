import React, { useContext, useRef, useState } from "react";
import { BsPlusCircle } from "react-icons/bs";
import Typography from "components/uiKit/typography";
import Button from "components/uiKit/buttons";
import Grid from "components/uiKit/grid";
import DataGridV3 from "components/uiKit/dataGridV3";
import playerWinsApi from "utils/services/api/requests/jackpot-race-api/playerWins";
import { CrudContext } from "..";
import { columns } from "./listSettings";
import BrandContext from 'context/brand'
import { BsDownload } from 'react-icons/bs'
import { toastError, toastSuccess } from 'utils/functions/notifications'
import { textTranslated } from "components/TextTranslated";

export default function ListCrud() {
  const { refreshState, setSelectedItem, selectedItem } =
    useContext(CrudContext);
  const { brandId } = useContext(BrandContext)
  const [loading, setLoading] = useState(false)
  const [dateFilterToken, setDateFilterToken] = useState('')
  const exportQueryRef = useRef<{ filterExp?: string; sort?: string }>({})

  const handleExport = async () => {
    if (!brandId) return

    setLoading(true)
    try {
      await playerWinsApi.exportCsvByEmail(brandId, exportQueryRef.current)

      toastSuccess(
        textTranslated({
          group: 'toast-notifications',
          key: 'export-sent-to-email',
        }) || 'The list was sent to your email.'
      )
    } catch (error) {
      toastError(
        textTranslated({
          group: 'toast-notifications',
          key: 'generic-error-message',
        }) || 'Something went wrong.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Grid horizontalAlgin="flex-end" margin="mb-3">
        <Button
          id="export-csv-button"
          color="primary"
          onClick={handleExport}
          disabled={!brandId || loading}
        >
          <Grid
            wrap="nowrap"
            gap="0.25rem"
            horizontalAlgin="center"
            verticalAlgin="center"
          >
            <BsDownload />
            <Typography
              translateGroup="global"
              translateKey="Export-CSV"
              weight={600}
            />
          </Grid>
        </Button>
      </Grid>
      <DataGridV3
        onRowClick={(row: any) => setSelectedItem(row)}
        columns={columns}
        dataService={async (p) => {
          let filterExp = p?.filterExp;

          if (filterExp?.includes("brandPlayerId")) {
            filterExp = filterExp.replace(
              /(^|\[and\])brandPlayerId/g,
              "$1player.brandPlayerId"
            );
          }
          const response = await playerWinsApi.getItems({
            ...p,
            filterExp,
          });
          exportQueryRef.current = {
            filterExp,
            sort: p?.sort || "",
          };

          return response
        }}
        dataGridId={`playerWins-${refreshState}-${dateFilterToken}`}
        enablePagination
        onFilterChange={() => setDateFilterToken(`${Date.now()}`)}
      />
    </>
  );
}
