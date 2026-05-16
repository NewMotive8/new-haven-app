import React, { useState } from "react";
import ReactDOM from "react-dom";
import DatePicker from "react-datepicker";
import moment from "moment";
import "react-datepicker/dist/react-datepicker.css";
import Button from "components/uiKit/buttons";
import Grid from "components/uiKit/grid";
import Typography from "components/uiKit/typography";
import { textTranslated } from "components/TextTranslated";
import styles from "./DateFilter.module.scss";

interface Props {
  value?: { from?: Date | null; to?: Date | null } | null;
  onChange?: (value: any) => void;
  column?: any;
}

const DateTimeColumnFilter = ({ value, onChange, column }: Props) => {
  const [showModal, setShowModal] = useState(false);
  const [dateFrom, setDateFrom] = useState<Date | null>(value?.from || null);
  const [dateTo, setDateTo] = useState<Date | null>(value?.to || null);

  const handleSave = () => {
    if (!onChange) return;

    // Clear filter if both dates are null
    if (!dateFrom && !dateTo) {
      onChange(null);
      setShowModal(false);
      return;
    }

    // Build filterExp with strict backend operators ($after/$before).
    // We create UTC calendar-day bounds from the selected date parts so the
    // emitted range is stable across browser timezones.
    const parts: string[] = [];
    if (dateFrom) {
      const fromStartUtc = moment.utc({
        year: dateFrom.getFullYear(),
        month: dateFrom.getMonth(),
        day: dateFrom.getDate(),
        hour: 0,
        minute: 0,
        second: 0,
        millisecond: 0,
      });
      // Backend uses strict "after", so shift back by 1 ms to include 00:00:00.000
      const fromIso = fromStartUtc.subtract(1, 'millisecond').toISOString();
      parts.push(`${column.key}$after=${fromIso}`);
    }
    if (dateTo) {
      const toStartUtc = moment.utc({
        year: dateTo.getFullYear(),
        month: dateTo.getMonth(),
        day: dateTo.getDate(),
        hour: 0,
        minute: 0,
        second: 0,
        millisecond: 0,
      });
      // Backend uses strict "before", so use next day start to include full end day.
      const toIso = toStartUtc.add(1, 'day').toISOString();
      parts.push(`${column.key}$before=${toIso}`);
    }

    const filterValue = parts.join('[and]');

    onChange({
      filterValue,
      value: { from: dateFrom, to: dateTo },
    });
    setShowModal(false);
  };

  const handleClear = () => {
    setDateFrom(null);
    setDateTo(null);
    if (onChange) {
      onChange(null);
    }
    setShowModal(false);
  };

  return (
    <>
      <input
        type="text"
        onClick={() => setShowModal(true)}
        readOnly
        placeholder="Select date range"
        value={
          dateFrom || dateTo
            ? `${dateFrom ? dateFrom.toLocaleDateString() : ''} - ${dateTo ? dateTo.toLocaleDateString() : ''}`
            : ''
        }
        className={styles['filter-input']}
        onFocus={(e) => {
          e.currentTarget.style.borderBottom = 'solid 1px var(--primary)';
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderBottom = 'solid 1px var(--input-border)';
        }}
      />

      {showModal && ReactDOM.createPortal(
        <div
          className={styles['modal-overlay']}
          onClick={() => setShowModal(false)}
        >
          <div
            className={styles['modal-content']}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles['modal-title']}>
              <Typography weight={600} size="lg">
                {textTranslated({ group: 'datefilter', key: 'filter' }) || 'Filter'} {column.label}
              </Typography>
            </div>

            <Grid className={styles['form-group']}>
              <label className={styles['form-label']}>
                {textTranslated({ group: 'datefilter', key: 'from' }) || 'From'}
              </label>
              <div className={styles['date-input-wrapper']}>
                <DatePicker
                  selected={dateFrom}
                  onChange={(date) => setDateFrom(date)}
                  showTimeSelect
                  timeIntervals={1}
                  dateFormat="yyyy-MM-dd HH:mm:ss"
                  placeholderText={textTranslated({ group: 'datefilter', key: 'from-date' }) || 'From date'}
                  className={styles['date-filter-input']}
                />
              </div>
            </Grid>

            <Grid className={styles['form-group']}>
              <label className={styles['form-label']}>
                {textTranslated({ group: 'datefilter', key: 'to' }) || 'To'}
              </label>
              <div className={styles['date-input-wrapper']}>
                <DatePicker
                  selected={dateTo}
                  onChange={(date) => setDateTo(date)}
                  showTimeSelect
                  timeIntervals={1}
                  dateFormat="yyyy-MM-dd HH:mm:ss"
                  placeholderText={textTranslated({ group: 'datefilter', key: 'to-date' }) || 'To date'}
                  className={styles['date-filter-input']}
                />
              </div>
            </Grid>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
              <Button
                id={`filter-clear-${column.key}`}
                color="secondary"
                onClick={handleClear}
              >
                {textTranslated({ group: 'datefilter', key: 'clear' }) || 'Clear'}
              </Button>
              <Button
                id={`filter-save-${column.key}`}
                color="primary"
                onClick={handleSave}
              >
                {textTranslated({ group: 'datefilter', key: 'apply' }) || 'Apply'}
              </Button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

export default DateTimeColumnFilter;
