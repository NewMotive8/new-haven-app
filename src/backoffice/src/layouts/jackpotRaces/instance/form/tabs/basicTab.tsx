import React from "react";
import Grid from "components/uiKit/grid";
import InputGroup from "components/uiKit/inputs/inputGroup";
import { CrudContext } from "../..";
import { FormContext } from "..";
import Typography from "components/uiKit/typography";
import GenericSelector from "components/selectors/generic";
import jackpotRaceApi from "utils/services/api/requests/jackpot-race-api/jackpotRace";
import { FaBell, FaReact, FaTrophy } from "react-icons/fa";
import {
  MdDriveFileRenameOutline,
  MdOutlineTimerOff,
  MdTimer,
} from "react-icons/md";
import { TbHexagon5Filled } from "react-icons/tb";

export default function BasicTab() {
  const { selectedItem, spinSprintId } = React.useContext(CrudContext);
  const { errors, updateField } = React.useContext(FormContext);

  const reactIcon = <FaReact />;

  return (
    <Grid gap="1rem" verticalAlgin="flex-start">
      <Grid>
        <InputGroup
          id="name"
          name="name"
          label="jackpot-race-instance-name"
          icon={<MdDriveFileRenameOutline size={16} />}
          feedback={<Typography {...errors?.name} />}
          status={errors?.name && "error"}
          value={selectedItem?.name}
          onChange={({ target }) => {
            updateField(target.name, target.value);
          }}
        />
      </Grid>
      <Grid>
        <Grid hidden={!!spinSprintId}>
          <GenericSelector
            columns={["id", "name"]}
            onSelect={(value) => updateField("spinSprintId", value.id)}
            label="jackpot race id"
            mainlyKey="name"
            dataService={(p) => jackpotRaceApi.getItems(p)}
            dataServiceId="jackpot-race"
            value={selectedItem.spinSprintId}
          />
        </Grid>
      </Grid>
      <Grid>
        <InputGroup
          id="notifyTime"
          name="notifyTime"
          label="notifyTime"
          icon={<FaBell size={16} />}
          inputType="datetime-local"
          feedback={<Typography {...errors?.notifyTime} />}
          status={errors?.notifyTime && "error"}
          value={selectedItem?.notifyTime}
          onChange={({ target }) => {
            updateField(target.name, target.value);
            if (!selectedItem.startTime) {
              updateField("startTime", target.value);
            }
            if (!selectedItem.endTime) {
              updateField("endTime", target.value);
            }
          }}
        />
      </Grid>
      <Grid gap="0.5rem">
        <Grid>
          <InputGroup
            id="startTime"
            name="startTime"
            label="startTime"
            icon={<MdTimer size={16} />}
            inputType="datetime-local"
            feedback={<Typography {...errors?.startTime} />}
            status={errors?.startTime && "error"}
            value={selectedItem?.startTime}
            onChange={({ target }) => {
              updateField(target.name, target.value);
            }}
          />
        </Grid>
        <Grid>
          <InputGroup
            id="endTime"
            name="endTime"
            label="endTime"
            icon={<MdOutlineTimerOff size={16} />}
            inputType="datetime-local"
            feedback={<Typography {...errors?.endTime} />}
            status={errors?.endTime && "error"}
            value={selectedItem?.endTime}
            onChange={({ target }) => {
              updateField(target.name, target.value);
            }}
          />
        </Grid>
      </Grid>
      <Grid>
        <InputGroup
          id="numberOfWins"
          name="numberOfWins"
          label="numberOfWins"
          icon={<FaTrophy size={16} />}
          inputType="number"
          feedback={<Typography {...errors?.numberOfWins} />}
          status={errors?.numberOfWins && "error"}
          value={selectedItem?.numberOfWins}
          onChange={({ target }) => {
            updateField(target.name, target.value);
          }}
        />
      </Grid>
      <Grid>
        <InputGroup
          id="minimumBetSize"
          name="minimumBetSize"
          label="minimumBetSize"
          icon={<TbHexagon5Filled size={16} />}
          inputType="number"
          feedback={<Typography {...errors?.minimumBetSize} />}
          status={errors?.minimumBetSize && "error"}
          value={selectedItem?.minimumBetSize}
          onChange={({ target }) => {
            updateField(target.name, target.value);
          }}
        />
      </Grid>
    </Grid>
  );
}
