import React, { useState } from 'react'
import Grid from 'components/uiKit/grid'
import { textTranslated } from 'components/TextTranslated'
import InputGroup from 'components/uiKit/inputs/inputGroup'
import RangeInput from 'components/uiKit/inputs/inputGroup/variants/rangeInput'
import { JackpotI } from 'utils/services/api/requests/jackpots/types'
import Typography from 'components/uiKit/typography'
import { BsTools } from 'react-icons/bs'
import Button from 'components/uiKit/buttons'
import Card from 'components/cards/card'
import { useThemeWatcher } from 'utils/customHooks'
import { FormContext } from '../../..'
import { CrudContext } from '../../../..'

export default function AdvancedTab() {
    const {
        selectedItem,
        setSelectedItem,
    } = React.useContext(CrudContext)
    const {
        errors,
        updateField,
        setCurrentInfo,
    } = React.useContext(FormContext)

    const [expand, setExpand] = useState(false)
    const theme = useThemeWatcher()

    return (
        <Grid>
            <Grid>
                <Button color={theme === 'light' ? 'primary' : 'primary-full'} block onClick={() => setExpand(!expand)} id="advanced-toggle">
                    <Grid gap="0.5rem" verticalAlgin="center" horizontalAlgin="flex-start">
                        <BsTools />
                        <Typography
                            translateGroup="global"
                            translateKey="advanced"
                        />
                    </Grid>
                </Button>
            </Grid>
            <Card
                color="root"
                style={{
                    height: 'fit-content',
                    maxHeight: expand ? '500px' : '0px',
                    transition: 'max-height 0.5s ease-in-out',
                    overflow: 'hidden',
                    borderRadius: '0pt 0pt 4pt 4pt',
                    padding: 0,
                }}
            >
                <Grid padding={['p-3']} width="calc(50% - 0.25rem)">

                    <InputGroup
                        id="pushDelay"
                        name="pushDelay"
                        label="pushDelay"
                        inputType="number"
                        inputProps={{ min: 5 }}
                        feedback={errors?.pushDelay}
                        status={errors?.pushDelay && 'error'}
                        value={selectedItem.pushDelay}
                        onChange={({ target }) => { updateField(target.name, target.value) }}
                        onFocus={() => setCurrentInfo(textTranslated({ group: 'forms-tabs-helpers', key: 'input-jackpot-push-delay-help', returnDefault: 'nothing' }))}
                    />
                </Grid>
            </Card>
        </Grid>
    )
}
