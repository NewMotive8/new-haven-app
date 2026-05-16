import React, { useContext, useEffect } from 'react'
import Grid from 'components/uiKit/grid'
import Card from 'components/cards/card'
import Typography from 'components/uiKit/typography'
import { textTranslated } from 'components/TextTranslated'
import poolsApi from 'utils/services/api/requests/pools'
import { FormContext } from '../..'
import { CrudContext } from '../../..'
import JackpotIcon from './typeCards/Jackpot'
import MustDrop from './typeCards/MustDrop'
import TimeIcon from './typeCards/Time'
import MultiLevel from './typeCards/MultiLevel'

interface IconProps {
    width: string;
    height: string;
}

type IconType = React.ComponentType<IconProps>;

interface TypeCardProps {
    type: string;
    Icon: IconType;
    label: string;
}

function TypeCard({ type, Icon, label }: TypeCardProps) {
    const { updateField, setCurrentInfo, validateTab } = useContext(FormContext)
    const { selectedItem } = useContext(CrudContext)

    useEffect(() => {
        if (selectedItem.type) {
            validateTab('type')
        }
    }, [selectedItem])

    return (
        <Card
            gap="1rem"
            width="150px"
            horizontalAlgin="center"
            color={selectedItem.type === type ? 'primary' : 'primary-outline'}
            onClick={() => {
                updateField('type', type)
                if (type === 'MUST_DROP') {
                    updateField('model', 3)
                    updateField('fixedWinAmount', 0)
                    updateField('averageWinAmount', 0)
                }
                if (type === 'MULTI_LEVEL') {
                    updateField('pools', [poolsApi.defaultItem, poolsApi.defaultItem])
                }
                setCurrentInfo(textTranslated({ group: 'forms-tabs-helpers', key: `input-type-${type}-help`, returnDefault: 'nothing' }))
            }}
            style={{ cursor: 'pointer' }}
        >
            <Icon width="70px" height="70px" />
            <Grid horizontalAlgin="center">
                <Typography translateGroup="jackpot-type" translateKey={label} />
            </Grid>
        </Card>
    )
}

export default function TypeTab() {
    return (
        <Grid gap="1rem">
            <TypeCard type="CLASSIC" Icon={JackpotIcon} label="classic" />
            <TypeCard type="FREQUENCY" Icon={TimeIcon} label="frequency" />
            <TypeCard type="MUST_DROP" Icon={MustDrop} label="must-drop" />
            <TypeCard type="MULTI_LEVEL" Icon={MultiLevel} label="multi_level" />
        </Grid>
    )
}
