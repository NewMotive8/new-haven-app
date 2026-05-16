/* eslint-disable @next/next/no-img-element */
import Card from 'components/cards/card'
import DataGridV3 from 'components/uiKit/dataGridV3'
import Grid from 'components/uiKit/grid'
import Typography from 'components/uiKit/typography'
import React from 'react'
import currenciesApi, { currenciesI } from 'utils/services/api/requests/currencies'
import { pageableProps } from 'utils/services/api/types'

interface Props {
    onChange: (currency: currenciesI) => void
}

export default function CurrencySelector(props: Props) {
    const { onChange } = props

    function parseParams(params: pageableProps) {
        const filterExp = params?.filterExp
            ? `${params.filterExp}[and]enabled$eq=true`
            : 'enabled$eq=true'

        return {
            ...params,
            filterExp,
        }
    }

    return (
        <Card
            color="secondary"
            padding={['p-3', 'pt-5']}
            style={{
                width: '600px',
                maxWidth: 'calc(100vw - 2rem)',
                maxHeight: 'calc(100dvh - 4rem)',
                overflowY: 'auto',

            }}
            animateOnScroll
            animation="zoom-in"
        >
            <Grid>
                <Typography
                    translateGroup="selectors"
                    translateKey="select-the-currency"
                    size="lg"
                    weight={600}
                    style={{
                        width: '100%',
                        textAlign: 'center',
                    }}
                />
            </Grid>
            <DataGridV3
                dataService={(p) => currenciesApi.getItems(parseParams(p))}
                columns={[
                    {
                        label: 'name',
                        key: 'name',
                        filter: true,
                        uniqueId: 'name',
                    },
                    {
                        label: 'iso3',
                        key: 'iso3',
                        uniqueId: 'iso3',
                        filter: true,
                        html: true,
                    },
                ]}
                dataGridId="currencies-enabled"
                defaultPageSize={10}
                onRowClick={(row: any) => onChange(row)}
                enablePagination
            />
        </Card>
    )
}
