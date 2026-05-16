import React, { useContext, useEffect, useMemo, useState } from "react";
import { BsPlusCircle } from "react-icons/bs";
import Card from "components/cards/card";
import Typography from "components/uiKit/typography";
import Button from "components/uiKit/buttons";
import Grid from "components/uiKit/grid";
import DataGridV3 from "components/uiKit/dataGridV3";
import InputGroup from "components/uiKit/inputs/inputGroup";
import SelectGroup from "components/uiKit/inputs/selectGroup";
import { externalDialogCall } from "context/dialog";
import { toastError, toastSuccess } from "utils/functions/notifications";
import instanceApi, {
  SpinSprintBulkCadence,
  SpinSprintBulkGenerateFailure,
} from "utils/services/api/requests/jackpot-race-api/instance";
import { CrudContext } from "..";
import { buildColumns } from "./listSettings";

const BULK_GENERATE_DIALOG_ID = "SPINSPRINT-BULK-GENERATE";
const BULK_FAILURES_DIALOG_ID = "SPINSPRINT-BULK-GENERATE-FAILURES";
const MAX_BULK_COUNT = 366;

interface BulkGenerateFormErrors {
  count?: string;
  timezone?: string;
}

interface BulkGenerateDialogProps {
  selectedInstanceIds: number[];
  onSuccess: (response: {
    created: number;
    skipped: number;
    failures: SpinSprintBulkGenerateFailure[];
  }) => void;
}

function getDefaultTimezone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch (error) {
    return "UTC";
  }
}

function isValidTimezone(timezone: string) {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: timezone });
    return true;
  } catch (error) {
    return false;
  }
}

function extractErrorMessage(error: any) {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.title ||
    error?.message ||
    "Unable to bulk generate SpinSprint instances."
  );
}

function openBulkFailureDialog(failures: SpinSprintBulkGenerateFailure[]) {
  externalDialogCall.displayDialog({
    dialogId: BULK_FAILURES_DIALOG_ID,
    content: (
      <Card
        color="secondary"
        padding={["p-3", "pt-5"]}
        style={{
          width: "860px",
          maxWidth: "calc(100vw - 2rem)",
          maxHeight: "calc(100dvh - 4rem)",
          overflow: "auto",
        }}
      >
        <Grid margin="mb-3">
          <Typography weight={700} size="lg">
            SpinSprint bulk generation failures
          </Typography>
        </Grid>
        <Grid margin="mb-4">
          <Typography size="sm">
            The following SpinSprint Instances could not be created.
          </Typography>
        </Grid>
        <Grid
          style={{
            border: "1px solid var(--theme-border-color)",
            borderRadius: "4px",
            overflow: "hidden",
          }}
        >
          <Grid
            wrap="nowrap"
            padding={["p-2"]}
            style={{ background: "var(--option-hover-bg)" }}
          >
            <Grid width={17}>
              <Typography weight={700} size="sm">
                Source ID
              </Typography>
            </Grid>
            <Grid width={17}>
              <Typography weight={700} size="sm">
                Occurrence
              </Typography>
            </Grid>
            <Grid width={26}>
              <Typography weight={700} size="sm">
                Target Start Time
              </Typography>
            </Grid>
            <Grid width={40}>
              <Typography weight={700} size="sm">
                Reason
              </Typography>
            </Grid>
          </Grid>
          {failures.map((failure, index) => (
            <Grid
              key={`bulk-failure-${failure.sourceInstanceId}-${failure.occurrenceIndex}-${index}`}
              wrap="nowrap"
              padding={["p-2"]}
              style={{ borderTop: "1px solid var(--theme-border-color)" }}
            >
              <Grid width={17}>
                <Typography size="sm">
                  {failure.sourceInstanceId ?? "-"}
                </Typography>
              </Grid>
              <Grid width={17}>
                <Typography size="sm">
                  {failure.occurrenceIndex ?? "-"}
                </Typography>
              </Grid>
              <Grid width={26}>
                <Typography size="sm">
                  {failure.plannedStartTime ?? "-"}
                </Typography>
              </Grid>
              <Grid width={40}>
                <Typography size="sm">{failure.message || "-"}</Typography>
              </Grid>
            </Grid>
          ))}
        </Grid>
        <Grid horizontalAlgin="flex-end" margin="mt-4">
          <Button
            id="close-bulk-generate-failures-button"
            onClick={() => externalDialogCall.removeDialog(BULK_FAILURES_DIALOG_ID)}
            color="primary"
          >
            <Typography>Close</Typography>
          </Button>
        </Grid>
      </Card>
    ),
  });
}

function BulkGenerateDialog({
  selectedInstanceIds,
  onSuccess,
}: BulkGenerateDialogProps) {
  const [count, setCount] = useState<number>(30);
  const [cadence, setCadence] = useState<SpinSprintBulkCadence>("DAILY");
  const [timezone, setTimezone] = useState<string>(getDefaultTimezone());
  const [skipIfExists, setSkipIfExists] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errors, setErrors] = useState<BulkGenerateFormErrors>({});

  const cadenceOptions = useMemo(
    () => [
      { value: "DAILY", label: "DAILY" },
      { value: "WEEKLY", label: "WEEKLY" },
      { value: "MONTHLY", label: "MONTHLY" },
    ],
    [],
  );

  function validateForm() {
    const nextErrors: BulkGenerateFormErrors = {};
    const trimmedTimezone = timezone.trim();
    if (!Number.isInteger(count) || count < 1 || count > MAX_BULK_COUNT) {
      nextErrors.count = `Count must be between 1 and ${MAX_BULK_COUNT}.`;
    }
    if (!trimmedTimezone || !isValidTimezone(trimmedTimezone)) {
      nextErrors.timezone = "Please provide a valid IANA timezone (e.g. Europe/London).";
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function handleSubmit() {
    if (!validateForm()) {
      return;
    }
    setSubmitting(true);
    try {
      const response = await instanceApi.bulkGenerateSpinSprintInstances({
        sourceInstanceIds: selectedInstanceIds,
        count,
        cadence,
        timezone: timezone.trim(),
        skipIfExists,
      });

      const failedCount = response?.failures?.length || 0;
      const countFailure = response?.failures?.find((failure) =>
        failure.message?.toLowerCase().includes("count"),
      );
      const timezoneFailure = response?.failures?.find((failure) =>
        failure.message?.toLowerCase().includes("invalid timezone"),
      );
      if (countFailure) {
        setErrors((current) => ({ ...current, count: countFailure.message }));
      }
      if (timezoneFailure) {
        setErrors((current) => ({ ...current, timezone: timezoneFailure.message }));
      }

      toastSuccess(
        `Created ${response.created}, Skipped ${response.skipped}, Failed ${failedCount}.`,
      );
      externalDialogCall.removeDialog(BULK_GENERATE_DIALOG_ID);
      onSuccess({
        created: response.created,
        skipped: response.skipped,
        failures: response.failures || [],
      });
    } catch (error: any) {
      const errorMessage = extractErrorMessage(error);
      if (errorMessage.toLowerCase().includes("timezone")) {
        setErrors((current) => ({ ...current, timezone: errorMessage }));
      }
      toastError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card
      color="secondary"
      padding={["p-3", "pt-5"]}
      style={{
        width: "620px",
        maxWidth: "calc(100vw - 2rem)",
        maxHeight: "calc(100dvh - 4rem)",
        overflowY: "auto",
      }}
      animateOnScroll
      animation="zoom-in"
    >
      <Grid margin="mb-3">
        <Typography size="lg" weight={700}>
          Generate future instances
        </Typography>
      </Grid>
      <Grid margin="mb-4">
        <Typography size="sm">
          Creates real SpinSprint instances in the future using the selected instances as templates. Win times will be generated per new instance and can be edited afterwards.
        </Typography>
      </Grid>
      <Grid margin="mb-4">
        <Typography size="sm">
          Selected SpinSprint Instances: {selectedInstanceIds.length}
        </Typography>
      </Grid>
      <Grid gap="1rem">
        <InputGroup
          id="bulk-generate-count"
          name="bulk-generate-count"
          label={<Typography>Count</Typography>}
          inputType="number"
          value={count}
          inputProps={{ min: 1, max: MAX_BULK_COUNT }}
          status={errors.count ? "error" : ""}
          feedback={errors.count ? <Typography>{errors.count}</Typography> : null}
          onChange={({ target }) => setCount(Number(target.value))}
        />
        <SelectGroup
          id="bulk-generate-cadence"
          name="bulk-generate-cadence"
          label="Cadence"
          options={cadenceOptions}
          value={cadenceOptions.find((option) => option.value === cadence)}
          onChange={({ target }: any) => setCadence(target.value as SpinSprintBulkCadence)}
        />
        <InputGroup
          id="bulk-generate-timezone"
          name="bulk-generate-timezone"
          label={<Typography>Timezone</Typography>}
          value={timezone}
          status={errors.timezone ? "error" : ""}
          feedback={errors.timezone ? <Typography>{errors.timezone}</Typography> : null}
          onChange={({ target }) => setTimezone(target.value)}
        />
        <InputGroup
          id="bulk-generate-skip-if-exists"
          name="bulk-generate-skip-if-exists"
          label={<Typography>Skip if already exists</Typography>}
          inputType="checkbox"
          value={skipIfExists}
          onChange={({ target }) => setSkipIfExists(Boolean(target.value))}
        />
      </Grid>
      <Grid horizontalAlgin="space-between" margin="mt-5">
        <Button
          id="bulk-generate-cancel-button"
          onClick={() => externalDialogCall.removeDialog(BULK_GENERATE_DIALOG_ID)}
          color="primary-outline"
          disabled={submitting}
        >
          <Typography>Cancel</Typography>
        </Button>
        <Button
          id="bulk-generate-submit-button"
          onClick={handleSubmit}
          color="primary"
          disabled={submitting}
        >
          <Typography>{submitting ? "Generating..." : "Generate future instances"}</Typography>
        </Button>
      </Grid>
    </Card>
  );
}

function createNewInstanceWithDefaults(spinSprintId: number) {
  const now = new Date().toISOString();
  return {
    ...instanceApi.defaultItem,
    spinSprintId,
    notifyTime: now,
    startTime: now,
    endTime: now,
  };
}

export default function ListCrud() {
  const { refreshState, setSelectedItem, spinSprintId, askRefresh } =
    useContext(CrudContext);
  const [selectedInstanceIds, setSelectedInstanceIds] = useState<number[]>([]);
  const [currentPageInstanceIds, setCurrentPageInstanceIds] = useState<number[]>([]);

  const columns = useMemo(
    () =>
      buildColumns({
        selectedInstanceIds,
        onToggleSelectInstance: (instanceId, checked) => {
          if (!Number.isFinite(instanceId)) {
            return;
          }
          setSelectedInstanceIds((current) => {
            const withoutInstanceId = current.filter((id) => id !== instanceId);
            return checked ? [...withoutInstanceId, instanceId] : withoutInstanceId;
          });
        },
      }),
    [selectedInstanceIds],
  );

  const allCurrentPageSelected =
    currentPageInstanceIds.length > 0 &&
    currentPageInstanceIds.every((instanceId) =>
      selectedInstanceIds.includes(instanceId),
    );

  useEffect(() => {
    setSelectedInstanceIds([]);
  }, [refreshState, spinSprintId]);

  function handleBulkGenerateSuccess({
    failures,
  }: {
    created: number;
    skipped: number;
    failures: SpinSprintBulkGenerateFailure[];
  }) {
    if (failures.length > 0) {
      openBulkFailureDialog(failures);
    }
    setSelectedInstanceIds([]);
    askRefresh && askRefresh();
  }

  function openBulkGenerateDialog() {
    externalDialogCall.displayDialog({
      dialogId: BULK_GENERATE_DIALOG_ID,
      content: (
        <BulkGenerateDialog
          selectedInstanceIds={selectedInstanceIds}
          onSuccess={handleBulkGenerateSuccess}
        />
      ),
    });
  }

  return (
    <>
      {/* Button to add jaskpot instance */}
      <Grid horizontalAlgin="space-between" margin="mb-3">
        <Grid gap="0.5rem" wrap="nowrap">
          <Button
            id="select-all-current-page-button"
            color="secondary"
            onClick={() => {
              if (!currentPageInstanceIds.length) {
                return;
              }
              setSelectedInstanceIds((current) => {
                if (allCurrentPageSelected) {
                  return current.filter(
                    (instanceId) => !currentPageInstanceIds.includes(instanceId),
                  );
                }
                const next = new Set<number>([...current, ...currentPageInstanceIds]);
                return Array.from(next);
              });
            }}
            disabled={!currentPageInstanceIds.length}
          >
            <Typography>
              {allCurrentPageSelected ? "Unselect all on page" : "Select all on page"}
            </Typography>
          </Button>
          <Button
            id="bulk-generate-future-instances-button"
            color="primary"
            onClick={openBulkGenerateDialog}
            disabled={!selectedInstanceIds.length}
          >
            <Typography>Generate future instances</Typography>
          </Button>
        </Grid>
        <Button
          id="add-item-button"
          onClick={() => {
            if (spinSprintId === undefined) return; // or show an error/toast
            setSelectedItem(createNewInstanceWithDefaults(spinSprintId));
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
        selectedItem={(row: any) => selectedInstanceIds.includes(Number(row?.id))}
        dataService={async (p) => {
          const filterExp = spinSprintId
            ? p?.filterExp
              ? `${p.filterExp}[and]spinSprint.id$eq=${spinSprintId}`
              : `spinSprint.id$eq=${spinSprintId}`
            : p?.filterExp;
          const result = await instanceApi.getItems({ ...p, filterExp });
          const pageItems = (result?.content || [])
            .map((item: any) => Number(item?.id))
            .filter((id: number) => Number.isFinite(id));
          setCurrentPageInstanceIds(pageItems);
          return result;
        }}
        dataGridId={`instance-${refreshState}`}
        enablePagination
      />
    </>
  );
}
