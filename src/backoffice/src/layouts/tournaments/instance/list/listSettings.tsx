import { dataGridColumnType } from 'components/uiKit/dataGridV3'
import React, { useContext } from 'react';
import CloneButton from 'components/cloneButton/CloneButton';
import { CrudContext } from "../../../../layouts/tournaments/instance/index";
import { BsPlayCircle, BsCheckCircle } from 'react-icons/bs';

export const columns: Array<dataGridColumnType> = [
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
  key: "state",
  uniqueId: "state",
  label: "State",
  filter: true,
  render: (value: string) => {
    if (value === "RUNNING") {
      return (
        <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <BsPlayCircle size={16} />
          {value}
        </span>
      );
    }

    if (value === "FINISHED") {
      return (
        <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <BsCheckCircle size={16} />
          {value}
        </span>
      );
    }

    return value; // fallback
  },
},




    {
    label: "Clone",
    key: "clone",
    uniqueId: "clone-btn",
    avoidRowClick: true,
    render: (...args: any[]) => {
      const { setSelectedItem, tournamentId } = useContext(CrudContext);
      const row = args.length === 1 ? args[0] : args[1];

      return (
        <CloneButton
          item={row}
          setSelectedItem={setSelectedItem}
          itemId={tournamentId}
        />
      );
    },
  },
];


