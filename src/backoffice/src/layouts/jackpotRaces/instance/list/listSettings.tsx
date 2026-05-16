import { dataGridColumnType } from 'components/uiKit/dataGridV3'
import React, { useContext } from "react";
import CloneButton from 'components/cloneButton/CloneButton';
import { CrudContext } from "../../../../layouts/jackpotRaces/instance/index";

interface BuildColumnsProps {
  selectedInstanceIds: number[];
  onToggleSelectInstance: (instanceId: number, checked: boolean) => void;
}

function CloneCell({ row }: { row: any }) {
  const { setSelectedItem, spinSprintId } = useContext(CrudContext);

  return (
    <CloneButton
      item={row}
      setSelectedItem={setSelectedItem as (item: any) => void}
      itemId={spinSprintId}
    />
  );
}

export function buildColumns({
  selectedInstanceIds,
  onToggleSelectInstance,
}: BuildColumnsProps): Array<dataGridColumnType> {
  return [
    {
      key: 'select',
      uniqueId: 'select-instance',
      label: '',
      avoidRowClick: true,
      style: { width: '56px' },
      render: (_: any, row: any) => {
        const rowId = Number(row?.id);
        const isChecked = Number.isFinite(rowId) && selectedInstanceIds.includes(rowId);
        return (
          <input
            id={`select-instance-${rowId}`}
            type="checkbox"
            checked={isChecked}
            onChange={(event) => onToggleSelectInstance(rowId, event.target.checked)}
            onClick={(event) => event.stopPropagation()}
          />
        );
      },
    },
    {
      key: 'id',
      uniqueId: 'id',
      label: 'Id',
      filter: true,
    },
    {
      key: 'name',
      uniqueId: 'name',
      label: 'Name',
      filter: true,
    },
    {
      label: "Clone",
      key: "clone",
      uniqueId: "clone-btn",
      avoidRowClick: true,
      render: (...args: any[]) => {
        const row = args.length === 1 ? args[0] : args[1];
        return <CloneCell row={row} />;
      },
    },
  ];
}
