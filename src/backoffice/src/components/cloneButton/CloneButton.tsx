import React from "react";
import Button from "components/uiKit/buttons";
import { useThemeWatcher } from "utils/customHooks";
import moment from "moment";

interface CloneButtonProps {
  item: any;
  itemId: string | number | undefined;
  setSelectedItem: (item: any) => void;
}

const CloneButton: React.FC<CloneButtonProps> = ({
  item,
  itemId,
  setSelectedItem,
}) => {
  const theme = useThemeWatcher();

  const handleClone = () => {
    if (itemId === undefined) {
      console.warn("Cannot clone: itemId undefined");
      return;
    }
    const now = moment().toISOString();

    const clonedItem = {
      ...item,
      id: undefined,
      name: `Clone of ${item.name}`,
      notifyTime: now,
      startTime: now,
      endTime: now,
      itemId,
      wins: [],
    };

    setSelectedItem(clonedItem);
  };

  return (
    <Button
      onClick={handleClone}
      id="clone-button"
      color={theme === "dark" ? "primary-full" : "primary"}
    >
      Clone
    </Button>
  );
};

export default CloneButton;
