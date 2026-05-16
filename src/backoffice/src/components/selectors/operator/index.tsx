/* eslint-disable @next/next/no-img-element */
import Card from 'components/cards/card'
import DataGridV3 from 'components/uiKit/dataGridV3'
import Grid from 'components/uiKit/grid'
import InputGroup, { uiKitInputProps } from 'components/uiKit/inputs/inputGroup'
import Typography from 'components/uiKit/typography'
import DialogContext from 'context/dialog'
import React from 'react'
import operatorsApi, { operatorsI } from 'utils/services/api/requests/operators'

interface OCI {
    target: {
        name: string,
        id: string,
        value: any,
    }
}
interface Props extends Omit<uiKitInputProps, 'onChange'> {
    onChange: (item: OCI) => void,
}

export default function OperatorSelector(props: Props) {
    const {
        name, id, onChange, onFocus, value, ...nProps
    } = props

    const { displayDialog, removeDialog } = React.useContext(DialogContext)

    function handleDisplayDialog() {
        displayDialog({
            dialogId: 'OPERATOR-SELECTOR',
            content: (
                <Card
                    color="secondary"
                    padding={['p-3', 'pt-5']}
                    style={{
                        width: '600px',
                        maxWidth: 'calc(100vw - 2rem)',
                    }}
                    animateOnScroll
                    animation="zoom-in"
                >
                    <Grid>
                        <Typography
                            translateGroup="selectors"
                            translateKey="select-the-operator"
                            size="lg"
                            weight={600}
                            style={{
                                width: '100%',
                                textAlign: 'center',
                            }}
                        />
                    </Grid>
                    <DataGridV3
                        dataService={(p) => operatorsApi.getItems(p)}
                        columns={[
                            {
                                key: 'operatorId',
                                label: 'operatorId',
                                uniqueId: 'operatorId',
                                filter: true,
                                render: (operatorId: string, row: any) => {
                                    return (
                                        <Grid gap="0.5rem" verticalAlgin="center">
                                            {row?.logo && (
                                                <Grid width="100px">
                                                    <img src={row?.logo} alt="operator-logo" height="30px" width="auto" />
                                                </Grid>
                                            )}
                                            {operatorId}
                                        </Grid>
                                    )
                                },
                            },
                            {
                                key: 'name',
                                label: 'operator-name',
                                uniqueId: 'name',
                                filter: true,
                            },
                        ]}
                        dataGridId="operators"
                        defaultPageSize={10}
                        onRowClick={(row: any) => {
                            onChange(
                                {
                                    target: {
                                        value: row,
                                        id,
                                        name,
                                    },
                                },
                            )
                            removeDialog('OPERATOR-SELECTOR')
                        }}
                    />
                </Card>
            ),
        })
    }

    return (
        <InputGroup
            id={id}
            name={name}
            {...nProps}
            value={(value as any)?.name || ''}
            onChange={() => { }}
            onFocus={(e) => {
                if (onFocus) {
                    onFocus(e)
                }
                handleDisplayDialog()
            }}
        />
    )
}
