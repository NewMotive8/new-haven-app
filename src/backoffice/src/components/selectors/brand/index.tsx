/* eslint-disable @next/next/no-img-element */
import Card from 'components/cards/card'
import DataGridV3 from 'components/uiKit/dataGridV3'
import Grid from 'components/uiKit/grid'
import Typography from 'components/uiKit/typography'
import React from 'react'
import brandApi from 'utils/services/api/requests/brand'

interface Props {
    onChange: (brand: any) => void// TODO: implement brand type properly when available,
}

export default function BrandSelector(props: Props) {
    const { onChange } = props

    return (
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
                    translateKey="select-the-brand"
                    size="lg"
                    weight={600}
                    style={{
                        width: '100%',
                        textAlign: 'center',
                    }}
                />
            </Grid>
            <DataGridV3
                dataService={(p) => brandApi.getItems(p)}
                columns={[
                    {
                        key: 'brandId',
                        label: 'brandId',
                        uniqueId: 'brandId',
                        filter: true,
                        render: (brandId: string, row: any) => {
                            return (
                                <Grid gap="0.5rem" verticalAlgin="center">
                                    {row?.logo && (
                                        <Grid width="100px">
                                            <img src={row?.logo} alt="brand-logo" height="30px" width="auto" />
                                        </Grid>
                                    )}
                                    {brandId}
                                </Grid>
                            )
                        },
                    },
                    {
                        key: 'name',
                        label: 'brand-name',
                        uniqueId: 'name',
                        filter: true,
                    },
                ]}
                dataGridId="brands"
                defaultPageSize={10}
                onRowClick={(row: any) => onChange(row)}
            />
        </Card>
    )
}
