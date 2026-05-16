import BrandSelector from "components/selectors/brand";
import WheelSelector from "components/selectors/wheel";
import WheelRuleSelector from "components/selectors/wheelRule";
import { textTranslated } from "components/TextTranslated";
import Grid from "components/uiKit/grid";
import InputGroup from "components/uiKit/inputs/inputGroup";
import Toggle from "components/uiKit/inputs/Toggle";
import Typography from "components/uiKit/typography";
import DialogContext from "context/dialog";
import React, { useEffect, useState } from "react";
import { useBrand } from "utils/customHooks/useBrand";
import { brandI } from "utils/services/api/requests/brand";
import { FormContext } from "..";
import { LWRuleInstancesContext } from "../..";
import moment from 'moment';

export default function BasicTab() {
  const { selectedItem } = React.useContext(LWRuleInstancesContext);
  const { errors, updateField, setCurrentInfo } = React.useContext(FormContext);
  const [bandSelect, setBandSelect] = useState<brandI | null>(null);
  const { displayDialog, removeDialog } = React.useContext(DialogContext);
  const { brands, findBrand } = useBrand();
  useEffect(() => {
    setBandSelect(findBrand(selectedItem?.brandId));
  }, [selectedItem, brands]);

  function formatDateForInput(date?: string | Date, dateOnly = false) {
  const m = date ? moment(date) : moment();
  return dateOnly ? m.format('YYYY-MM-DD') : m.format('YYYY-MM-DDTHH:mm');
}

  function handleChooseBrand() {
    displayDialog({
      dialogId: "BRAND-SELECTOR",
      content: (
        <BrandSelector
          onChange={(brand: any) => {
            setBandSelect(brand);
            updateField("brandId", brand.id);
            removeDialog("BRAND-SELECTOR");
          }}
        />
      ),
      dialogProps: {
        disableOverlayClose: false,
        displayClose: false,
      },
    });
  }
  
  function handleChooseRule() {
    displayDialog({
      dialogId: "RULE-SELECTOR",
      content: (
        <WheelRuleSelector
          onChange={(brand: any) => {
            updateField("wheelRule", brand);
            removeDialog("RULE-SELECTOR");
          }}
        />
      ),
      dialogProps: {
        disableOverlayClose: false,
        displayClose: false,
      },
    });
  }
  function handleChooseWheel() {
    displayDialog({
      dialogId: "WHEEL-SELECTOR",
      content: (
        <WheelSelector
          onChange={(brand: any) => {
            updateField("wheel", brand);
            removeDialog("WHEEL-SELECTOR");
          }}
        />
      ),
      dialogProps: {
        disableOverlayClose: false,
        displayClose: false,
      },
    });
  }
  return (
    <Grid gap="0.5rem" verticalAlgin="flex-start">
      <Grid responsiveWidth={{ sm: 100, md: "calc(50% - 0.25rem)" }}>
        <InputGroup
          id="name"
          name="name"
          label="name"
          feedback={errors?.name}
          status={errors?.name && "error"}
          value={selectedItem.name}
          onChange={({ target }) => {
            updateField(target.name, target.value);
          }}
          onFocus={() =>
            setCurrentInfo(
              textTranslated({
                group: "forms-tabs-helpers",
                key: "input-name-help",
                returnDefault: "nothing",
              })
            )
          }
        />
      </Grid>
      <Grid responsiveWidth={{ sm: 100, md: "calc(50% - 0.25rem)" }}>
        <InputGroup
          id="variableInput"
          name="variableInput"
          label="variableInput"
          feedback={errors?.variableInput}
          status={errors?.variableInput && "error"}
          value={selectedItem.variableInput}
          onChange={({ target }) => {
            updateField(target.name, target.value);
          }}
          onFocus={() =>
            setCurrentInfo(
              textTranslated({
                group: "forms-tabs-helpers",
                key: "input-variableInput-help",
                returnDefault: "nothing",
              })
            )
          }
        />
      </Grid>
      <Grid
        responsiveWidth={{ sm: 100, md: "calc(50% - 0.25rem)" }}
        wrap="wrap"
        gap={"0.5rem"}>
        <Grid>
          <Typography
            translateGroup="input-group-label"
            translateKey={"brandId"}
            size="sm"
            weight={600}
            style={{
              transform: "scale(1.25) translateY(0%) translateX(10.3%)",
            }}
          />
        </Grid>
        <Grid
          onClick={() => handleChooseBrand()}
          style={{
            background: "var(--input-bg)",
            borderRadius: "0.5rem",
            padding: "0.25rem 0.5rem",
            cursor: "pointer",
          }}
          type="button">
          <Grid gap="0.5rem" verticalAlgin="center">
            <img
              src={bandSelect?.logo}
              alt="brand-logo"
              width="30px"
              height="30px"
              style={{ borderRadius: "50%", overflow: "hidden" }}
            />
            {bandSelect?.name ? (
              <Typography>{bandSelect?.name}</Typography>
            ) : (
              <Typography
                translateGroup="input-text-brandID"
                translateKey={"select-brandID"}
              />
            )}
          </Grid>
        </Grid>
      </Grid>
      <Grid
        responsiveWidth={{ sm: 100, md: "calc(50% - 0.25rem)" }}
        wrap="wrap"
        gap={"0.5rem"}>
        <Grid>
          <Typography
            translateGroup="input-group-label"
            translateKey={"wheel"}
            size="sm"
            weight={600}
            style={{
              transform: "scale(1.25) translateY(0%) translateX(10.3%)",
            }}
          />
        </Grid>
        <Grid
          onClick={() => handleChooseWheel()}
          style={{
            background: "var(--input-bg)",
            borderRadius: "0.5rem",
            padding: "0.5rem",
            cursor: "pointer",
          }}
          type="button">
          <Grid gap="0.5rem" verticalAlgin="center">
            {selectedItem?.wheel?.internalName ? (
              <Typography>{selectedItem?.wheel?.internalName}</Typography>
            ) : (
              <Typography
                translateGroup="input-text-rule"
                translateKey={"select-wheel"}
              />
            )}
          </Grid>
        </Grid>
      </Grid>
      <Grid
        responsiveWidth={{ sm: 100, md: "calc(50% - 0.25rem)" }}
        wrap="wrap"
        gap={"0.5rem"}>
        <Grid>
          <Typography
            translateGroup="input-group-label"
            translateKey={"wheelRule"}
            size="sm"
            weight={600}
            style={{
              transform: "scale(1.25) translateY(0%) translateX(10.3%)",
            }}
          />
        </Grid>
        <Grid
          onClick={() => handleChooseRule()}
          style={{
            background: "var(--input-bg)",
            borderRadius: "0.5rem",
            padding: "0.5rem",
            cursor: "pointer",
          }}
          type="button">
          <Grid gap="0.5rem" verticalAlgin="center">
            {selectedItem?.wheelRule?.name ? (
              <Typography>{selectedItem?.wheelRule?.name}</Typography>
            ) : (
              <Typography
                translateGroup="input-text-rule"
                translateKey={"select-rule"}
              />
            )}
          </Grid>
        </Grid>
      </Grid>

      <Grid responsiveWidth={{ sm: 100, md: "calc(50% - 0.25rem)" }}>
        <InputGroup
          id="startDate"
          name="startDate"
          label="property-startDate"
          inputType="datetime-local"
          feedback={errors?.startDate}
          status={errors?.startDate && "error"}
          value={
            selectedItem.startDate
              ? formatDateForInput(selectedItem.startDate)
              : formatDateForInput()
          }
          onChange={({ target }) => updateField(target.name, target.value)}
          onFocus={() =>
            setCurrentInfo(
              textTranslated({
                group: "forms-tabs-helpers",
                key: "input-property-startDate-help",
                returnDefault: "nothing",
              })
            )
          }
        />
      </Grid>
      <Grid responsiveWidth={{ sm: 100, md: "calc(50% - 0.25rem)" }}>
        <InputGroup
          id="expiryDate"
          name="expiryDate"
          label="property-expiryDate"
          inputType="datetime-local"
          feedback={errors?.expiryDate}
          status={errors?.expiryDate && "error"}
          value={
            selectedItem.expiryDate
              ? formatDateForInput(selectedItem.expiryDate)
              : formatDateForInput()
          }
          onChange={({ target }) => {
            updateField(target.name, target.value);
          }}
          onFocus={() =>
            setCurrentInfo(
              textTranslated({
                group: "forms-tabs-helpers",
                key: "input-property-expiryDate-help",
                returnDefault: "nothing",
              })
            )
          }
        />
      </Grid>
      <Grid responsiveWidth={{ sm: 100, md: "calc(50% - 0.25rem)" }}>
        <InputGroup
          id="createdDate"
          name="createdDate"
          label="property-createdDate"
          inputType="date"
          readOnly
          feedback={errors?.createdDate}
          status={errors?.createdDate && "error"}
          value={selectedItem.createdDate?.substring(0, 10) || ""}
          onChange={({ target }) => {
            updateField(target.name, target.value);
          }}
          onFocus={() =>
            setCurrentInfo(
              textTranslated({
                group: "forms-tabs-helpers",
                key: "input-property-createdDate-help",
                returnDefault: "nothing",
              })
            )
          }
        />
      </Grid>
      <Grid responsiveWidth={{ sm: 100, md: "calc(50% - 0.25rem)" }}>
        <Toggle
          label="enabled"
          name="enabled"
          id="enabled"
          value={selectedItem.enabled}
          onChange={({ target }) => {
            updateField(target.name, target.value);
          }}
        />
      </Grid>
    </Grid>
  );
}
