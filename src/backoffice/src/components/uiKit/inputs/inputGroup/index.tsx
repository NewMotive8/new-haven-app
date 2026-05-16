import React, {
  ChangeEventHandler,
  HTMLInputTypeAttribute,
  useState,
} from "react";
import Typography from "components/uiKit/typography";
import { globalData } from "pages/_app";
import Grid from "components/uiKit/grid";
import { typographySize } from "components/uiKit/typography/types";
import Checkbox from "./variants/checkbox";
import InputGroupDateTime from "./variants/date-time";
import ColorPicker from "./variants/color";
import styles from "./input.group.module.scss";
import { BsEye, BsEyeSlash } from "react-icons/bs";

export interface uiKitInputProps {
  label: string | undefined | any;
  value?: string | ReadonlyArray<string> | number | undefined | boolean;
  name: string;
  id: string;
  inputType?: HTMLInputTypeAttribute;
  onChange?: ChangeEventHandler<HTMLInputElement> | undefined;
  onFocus?: React.FocusEventHandler<HTMLInputElement> | undefined;
  status?: "error" | "success" | "warning" | "info" | "";
  inputProps?: React.DetailedHTMLProps<
    React.InputHTMLAttributes<HTMLInputElement>,
    HTMLInputElement
  >;
  feedback?: React.ReactNode;
  styles?: React.CSSProperties;
  noEditTranslation?: boolean;
  fontSize?: typographySize | Array<typographySize>;
  readOnly?: any;
  icon?: React.ReactNode;
  options?: { label: string; value: string | number }[];
}

const LabelContent: React.FC<{ label: any; icon?: React.ReactNode }> = ({
  label,
  icon,
}) => (
  <div className={styles["label-inner"]}>
    {icon && <span className={styles["label-icon"]}>{icon}</span>}
    {typeof label === "string" ? (
      <Typography
        translateGroup="input-group-label"
        translateKey={label}
        size="sm"
      />
    ) : (
      <>{label}</>
    )}
  </div>
);

export default function InputGroup(props: uiKitInputProps) {
  const {
    label,
    value,
    name,
    id,
    inputType: inputTypeProps,
    onChange,
    onFocus,
    status,
    inputProps,
    feedback,
    styles: stylesProps,
    noEditTranslation,
    fontSize,
    readOnly,
    icon,
  } = props;
  const [inputType, setInputType] = useState(inputTypeProps || "text");
  const { editTranslations } = globalData;

  function handleClick(e: React.MouseEvent<HTMLInputElement, MouseEvent>) {
    if (inputType === "date" || inputProps?.type === "date") {
      const { target }: any = e as any; // prevent eslint warn
      target.showPicker();
    }
    if (editTranslations && inputProps?.onClick) {
      if (e?.target === e?.currentTarget) {
        inputProps?.onClick(e);
      }
    } else if (inputProps?.onClick) {
      inputProps?.onClick(e);
    }
  }

  if (inputType === "checkbox") {
    return <Checkbox {...props} />;
  }
  if (inputType === "datetime-local") {
    // pass icon through
    return <InputGroupDateTime {...props} inputType="datetime-local" />;
  }
  if (inputType === "color") {
    return <ColorPicker {...props} value={`${value}`} />;
  }
if (inputType === "textarea") {
  return (
    <div
      data-status={status}
      data-font-size={fontSize || "sm"}
      className={styles["input-group-wrapper"]}
      style={{ ...stylesProps }}
    >
      <label>
        <textarea
          value={value as any}
          onChange={onChange as any}
          onFocus={onFocus}
          placeholder=" " 
          disabled={readOnly}
          name={name}
          id={id}
          rows={10}
          cols={50}
          {...(inputProps as any)}
        />
        <div className={styles["animated-label"]}>
          <LabelContent label={label} icon={icon} />
        </div>
      </label>
      {feedback && (
        <div className={styles.feedback}>
          <Typography size="xsm">{feedback}</Typography>
        </div>
      )}
    </div>
  );
}

if (inputType === "select" && props.options) {
  return (
    <div
      data-status={status}
      className={styles["input-group-wrapper"]}
    >
      <label>
        <select
          name={name}
          id={id}
          value={value as any}
          disabled={readOnly}
          onChange={(e) =>
            onChange?.(e as any)
          }
        >
          {props.options.map(opt => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        <div className={styles["animated-label"]}>
          <LabelContent label={label} icon={icon} />
        </div>
      </label>
    </div>
  )
}

  if (editTranslations && !noEditTranslation) {
    return (
      <Grid>
        <Grid className={styles["animated-label"]}>
          <LabelContent label={label} icon={icon} />
        </Grid>
        <input
          value={value as any}
          onChange={onChange}
          onFocus={onFocus}
          disabled={readOnly}
          name={name}
          id={id}
          {...inputProps}
          onClick={(e) => handleClick(e)}
          type={inputType || inputProps?.type || "text"}
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
    );
  }

  return (
    <div
      data-status={status}
      data-font-size={fontSize || "sm"}
      className={styles["input-group-wrapper"]}
      style={{ ...stylesProps }}>
      <label>
        <input
          value={value as any}
          onChange={onChange}
          onFocus={onFocus}
          placeholder={String(label)}
          disabled={readOnly}
          name={name}
          id={id}
          {...inputProps}
          onClick={(e) => handleClick(e)}
          type={inputType || inputProps?.type || "text"}
        />
        <div className={styles["animated-label"]}>
          <LabelContent label={label} icon={icon} />
        </div>
        {inputTypeProps === "password" && (
          <div
            className={styles["eye-icon"]}
            hidden={inputTypeProps !== "password"}>
            {inputType === "password" ? (
              <BsEye onClick={() => setInputType("text")} />
            ) : (
              <BsEyeSlash onClick={() => setInputType("password")} />
            )}
          </div>
        )}
      </label>
      {feedback && (
        <div className={styles.feedback}>
          <Typography size="xsm">{feedback}</Typography>
        </div>
      )}
    </div>
  );
}
