import React from "react";
import Grid from "components/uiKit/grid";
import { textTranslated } from "components/TextTranslated";
import InputGroup from "components/uiKit/inputs/inputGroup";
import ImageUpload from "components/uiKit/imageUpload";
import Toggle from "components/uiKit/inputs/Toggle";
import DialogContext from "context/dialog";
import CurrencySelector from "components/selectors/currency";
import OperatorSelector from "components/selectors/operator";
import TierSelector from "components/selectors/tier";
import AuthContext from "context/auth";
import { useQuery } from "react-query";
import userApi from "utils/services/api/requests/user";
import { FormContext } from "..";
import { CrudContext } from "../..";

export default function BasicTab() {
  const { selectedItem } = React.useContext(CrudContext);
  const { errors, updateField, setCurrentInfo } = React.useContext(FormContext);
  const { displayDialog, removeDialog } = React.useContext(DialogContext);
  const { isAuthenticated, token } = React.useContext(AuthContext);
  const { data, isLoading, error } = useQuery(
    ["account-info", token],
    userApi.getUserInfo,
    {
      enabled: !!isAuthenticated,
    }
  );

  function handleChooseCurrency() {
    displayDialog({
      dialogId: "CURRENCY-SELECTOR",
      content: (
        <CurrencySelector
          onChange={(currency) => {
            updateField("currency", currency.iso3);
            removeDialog("CURRENCY-SELECTOR");
          }}
        />
      ),
    });
  }

  return (
    <Grid gap="1.5rem" padding={["pb-5"]}>
      <Grid responsiveWidth={{ sm: 100, md: "calc(50% - 0.75rem)" }}>
        <InputGroup
          id="brandId"
          name="brandId"
          label="brandId"
          feedback={errors?.brandId}
          status={errors?.brandId && "error"}
          value={selectedItem.brandId}
          onChange={({ target }) => {
            updateField(target.name, target.value);
          }}
          onFocus={() =>
            setCurrentInfo(
              textTranslated({
                group: "forms-tabs-helpers",
                key: "input-brandId-help",
                returnDefault: "nothing",
              })
            )
          }
        />
      </Grid>
      <Grid responsiveWidth={{ sm: 100, md: "calc(50% - 0.75rem)" }}>
        <InputGroup
          id="name"
          name="name"
          label="brand-name"
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
      <Grid responsiveWidth={{ sm: 100, md: "calc(50% - 0.75rem)" }}>
        <InputGroup
          id="defaultLocale"
          name="defaultLocale"
          label="defaultLocale"
          feedback={errors?.defaultLocale}
          status={errors?.defaultLocale && "error"}
          value={selectedItem.defaultLocale}
          onChange={({ target }) => {
            updateField(target.name, target.value);
          }}
          onFocus={() =>
            setCurrentInfo(
              textTranslated({
                group: "forms-tabs-helpers",
                key: "input-defaultLocale-help",
                returnDefault: "nothing",
              })
            )
          }
        />
      </Grid>
      <Grid
        hidden={!selectedItem.id}
        gap="0.5rem"
        responsiveWidth={{ sm: 100, md: "calc(50% - 0.75rem)" }}>
        <InputGroup
          id="logo"
          name="logo"
          label="logo"
          feedback={errors?.logo}
          status={errors?.logo && "error"}
          value={selectedItem.logo}
          onChange={({ target }) => {
            updateField(target.name, target.value);
          }}
          onFocus={() =>
            setCurrentInfo(
              textTranslated({
                group: "forms-tabs-helpers",
                key: "input-logo-help",
                returnDefault: "nothing",
              })
            )
          }
        />
        <ImageUpload
          hiddenInput
          fileName={`logos/${selectedItem.name}/logo`}
          id="logo"
          name="logo"
          label="logo"
          feedback={errors?.logo}
          status={errors?.logo && "error"}
          value={selectedItem.logo}
          onChange={({ target }) => {
            updateField(target.name, target.value);
          }}
          onFocus={() =>
            setCurrentInfo(
              textTranslated({
                group: "forms-tabs-helpers",
                key: "input-logo-help",
                returnDefault: "nothing",
              })
            )
          }
        />
      </Grid>
      <Grid gap="1.5rem" padding={["pt-5", "pb-5"]}>
        <Toggle
          id="enabled"
          name="enabled"
          label="enabled"
          value={selectedItem.enabled}
          onChange={({ target }) => {
            updateField(target.name, target.value);
          }}
          onFocus={() =>
            setCurrentInfo(
              textTranslated({
                group: "forms-tabs-helpers",
                key: "input-enabled-help",
                returnDefault: "nothing",
              })
            )
          }
          displayInfo={
            !!textTranslated({
              group: "forms-tabs-helpers",
              key: "input-enabled-help",
              returnDefault: "nothing",
            })
          }
        />
        <Toggle
          id="hasWorkflow"
          name="hasWorkflow"
          label="hasWorkflow"
          value={selectedItem.hasWorkflow}
          onChange={({ target }) => {
            updateField(target.name, target.value);
          }}
          onFocus={() =>
            setCurrentInfo(
              textTranslated({
                group: "forms-tabs-helpers",
                key: "input-hasWorkflow-help",
                returnDefault: "nothing",
              })
            )
          }
          displayInfo={
            !!textTranslated({
              group: "forms-tabs-helpers",
              key: "input-hasWorkflow-help",
              returnDefault: "nothing",
            })
          }
        />
        <Toggle
          id="operatorOnly"
          name="operatorOnly"
          label="operatorOnly"
          value={selectedItem.operatorOnly}
          onChange={({ target }) => {
            updateField(target.name, target.value);
          }}
          onFocus={() =>
            setCurrentInfo(
              textTranslated({
                group: "forms-tabs-helpers",
                key: "input-operatorOnly-help",
                returnDefault: "nothing",
              })
            )
          }
          displayInfo={
            !!textTranslated({
              group: "forms-tabs-helpers",
              key: "input-operatorOnly-help",
              returnDefault: "nothing",
            })
          }
        />
        <Toggle
          id="hasWithdrawApproval"
          name="hasWithdrawApproval"
          label="hasWithdrawApproval"
          value={selectedItem.hasWithdrawApproval}
          onChange={({ target }) => {
            updateField(target.name, target.value);
            if (target.value) {
              updateField("hasManualWins", false);
            }
          }}
          onFocus={() =>
            setCurrentInfo(
              textTranslated({
                group: "forms-tabs-helpers",
                key: "input-hasWithdrawApproval-help",
                returnDefault: "nothing",
              })
            )
          }
          displayInfo={
            !!textTranslated({
              group: "forms-tabs-helpers",
              key: "input-hasWithdrawApproval-help",
              returnDefault: "nothing",
            })
          }
        />
      </Grid>
      <Grid responsiveWidth={{ sm: 100, md: "calc(50% - 0.75rem)" }}>
        <InputGroup
          id="pushDelay"
          name="pushDelay"
          label="pushDelay"
          feedback={errors?.pushDelay}
          status={errors?.pushDelay && "error"}
          value={selectedItem.pushDelay}
          onChange={({ target }) => {
            updateField(target.name, target.value);
          }}
          onFocus={() =>
            setCurrentInfo(
              textTranslated({
                group: "forms-tabs-helpers",
                key: "input-pushDelay-help",
                returnDefault: "nothing",
              })
            )
          }
        />
      </Grid>
      <Grid responsiveWidth={{ sm: 100, md: "calc(50% - 0.75rem)" }}>
        <InputGroup
          id="currency"
          name="currency"
          label="currency"
          feedback={errors?.currency}
          status={errors?.currency && "error"}
          value={selectedItem.currency}
          onChange={({ target }) => {
            updateField(target.name, target.value);
          }}
          onFocus={() => {
            handleChooseCurrency();
          }}
          inputProps={{
            readOnly: true,
            onMouseEnter: () =>
              setCurrentInfo(
                textTranslated({
                  group: "forms-tabs-helpers",
                  key: "input-jackpot-currency-help",
                  returnDefault: "nothing",
                })
              ),
          }}
        />
      </Grid>
      <Grid responsiveWidth={{ sm: 100, md: "calc(50% - 0.75rem)" }}>
        <InputGroup
          id="numberOfWinsSafeguard"
          name="numberOfWinsSafeguard"
          label="numberOfWinsSafeguard"
          feedback={errors?.numberOfWinsSafeguard}
          status={errors?.numberOfWinsSafeguard && "error"}
          value={selectedItem.numberOfWinsSafeguard}
          onChange={({ target }) => {
            updateField(target.name, target.value);
          }}
          onFocus={() =>
            setCurrentInfo(
              textTranslated({
                group: "forms-tabs-helpers",
                key: "input-numberOfWinsSafeguard-help",
                returnDefault: "nothing",
              })
            )
          }
          inputType="number"
        />
      </Grid>
      <Grid responsiveWidth={{ sm: 100, md: "calc(50% - 0.75rem)" }}>
        <InputGroup
          id="maximumPayoutSafeguard"
          name="maximumPayoutSafeguard"
          label="maximumPayoutSafeguard"
          feedback={errors?.maximumPayoutSafeguard}
          status={errors?.maximumPayoutSafeguard && "error"}
          value={selectedItem.maximumPayoutSafeguard}
          onChange={({ target }) => {
            updateField(target.name, target.value);
          }}
          onFocus={() =>
            setCurrentInfo(
              textTranslated({
                group: "forms-tabs-helpers",
                key: "input-maximumPayoutSafeguard-help",
                returnDefault: "nothing",
              })
            )
          }
          inputType="number"
        />
      </Grid>
      <Grid
        hidden={data?.role !== "ROOT"}
        responsiveWidth={{ sm: 100, md: "calc(50% - 0.75rem)" }}>
        <OperatorSelector
          id="operator"
          name="operator"
          label="operator"
          feedback={errors?.operator}
          status={errors?.operator && "error"}
          value={selectedItem.operator}
          onChange={({ target }) => {
            updateField(target.name, target.value);
          }}
          inputProps={{
            onMouseEnter: () =>
              setCurrentInfo(
                textTranslated({
                  group: "forms-tabs-helpers",
                  key: "input-jackpot-operator-help",
                  returnDefault: "nothing",
                })
              ),
          }}
        />
      </Grid>
      <Grid responsiveWidth={{ sm: 100, md: "calc(50% - 0.75rem)" }}>
        <InputGroup
          id="minimumApprovalAmount"
          name="minimumApprovalAmount"
          label="Minimum Approval Amount"
          feedback={errors?.minimumApprovalAmount}
          status={errors?.minimumApprovalAmount && "error"}
          value={selectedItem.minimumApprovalAmount}
          onChange={({ target }) => {
            const value = target.value;
            // Only allow numeric input with optional decimal
            if (!/^\d*\.?\d*$/.test(value)) return;

            // Prevent negative values
            if (Number(value) < 0) {
              updateField(target.name, 0);
            } else {
              updateField(target.name, value);
            }
          }}
          onFocus={() =>
            setCurrentInfo(
              textTranslated({
                group: "forms-tabs-helpers",
                key: "input-minimumApprovalAmount-help",
                defaultContent:
                  "Enter the minimum approval amount (0 or greater)",
              })
            )
          }
          inputType="text" // keeps it flexible for decimal input
        />
      </Grid>
    </Grid>
  );
}
