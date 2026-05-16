import Typography from "components/uiKit/typography";
import React, {
  ChangeEventHandler,
  HTMLInputTypeAttribute,
  useState,
} from "react";
import { globalData } from "pages/_app";
import Grid from "components/uiKit/grid";
import { typographySize } from "components/uiKit/typography/types";
import moment from "moment";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import datepickerStyles from "./datepicker.module.scss";
import SelectGroup from "components/uiKit/inputs/selectGroup";
import styles from "./input.group.module.scss";
import { uiKitInputProps } from "../..";
import { useThemeWatcher } from "utils/customHooks";
import {
  fromUTCISOStringToLocalDate,
  toUTCDatePreserveTime,
} from "utils/datetime";

interface Props extends uiKitInputProps {
  icon?: React.ReactNode;
  isDarkMode?: boolean;
}

const LabelContent = ({
  icon,
  label,
}: {
  icon?: React.ReactNode;
  label: any;
}) => (
  <span className={styles["label-inner"]}>
    {icon && <span className={styles["label-icon"]}>{icon}</span>}
    {typeof label === "string" ? (
      <Typography
        translateGroup="input-group-label"
        translateKey={label}
        size="sm"
        style={{ whiteSpace: "nowrap" }}
      />
    ) : (
      label
    )}
  </span>
);

export default function InputGroupDateTime(props: Props) {
  const {
    label,
    value,
    name,
    id,
    inputType: inputTypeProps,
    onChange,
    status,
    inputProps,
    feedback,
    styles: stylesProps,
    noEditTranslation,
    fontSize,
    onFocus,
    icon,
    isDarkMode = false,
  } = props;

  const { editTranslations } = globalData;

  // DatePicker state
  const initialDate = value
    ? fromUTCISOStringToLocalDate(value as string)
    : new Date();
  const [selectedDate, setSelectedDate] = useState<Date | null>(initialDate);
  const theme = useThemeWatcher();

  React.useEffect(() => {
    if (value) {
      setSelectedDate(fromUTCISOStringToLocalDate(value as string));
    }
  }, [value]);

  React.useEffect(() => {
    if (onChange && selectedDate) {
      const utcDate = toUTCDatePreserveTime(selectedDate);
      onChange({
        target: {
          id,
          name,
          value: utcDate.toISOString(),
        },
      } as any);
    }
  }, [selectedDate]);

  if (inputProps?.readOnly) {
    return (
      <Grid className={styles["animated-label"]}>
        <Typography size="sm">
          {selectedDate ? moment(selectedDate).format("DD/MM/yyyy HH:mm:ss") : ""} UTC
        </Typography>
      </Grid>
    );
  }

  return (
    <>
      {editTranslations && !noEditTranslation ? (
        <Grid>
          <Grid className={styles["animated-label"]}>
            <LabelContent icon={icon} label={label} />
          </Grid>
          <DatePicker
            selected={selectedDate}
            onChange={(date: Date | null, event?: React.SyntheticEvent<any> | undefined) => setSelectedDate(date)}
            showTimeSelect
            dateFormat="Pp"
            className={datepickerStyles.input}
            wrapperClassName={
              theme === "dark" 
                ? datepickerStyles.dark + " dark-datepicker"
                : datepickerStyles.light + " light-datepicker"
            }
            // Do not pass inputProps.onChange to DatePicker
            {...(inputProps ? Object.fromEntries(Object.entries(inputProps).filter(([key]) => key !== 'onChange')) : {})}
          />
          <div
            data-status={status}
            data-font-size={fontSize || "sm"}
            className={styles["input-group-wrapper"]}
            style={{ ...stylesProps }}>
            {feedback && (
              <div className={styles.feedback}>
                <Typography size="xsm">{feedback}</Typography>
              </div>
            )}
          </div>
        </Grid>
      ) : (
        <div
          data-status={status}
          data-font-size={fontSize || "sm"}
          className={styles["input-group-wrapper"]}
          style={{ ...stylesProps }}>
          <Grid gap="0.25rem" verticalAlgin="flex-start">
            <Grid>
              <label>
                <div
                  className={styles["animated-label"]}
                  style={{ whiteSpace: "nowrap" }}>
                  <LabelContent icon={icon} label={label} />
                  <Typography size="sm" style={{ whiteSpace: "nowrap" }}>
                    {selectedDate ? moment(selectedDate).format("DD/MM/yyyy HH:mm:ss") : ""} UTC
                  </Typography>
                </div>
              </label>
            </Grid>
            <Grid responsiveWidth={{ sm: 100, lg: "calc(40% - 0.125rem)" }}>
              <DatePicker
                selected={selectedDate}
                onChange={(date: Date | null, event?: React.SyntheticEvent<any> | undefined) => setSelectedDate(date)}
                showTimeSelect
                dateFormat="Pp"
                className={datepickerStyles.input}
                wrapperClassName={
                  isDarkMode
                    ? datepickerStyles.dark + " dark-datepicker"
                    : datepickerStyles.light + " light-datepicker"
                }
                // Do not pass inputProps.onChange to DatePicker
                {...(inputProps ? Object.fromEntries(Object.entries(inputProps).filter(([key]) => key !== 'onChange')) : {})}
              />
            </Grid>
          </Grid>
          {feedback && (
            <div className={styles.feedback}>
              <Typography size="xsm">{feedback}</Typography>
            </div>
          )}
        </div>
      )}
    </>
  );
}
