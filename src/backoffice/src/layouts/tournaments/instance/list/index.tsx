import React, { useContext } from "react";
import { BsPlusCircle } from "react-icons/bs";
import Typography from "components/uiKit/typography";
import Button from "components/uiKit/buttons";
import Grid from "components/uiKit/grid";
import DataGridV3 from "components/uiKit/dataGridV3";
import instanceApi from "utils/services/api/requests/tournament-api/instance";
import { CrudContext } from "..";
import { columns } from "./listSettings";

function createNewInstanceWithDefaults(tournamentId: number) {
  const now = new Date().toISOString();
  return {
    ...instanceApi.defaultItem,
    tournamentId,
    notifyTime: now,
    startTime: now,
    endTime: now,
  };
}

export default function ListCrud() {
  const { refreshState, setSelectedItem, tournamentId } =
    useContext(CrudContext);

  return (
    <>
      {/* Button to add jaskpot instance */}
      <Grid horizontalAlgin="flex-end" margin="mb-3">
        <Button
          id="add-item-button"
          onClick={() => {
            if (tournamentId === undefined) return; // or show an error/toast
            setSelectedItem(createNewInstanceWithDefaults(tournamentId));
          }}
          color="primary">
          <Grid
            wrap="nowrap"
            gap="0.25rem"
            horizontalAlgin="center"
            verticalAlgin="center">
            <BsPlusCircle />
            <Typography
              translateGroup="jackpot-race-instance"
              translateKey="add"
              weight={600}
            />
          </Grid>
        </Button>
      </Grid>
      <DataGridV3
        onRowClick={(row: any) => setSelectedItem(row)}
        columns={columns}
        dataService={async (p) => {
          const filterExp = tournamentId
            ? p?.filterExp
              ? `${p.filterExp}[and]tournament.id$eq=${tournamentId}`
              : `tournament.id$eq=${tournamentId}`
            : p?.filterExp;
          const result = await instanceApi.getItems({ ...p, filterExp });

    return result;
        }}
        dataGridId={`instance-${refreshState}`}
        enablePagination
      />
    </>
  );
}
