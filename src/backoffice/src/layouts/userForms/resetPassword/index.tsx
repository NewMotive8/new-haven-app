import Loading from 'assets/loading'
import AppLogo from 'assets/logo'
import { textTranslated } from 'components/TextTranslated'
import Card from 'components/cards/card'
import Button from 'components/uiKit/buttons'
import Grid from 'components/uiKit/grid'
import InputGroup from 'components/uiKit/inputs/inputGroup'
import Typography from 'components/uiKit/typography'
import { useRouter } from 'next/router'
import React, { useEffect, useState } from 'react'
import { toastError } from 'utils/functions/notifications'
import usersApi from 'utils/services/api/requests/users'
import validateForm from './formValidations'
import styles from './login.wrapper.module.scss'
import { ResetPasswordI } from './types'

export function ResetPassword() {
  const [errors, setErrors] = useState<any>({ count: 0 })
  const { push, query } = useRouter()

  const [formData, setFormData] = useState<ResetPasswordI>({
    newPassword: '',
    confirmNewPassword: '',
    key: '',
  })

  const [loading, setLoading] = useState(false)
  function updateField(fieldName: any, value: any) {
    setErrors((d: any) => {
      return { ...d, [fieldName]: '' }
    })

    setFormData((d: any) => {
      return { ...d, [fieldName]: value }
    })
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const validationFormResult = validateForm(formData)
    if (validationFormResult?.count) {
      setErrors(validationFormResult)
      toastError(
        textTranslated({
          group: 'toast-notifications',
          key: 'something-wrong-with-your-data',
        }),
      )
    } else {
      setLoading(true)
      await usersApi
        .resetPasswordFinish(formData)
        .then(() => {
          setLoading(false)
          push('/')
        })
        .catch((err: any) => {
          setLoading(false)
        })
    }
  }
  useEffect(() => {
    if (query.key) {
      updateField('key', query.key)
    }
  }, [query])
  return (
    <Grid height="100vh" verticalAlgin="center" horizontalAlgin="center">
      <Grid
        responsiveWidth={{
          sm: 80,
          md: '600px',
          lg: '600px',
        }}
      >
        <Grid>
          <Card className={styles.card} color="secondary">
            <Grid verticalAlgin="stretch" horizontalAlgin="center">
              <Grid responsiveWidth={{ sm: 0, md: 'calc(50% - 0.25rem)' }}>
                <Grid
                  verticalAlgin="center"
                  horizontalAlgin="center"
                  height={100}
                >
                  <AppLogo color="navbar-text-color" />
                </Grid>
              </Grid>
              <Grid
                responsiveWidth={{ sm: 100, md: 'calc(50% - 0.25rem)' }}
                width={50}
              >
                <Grid>
                  <Grid padding={['p-5', 'pt-0']}>
                    <Grid
                      horizontalAlgin="flex-start"
                      padding={['pt-5', 'pb-5']}
                    >
                      <Typography
                        translateGroup="Reset"
                        translateKey="title"
                        weight={700}
                        size="xl"
                        style={{
                          textAlign: 'left',
                        }}
                      />
                      <Grid horizontalAlgin="flex-start">
                        <Typography
                          translateGroup="Reset"
                          translateKey="subtitle"
                          style={{
                            textAlign: 'left',
                          }}
                        />
                      </Grid>
                    </Grid>
                    <form
                      onSubmit={handleSubmit}
                      style={{
                        width: '100%',
                      }}
                    >
                      <Grid gap="1rem">
                        <Grid>
                          <InputGroup
                            id="newPassword"
                            name="newPassword"
                            label="new-password"
                            inputType="password"
                            feedback={errors?.newPassword}
                            status={errors?.newPassword && 'error'}
                            value={formData?.newPassword}
                            onChange={({ target }) => {
                              updateField(target.name, target.value)
                            }}
                          />
                        </Grid>
                        <Grid>
                          <InputGroup
                            id="confirmNewPassword"
                            name="confirmNewPassword"
                            label="confirm-new-password"
                            inputType="password"
                            feedback={errors?.confirmNewPassword}
                            status={errors?.confirmNewPassword && 'error'}
                            value={formData?.confirmNewPassword}
                            onChange={({ target }) => {
                              updateField(target.name, target.value)
                            }}
                          />
                        </Grid>
                        <Grid padding={['pt-5']}>
                          <Button type="submit" id="login-cta" block>
                            <Grid gap="0.5rem" horizontalAlgin="center">
                              {loading && <Loading />}
                              <Typography
                                translateGroup="reset"
                                translateKey="submit"
                                weight={600}
                              />
                            </Grid>
                          </Button>
                        </Grid>
                      </Grid>
                    </form>
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
          </Card>
        </Grid>
      </Grid>
    </Grid>
  )
}
