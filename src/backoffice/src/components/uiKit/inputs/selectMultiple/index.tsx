import React, { ReactNode } from 'react'
import Grid from 'components/uiKit/grid'
import { BsDashCircle } from 'react-icons/bs'
import { MdDragIndicator } from 'react-icons/md'
import SelectGroup from '../selectGroup'

type selectItem = {
    value: any,
    label: ReactNode
}

interface Props {
    id: string,
    name: string,
    label: string,
    value: Array<any>,
    options: Array<selectItem>,
    onChange: Function,
    placeholder?: string,
}

export default function SelectMultiple(props: Props) {
    const {
        value,
        options: optionsProps,
        onChange,
        id,
        name,
        placeholder,
    } = props

    const options = optionsProps?.filter((opt) => !value?.includes(opt.value))

    function handleChange(e: any) {
        onChange({ target: { ...e, value: [...(value || []), e.value] } })
    }

    function removeOption(optionValue: any) {
        const newValue = [...(value || [])]
        const indexToDelete = newValue.findIndex((val) => val === optionValue)
        delete newValue[indexToDelete]
        onChange({ target: { id, name, value: [...newValue].filter((v) => v !== undefined) } })
    }
    const dragItem: any = React.useRef()
    const dragOverItem: any = React.useRef()

    const onDragStart = (e: React.DragEvent<HTMLDivElement>, position: number) => {
        dragItem.current = position
    }

    const onDragEnter = (e: React.DragEvent<HTMLDivElement>, position: number) => {
        dragOverItem.current = position
    }

    const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
        const copyListItems = [...value]
        const dragItemContent = copyListItems[dragItem?.current as any]
        copyListItems.splice(dragItem.current as any, 1)
        copyListItems.splice(dragOverItem.current as any, 0, dragItemContent)
        dragItem.current = null
        dragOverItem.current = null
        onChange({ target: { id, name, value: [...copyListItems].filter((v) => v !== undefined) } })
    }

    return (
        <Grid
            style={{
                marginTop: '20px',
            }}
        >
            <SelectGroup {...props} value={{ label: placeholder }} options={options} onChange={(e: any) => handleChange(e)} />
            <Grid wrap="wrap">
                {
                   optionsProps && value?.map((selectValue: any, i: number) => {
                        const option = optionsProps?.find((opt) => opt.value === selectValue)
                        return (
                            <Grid
                                key={`select-multiple-${option?.label}-${option?.value?.id || option?.value}`}
                                width={100}
                                horizontalAlgin="space-between"
                                draggable
                                onDragStart={(e) => onDragStart(e, i)}
                                onDragEnter={(e) => onDragEnter(e, i)}
                                onDragEnd={onDrop}
                                padding={['p-2', 'pt-3', 'pb-3']}
                                style={{
                                    background: 'var(--tertiary-100)',
                                    borderBottom: 'solid 1px var(--tertiary-300)',
                                    cursor: 'grab',
                                }}
                            >
                                <Grid gap="0.5rem" width="fit-content">
                                    <MdDragIndicator />
                                    {option?.label}
                                </Grid>
                                <Grid width="fit-content">
                                    <BsDashCircle style={{ cursor: 'pointer' }} onClick={() => removeOption(selectValue)} />
                                </Grid>

                            </Grid>
                        )
                    })
                }
            </Grid>
        </Grid>
    )
}
