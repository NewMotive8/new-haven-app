import Grid from 'components/uiKit/grid'
import SelectGroup from 'components/uiKit/inputs/selectGroup'
import Typography from 'components/uiKit/typography'
import React, { useEffect, useState } from 'react'
import moment from 'moment'
import styles from './style.module.scss'

interface Props {
    id: string,
    name: string,
    value: string,
    label?: React.ReactNode,
    onChange: ({ target: { value, id, name } }: any) => void,
    status?: 'error' | 'success' | 'warning' | 'info' | '',
    feedback?: React.ReactNode,

}
interface SelectOption {
    value: number;
    label: string;
}

function parseValue(value: string) {
    const arrValue = value.split('/')
    return {
        day: parseInt(arrValue[0], 10),
        month: parseInt(arrValue[1], 10),
        year: parseInt(arrValue[2], 10),
    }
}

export default function DateSelector(props: Props) {
    const {
        id,
        name,
        value,
        label,
        onChange,
        status,
        feedback,
    } = props
    const [day, setDay] = useState<number | null>(parseValue(value).day)
    const [month, setMonth] = useState<number | null>(parseValue(value).month)
    const [year, setYear] = useState<number | null>(parseValue(value).year)

    const days: SelectOption[] = Array.from(Array(31).keys()).map((i) => ({
        value: i + 1,
        label: (i + 1).toString(),
    }))
    const months: SelectOption[] = Array.from(Array(12).keys()).map((i) => ({
        value: i + 1,
        label: (i + 1).toString(),
    }))
    const years: SelectOption[] = Array.from(Array(110).keys()).map((i) => ({
        value: new Date().getFullYear() - 18 - i,
        label: (new Date().getFullYear() - 18 - i).toString(),
    }))

    const filteredMonths = day === 31
        ? [1, 3, 5, 7, 8, 10, 12].map((i: number) => ({ value: i, label: i.toString() }))
        : day === 30
            ? [4, 6, 9, 11].map((i: number) => ({ value: i, label: i.toString() }))
            : months
    const leapYears: number[] = []
    for (let y: number = 1824; y <= 2020; y += 4) {
        if (y % 100 === 0) {
            if (y % 400 === 0) {
                leapYears.push(y)
            }
        } else if (y % 4 === 0) {
            leapYears.push(y)
        }
    } leapYears.sort((a, b) => b - a)

    const filteredYears: any = (day === 29 && month === 2)
        ? (
            leapYears.map((lp: number) => {
                if (lp < new Date().getFullYear() - 18) {
                    return ({
                        value: lp,
                        label: lp.toString(),
                    })
                }
                return null
            }).filter((op: any) => op?.label)
        )
        : years

    function addLeadingZero(num: number | null | undefined): string {
        if (!num) return 'invalid'
        if (num < 10) {
            return `0${num}`
        }
        return `${num}`
    }
    function handleCallOnChange() {
        onChange({ target: { id, name, value: `${(year || 'invalid')}-${addLeadingZero(month)}-${addLeadingZero(day)}` } })
    }

    useEffect(() => {
        const date = `${(year || 'invalid')}-${addLeadingZero(month)}-${addLeadingZero(day)}`
        if (moment(date).isValid() && date !== value) {
            handleCallOnChange()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [day, months, years])

    useEffect(() => {
        setMonth(null)
        setYear(null)
        handleCallOnChange()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [day])
    useEffect(() => {
        setYear(null)
        handleCallOnChange()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [month])

    return (
        <div data-status={status} className={styles['select-group-wrapper']}>
            <Grid className={styles['select-label']} style={{ marginBottom: '5px' }}>
                {
                    typeof label === 'string'
                        ? (
                            <Typography
                                translateGroup="input-group-label"
                                translateKey={label}
                                size="sm"
                            />
                        )
                        : label
                }
            </Grid>
            <Grid gap="0.5rem">
                <Grid width="calc((100% / 3) - (1rem / 3))">
                    <SelectGroup
                        id="day"
                        label=""
                        name="day"
                        placeholder={(
                            <Typography
                                translateGroup="input-group-label"
                                translateKey="day"
                                size="sm"
                            />
                        )}
                        onChange={({ target }) => { setDay(target.value) }}
                        options={days}
                        value={days.filter((d) => d.value === day)}
                    />
                </Grid>
                <Grid width="calc((100% / 3) - (1rem / 3))">
                    <SelectGroup
                        id="month"
                        label=""
                        name="month"
                        placeholder={(
                            <Typography
                                translateGroup="input-group-label"
                                translateKey="month"
                                size="sm"
                            />
                        )}
                        onChange={({ target }) => { setMonth(target.value) }}
                        options={filteredMonths}
                        value={months.filter((d) => d.value === month)}
                    />
                </Grid>
                <Grid width="calc((100% / 3) - (1rem / 3))">
                    <SelectGroup
                        id="year"
                        label=""
                        name="dayeary"
                        placeholder={(
                            <Typography
                                translateGroup="input-group-label"
                                translateKey="year"
                                size="sm"
                            />
                        )}
                        onChange={({ target }) => { setYear(target.value) }}
                        options={filteredYears}
                        value={years.filter((d) => d.value === year)}
                    />
                </Grid>
            </Grid>
            {
                feedback && (
                    <div className={styles.feedback}>
                        <Typography size="xsm">
                            {feedback}
                        </Typography>
                    </div>
                )
            }
        </div>
    )
}
