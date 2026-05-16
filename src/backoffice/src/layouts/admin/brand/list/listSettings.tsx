import { dataGridColumnType } from 'components/uiKit/dataGridV3'
import Grid from 'components/uiKit/grid'

export const columns: Array<dataGridColumnType> = [
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
        uniqueId: 'name-brand',
        filter: true,
    },
]
