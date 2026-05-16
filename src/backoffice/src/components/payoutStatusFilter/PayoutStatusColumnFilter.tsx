import React, { useState, useMemo } from "react";
import ReactDOM from "react-dom";
import Button from "components/uiKit/buttons";
import Grid from "components/uiKit/grid";
import Typography from "components/uiKit/typography";
import { textTranslated } from "components/TextTranslated";
import {
  BsClock,
  BsArrowRepeat,
  BsCheckCircle,
  BsXCircle,
} from 'react-icons/bs'
import styles from "./PayoutStatusColumnFilter.module.scss";

type PayoutStatus = 'PENDING' | 'PROCESSING' | 'PAID' | 'FAILED'

const statusConfig: Record<PayoutStatus, {
  label: string
  translationKey: string
  backgroundColor: string
  iconColor: string
  icon: React.ReactNode
}> = {
  PENDING: {
    label: 'PENDING',
    translationKey: 'payout-status-pending',
    backgroundColor: '#9CA3AF',
    iconColor: '#FFFFFF',
    icon: <BsClock />,
  },
  PROCESSING: {
    label: 'PROCESSING',
    translationKey: 'payout-status-processing',
    backgroundColor: '#3B82F6',
    iconColor: '#FFFFFF',
    icon: <BsArrowRepeat />,
  },
  PAID: {
    label: 'PAID',
    translationKey: 'payout-status-paid',
    backgroundColor: '#22C55E',
    iconColor: '#FFFFFF',
    icon: <BsCheckCircle />,
  },
  FAILED: {
    label: 'FAILED',
    translationKey: 'payout-status-failed',
    backgroundColor: '#EF4444',
    iconColor: '#FFFFFF',
    icon: <BsXCircle />,
  },
}

interface Props {
  value?: (string | PayoutStatus)[] | null;
  onChange?: (value: any) => void;
  column?: any;
}

const PayoutStatusColumnFilter = ({ value, onChange, column }: Props) => {
  const [showModal, setShowModal] = useState(false);
  const [selectedStatuses, setSelectedStatuses] = useState<PayoutStatus[]>(
    (value || []) as PayoutStatus[]
  );

  const displayText = useMemo(() => {
    if (selectedStatuses.length === 0) return '';
    if (selectedStatuses.length === 1) return selectedStatuses[0];
    return `${selectedStatuses.length} selected`;
  }, [selectedStatuses]);

  const handleStatusToggle = (status: PayoutStatus) => {
    setSelectedStatuses((prev) => {
      if (prev.includes(status)) {
        return prev.filter((s) => s !== status);
      } else {
        return [...prev, status];
      }
    });
  };

  const handleSave = () => {
    if (!onChange) return;

    if (selectedStatuses.length === 0) {
      onChange(null);
      setShowModal(false);
      return;
    }

    // Build filterExp with $like operator and [or] joining
    const filterParts = selectedStatuses.map(status => `${column.key}$like=${status}`);
    const filterValue = filterParts.join('[or]');

    onChange({
      filterValue,
      value: selectedStatuses,
    });
    setShowModal(false);
  };

  const handleClear = () => {
    setSelectedStatuses([]);
    if (onChange) {
      onChange(null);
    }
    setShowModal(false);
  };

  const handleCancel = () => {
    setShowModal(false);
  };

  return (
    <>
      <input
        type="text"
        onClick={() => setShowModal(true)}
        readOnly
        placeholder="Select status"
        value={displayText}
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
          onClick={handleCancel}
        >
          <div
            className={styles['modal-content']}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles['modal-title']}>
              <Typography weight={600} size="lg">
                {textTranslated({ group: 'datefilter', key: 'filter' }) || 'Filter'} {textTranslated({ group: 'input-group-label', key: column.label }) || column.label}
              </Typography>
            </div>

            <div className={styles['checkboxes-container']}>
              {(Object.keys(statusConfig) as PayoutStatus[]).map((status) => {
                const config = statusConfig[status];
                const isChecked = selectedStatuses.includes(status);

                return (
                  <label key={status} className={styles['checkbox-label']}>
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleStatusToggle(status)}
                      className={styles['checkbox-input']}
                    />
                    <div className={styles['checkbox-content']}>
                      <span
                        className={styles['status-badge']}
                        style={{
                          backgroundColor: config.backgroundColor,
                          color: config.iconColor,
                        }}
                      >
                        {React.cloneElement(config.icon as React.ReactElement, {
                          style: { marginRight: '0.5rem' },
                        })}
                        {status}
                      </span>
                    </div>
                  </label>
                );
              })}
            </div>

            <div className={styles['button-group']}>
              <Button
                id={`filter-cancel-${column.key}`}
                color="secondary"
                onClick={handleCancel}
              >
                {textTranslated({ group: 'datefilter', key: 'cancel' }) || 'Cancel'}
              </Button>
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

export default PayoutStatusColumnFilter;
