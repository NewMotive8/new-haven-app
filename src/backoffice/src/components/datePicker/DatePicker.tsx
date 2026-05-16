import React, { useState } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import styles from './datepicker.module.scss';

const CustomDatePicker = () => {
  const [startDate, setStartDate] = useState<Date | null>(new Date());

  return (
    <div className={styles.light}>
      <DatePicker
        selected={startDate}
        onChange={date => setStartDate(date)}
        className={styles.input}
      />
    </div>
  );
};

export default CustomDatePicker;