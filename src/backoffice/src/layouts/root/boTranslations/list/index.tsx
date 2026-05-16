import Loading from 'assets/loading'
import { DownloadCSVButton } from 'components/downloadCSVButton'
import DataGridV2 from 'components/uiKit/dataGridV2'
import DataGridV3 from 'components/uiKit/dataGridV3'
import Grid from 'components/uiKit/grid'
import TypeButton from 'components/uiKit/inputs/TypeButton'
import Typography from 'components/uiKit/typography'
import { UploadCSVButton } from 'components/uploadCSVButton'
import AuthContext from 'context/auth'
import React, { useContext, useState } from 'react'
import { useQuery } from 'react-query'
import boTranslationsApi from 'utils/services/api/requests/boTranslations'
import { CrudContext } from '..'
import { columns } from './listSettings'

export default function ListCrud() {
  const { refreshState, setSelectedItem } = useContext(CrudContext)
  const [currentView, setCurrentView] = useState<'created' | 'allKeys'>(
    'created',
  )

  const { isAuthenticated, token } = React.useContext(AuthContext)
  const {
    data: allKeys,
    isLoading,
    error,
  } = useQuery(['all-keys', token], boTranslationsApi.getAllKeys, {
    enabled: !!isAuthenticated,
  })
  const getCsvBlob = async () => {
    const response = await boTranslationsApi.getCsv()
    return response
  }
  return (
    <>
      <Grid>
        <TypeButton
          name="current-view"
          onChange={({ target }) => setCurrentView(target.value)}
          value={currentView}
          options={[
            {
              value: 'created',
              label: (
                <Typography
                  translateGroup="bo-translations"
                  translateKey="created"
                />
              ),
            },
            {
              value: 'allKeys',
              label: (
                <Typography
                  translateGroup="bo-translations"
                  translateKey="all-keys"
                />
              ),
            },
          ]}
        />
      </Grid>
      {currentView === 'created' ? (
        <>
          <Grid
            responsiveWidth={{ sm: 100 }}
            horizontalAlgin="flex-end"
            gap="0.5rem"
          >
            <DownloadCSVButton
              getCsvBlob={getCsvBlob}
              fileName="translations.csv"
            />
            <UploadCSVButton
              label={(
                <Typography
                  translateGroup="translation"
                  translateKey="import-CSV"
                  weight={600}
                />
              )}
              translateGroup="import-csv-translation"
            />
          </Grid>
          <DataGridV3
            onRowClick={(row: any) => setSelectedItem(row)}
            columns={columns}
            dataService={(p) => boTranslationsApi.getItems(p)}
            dataGridId={`boTranslations-${refreshState}`}
          />
        </>
      ) : (
        <Grid gap="1rem">
          <Grid>{isLoading && <Loading />}</Grid>

          <DataGridV2
            data={allKeys}
            pagination
            columns={[
              {
                key: 'translateGroup',
                uniqueId: 'group',
                label: 'group',
                filter: true,
                avoidRowClick: true,
              },
              {
                key: 'translateKey',
                uniqueId: 'key',
                label: 'key',
                filter: true,
                avoidRowClick: true,
              },
              {
                key: 'translateKey',
                uniqueId: 'value',
                label: 'value',
                avoidRowClick: true,
                render: (key: any, translation: any) => {
                  return (
                    <Grid gap="0.5rem">
                      <Typography
                        translateGroup={translation.translateGroup}
                        translateKey={translation.translateKey}
                      />
                    </Grid>
                  )
                },
              },
            ]}
          />
        </Grid>
      )}
    </>
  )
}
