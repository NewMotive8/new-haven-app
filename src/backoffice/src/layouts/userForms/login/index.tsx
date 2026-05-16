import Card from 'components/cards/card'
import Grid from 'components/uiKit/grid'
import Typography from 'components/uiKit/typography'
import React, { useContext, useState } from 'react'
import AuthContext from 'context/auth'
import AppLogo from 'assets/logo'
import { toastError, toastSuccess } from 'utils/functions/notifications'
import userApi from 'utils/services/api/requests/user'
import InputGroup from 'components/uiKit/inputs/inputGroup'
import Button from 'components/uiKit/buttons'
import { textTranslated } from 'components/TextTranslated'
import Loading from 'assets/loading'
import DialogContext from 'context/dialog'
import styles from './login.wrapper.module.scss'
import { DialogLoginProps, LoginI } from './types'
import validateForm from './formValidations'
import ResetPassword from './resetPassword/resetPassword'

export default function LoginForm(props: DialogLoginProps) {
  const { onLoginSuccess } = props
  const { saveNewToken } = useContext(AuthContext)
  const [loading, setLoading] = useState(false)
  const { displayDialog, removeDialog } = React.useContext(DialogContext)
  const [errors, setErrors] = useState<any>({ count: 0 })
  const [formData, setFormData] = useState<LoginI>({
    login: '',
    password: '',
    rememberMe: false,
  })

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const validationFormResult = validateForm(formData)
    if (validationFormResult?.count) {
      setErrors(validationFormResult)
      toastError(textTranslated({ group: 'toast-notifications', key: 'something-wrong-with-your-data' }))
    } else {
      setLoading(true)
      const { data }: any = await userApi.login(formData).catch((err: any) => {
        toastError(
          err?.response?.status === 401
            ? (
              <Typography
                translateGroup="login-form"
                translateKey="wrong-password"
                weight={600}
              />
            )
            : (
              <Typography
                translateGroup="login-form"
                translateKey="something-went-wrong"
                weight={600}
              />
            ),
        )
        setLoading(false)
        return {}
      })
      const { id_token: token, id: memberId } = data || {}
      setLoading(false)
      if (token) {
        saveNewToken(token)
        toastSuccess(
          <Typography
            translateGroup="login-form"
            translateKey="login-success"
          />,
        )
      }
    }
  }
  function handleResetPassword() {
    displayDialog({
      dialogId: 'RESET-PASSWORD',
      content: (<ResetPassword />),
  })
  }

  function updateField(fieldName: any, value: any) {
    setErrors((d: any) => {
      return { ...d, [fieldName]: '' }
    })

    setFormData((d: any) => {
      return { ...d, [fieldName]: value }
    })
  }

  return (
    <Grid 
      height="100vh" 
      verticalAlgin="center" 
      horizontalAlgin="center"
      style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
        backgroundSize: '400% 400%',
        animation: 'gradientShift 15s ease infinite',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <style jsx>{`
        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>
      <Grid
        responsiveWidth={{
          sm: 90,
          md: '900px',
          lg: '1000px',
        }}
        style={{
          position: 'relative',
          zIndex: 1,
        }}
      >
        <Grid>
          <Card className={styles.card} color="secondary">
            <Grid 
              verticalAlgin="stretch" 
              horizontalAlgin="center"
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                minHeight: '600px',
              }}
            >
              {/* Logo Section */}
              <Grid 
                responsiveWidth={{ sm: 0, md: '100%' }}
                className={styles.logoContainer}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Grid verticalAlgin="center" horizontalAlgin="center" style={{ width: '100%' }}>
                  <AppLogo width={250} height={80} />
                </Grid>
              </Grid>
              
              {/* Form Section */}
              <Grid 
                responsiveWidth={{ sm: 100, md: '100%' }} 
                className={styles.loginFormContainer}
              >
                <Grid padding={['p-5']}>
                  <Grid horizontalAlgin="flex-start" padding={['pb-4']}>
                    <div className={styles.loginTitle}>
                      <Typography
                        translateGroup="login"
                        translateKey="title"
                        weight={700}
                        size="xl"
                        style={{
                          textAlign: 'left',
                          fontSize: '2rem',
                          marginBottom: '0.5rem',
                        }}
                      />
                    </div>
                    <Grid horizontalAlgin="flex-start">
                      <div className={styles.loginSubtitle}>
                        <Typography
                          translateGroup="login"
                          translateKey="subtitle"
                          style={{
                            textAlign: 'left',
                            fontSize: '0.95rem',
                          }}
                        />
                      </div>
                    </Grid>
                  </Grid>
                  <form
                    onSubmit={handleSubmit}
                    style={{
                      width: '100%',
                    }}
                  >
                    <Grid gap="1.5rem">
                      <Grid className={styles.formGroup}>
                        <InputGroup
                          id="login"
                          name="login"
                          label="email"
                          feedback={errors?.login}
                          status={errors?.login && 'error'}
                          value={formData?.login}
                          onChange={({ target }) => { updateField(target.name, target.value) }}
                        />
                      </Grid>
                      <Grid className={styles.formGroup}>
                        <InputGroup
                          id="password"
                          name="password"
                          label="login-password"
                          inputType="password"
                          feedback={errors?.password}
                          status={errors?.password && 'error'}
                          value={formData?.password}
                          onChange={({ target }) => { updateField(target.name, target.value) }}
                        />
                      </Grid>
                      <Grid className={styles.formGroup}>
                        <InputGroup
                          id="rememberMe"
                          name="rememberMe"
                          label="rememberMe"
                          inputType="checkbox"
                          feedback={errors?.rememberMe}
                          status={errors?.rememberMe && 'error'}
                          value={formData?.rememberMe}
                          onChange={({ target }) => { updateField(target.name, target.value) }}
                        />
                      </Grid>
                      <Grid padding={['pt-2']}>
                        <Button
                          type="submit"
                          id="login-cta"
                          block
                          className={styles.submitButton}
                          style={{
                            marginBottom: '1rem',
                          }}
                        >
                          <Grid gap="0.5rem" horizontalAlgin="center">
                            {
                              loading && <Loading />
                            }
                            <Typography
                              translateGroup="login"
                              translateKey="submit"
                              weight={600}
                              style={{ color: 'white' }}
                            />
                          </Grid>
                        </Button>
                        <Button 
                          type="button" 
                          block 
                          onClick={() => handleResetPassword()} 
                          id="reset-password" 
                          color="link"
                          className={styles.resetPasswordButton}
                        >
                          <Typography
                            translateGroup="login"
                            translateKey="reset-password"
                            size="sm"
                            weight={500}
                          />
                        </Button>
                      </Grid>
                    </Grid>
                  </form>
                </Grid>
              </Grid>
            </Grid>
          </Card>
        </Grid>
      </Grid>
    </Grid>
  )
}
