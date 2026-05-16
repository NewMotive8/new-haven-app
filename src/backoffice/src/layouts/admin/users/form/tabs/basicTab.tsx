import { textTranslated } from 'components/TextTranslated'
import Grid from 'components/uiKit/grid'
import Toggle from 'components/uiKit/inputs/Toggle'
import TypeButton from 'components/uiKit/inputs/TypeButton'
import InputGroup from 'components/uiKit/inputs/inputGroup'
import Typography from 'components/uiKit/typography'
import React from 'react'
import { useAccountInfo, userAccessByRole } from 'utils/customHooks/useRole'
import { userRoleType } from 'utils/services/api/requests/user'
import Button from 'components/uiKit/buttons'
import usersApi from 'utils/services/api/requests/users'
import { FormContext } from '..'
import { CrudContext } from '../..'
import BrandsAccess from '../components/brandsAccess'

export default function BasicTab() {
  const { selectedItem } = React.useContext(CrudContext)
  const { errors, updateField, setCurrentInfo } = React.useContext(FormContext)
  const { role } = useAccountInfo()
  const options = [
    {
      label: (
        <Typography translateGroup="typebutton-user" translateKey="user" />
      ),
      value: 'USER',
    },
    {
      label: (
        <Typography translateGroup="typebutton-user" translateKey="admin" />
      ),
      value: 'ADMIN',
    },
    {
      label: (
        <Typography translateGroup="typebutton-user" translateKey="root" />
      ),
      value: 'ROOT',
    },
  ].filter((item) => userAccessByRole[role].includes(item.value as userRoleType))

  return (
    <Grid gap="0.5rem">
      <Grid wrap="nowrap" gap="0.5rem">
        <InputGroup
          id="name"
          name="name"
          label="users-name"
          feedback={errors?.name}
          status={errors?.name && 'error'}
          value={selectedItem.name}
          onChange={({ target }) => {
            updateField(target.name, target.value)
          }}
          onFocus={() => setCurrentInfo(
              textTranslated({
                group: 'forms-tabs-helpers',
                key: 'input-name-help',
                returnDefault: 'nothing',
              }),
            )}
        />
        <InputGroup
          id="email"
          name="email"
          label="email"
          feedback={errors?.email}
          status={errors?.email && 'error'}
          value={selectedItem.email}
          onChange={({ target }) => {
            updateField(target.name, target.value)
          }}
          onFocus={() => setCurrentInfo(
              textTranslated({
                group: 'forms-tabs-helpers',
                key: 'input-email-help',
                returnDefault: 'nothing',
              }),
            )}
        />
      </Grid>
      <Grid
        gap="0.5rem"
        responsiveWidth={{ sm: 100, md: 'calc(50% - 0.25rem)' }}
      >
        <Typography translateGroup="input-typeButton" translateKey="role" />
        <TypeButton
          name="role"
          value={selectedItem.role}
          onChange={({ target }) => {
            updateField(target.name, target.value)
          }}
          options={options}
        />
      </Grid>
      <Grid responsiveWidth={{ sm: 100, md: 'calc(50% - 0.25rem)' }}>
        <Toggle
          label="enabled"
          name="enabled"
          id="enabled"
          value={selectedItem.enabled}
          onChange={({ target }: any) => {
            updateField(target.name, target.value)
          }}
          displayInfo={
            !!textTranslated({
              group: 'forms-tabs-helpers',
              key: 'input-currency-enabled-help',
              returnDefault: 'nothing',
            })
          }
          onFocus={() => setCurrentInfo(
              textTranslated({
                group: 'forms-tabs-helpers',
                key: 'input-currency-enabled-help',
                returnDefault: 'nothing',
              }),
            )}
        />
      </Grid>
      {!selectedItem?.id ? (
        <Grid responsiveWidth={{ sm: 100, md: 'calc(50% - 0.25rem)' }}>
          <InputGroup
            id="password"
            name="password"
            label="users-password"
            inputType="password"
            feedback={errors?.password}
            status={errors?.password && 'error'}
            value={selectedItem.password}
            onChange={({ target }) => {
              updateField(target.name, target.value)
            }}
            onFocus={() => setCurrentInfo(
                textTranslated({
                  group: 'forms-tabs-helpers',
                  key: 'input-password-help',
                  returnDefault: 'nothing',
                }),
              )}
          />
        </Grid>
      ) : (
        <Grid
          responsiveWidth={{ sm: 100, md: 'calc(25% - 0.25rem)' }}
          wrap="wrap"
          gap="0.5rem"
        >
          <Grid>
            <Typography
              translateGroup="label-reset"
              translateKey="reset-user-passoword"
            />
          </Grid>
          <Grid>
            <Button
              id="reset-password-button"
              type="button"
              color="primary"
              onClick={() => usersApi.resetPassword({ email: selectedItem.email })}
            >
              <Typography
                translateGroup="reset-password-button"
                translateKey="reset-password"
                weight={600}
              />
            </Button>
          </Grid>
        </Grid>
      )}
      <Grid style={{ maxHeight: '60vh' }}>
        <Grid padding="pt-5">
          <Grid margin="mb-2" horizontalAlgin="center">
            <Typography
              translateGroup="user-title"
              translateKey="Set here the brands to have access"
            />
          </Grid>
          <BrandsAccess />
        </Grid>
      </Grid>
    </Grid>
  )
}
