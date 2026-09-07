import { useMemo, useState } from 'react'
import { Navigate, useNavigate, useSearchParams } from 'react-router'
import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { FormError } from '#components/FormError'
import { TurnstileWidget } from '#components/Turnstile'
import { Button } from '#components/ui/button'
import { Field, FieldError, FieldGroup, FieldLabel } from '#components/ui/field'
import { Input } from '#components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '#components/ui/tabs'
import { useAuth } from '#hooks/useAuth'
import { extractErrorMessage } from '#lib/api-errors'
import { createLoginSchema, createRegisterSchema, type LoginFormValues, type RegisterFormValues } from '#schemas/auth.schema'

function LoginForm() {
  const { t } = useTranslation()
  const { login } = useAuth()
  const navigate = useNavigate()
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null)
  const schema = useMemo(() => createLoginSchema(t), [t])

  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  })

  async function onSubmit(data: LoginFormValues) {
    if (turnstileToken === null) return
    setSubmitError(null)
    try {
      await login({ ...data, turnstileToken })
      navigate('/', { replace: true })
    } catch (error) {
      setSubmitError(extractErrorMessage(error))
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <FieldGroup>
        <Controller
          control={control}
          name="email"
          render={({ field, fieldState }) => (
            <Field data-invalid={!!fieldState.error}>
              <FieldLabel htmlFor="login-email">{t('auth.emailLabel')}</FieldLabel>
              <Input {...field} id="login-email" type="email" autoComplete="email" />
              {fieldState.error && <FieldError>{fieldState.error.message}</FieldError>}
            </Field>
          )}
        />
        <Controller
          control={control}
          name="password"
          render={({ field, fieldState }) => (
            <Field data-invalid={!!fieldState.error}>
              <FieldLabel htmlFor="login-password">{t('auth.passwordLabel')}</FieldLabel>
              <Input {...field} id="login-password" type="password" autoComplete="current-password" />
              {fieldState.error && <FieldError>{fieldState.error.message}</FieldError>}
            </Field>
          )}
        />
        <TurnstileWidget onVerify={setTurnstileToken} onExpire={() => setTurnstileToken(null)} />
        <FormError message={submitError} />
        <Button type="submit" disabled={isSubmitting || turnstileToken === null} className="w-full">
          {t('auth.signIn')}
        </Button>
      </FieldGroup>
    </form>
  )
}

function RegisterForm() {
  const { t } = useTranslation()
  const { register } = useAuth()
  const navigate = useNavigate()
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null)
  const schema = useMemo(() => createRegisterSchema(t), [t])

  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '', displayName: '' },
  })

  async function onSubmit(data: RegisterFormValues) {
    if (turnstileToken === null) return
    setSubmitError(null)
    try {
      await register({ ...data, turnstileToken })
      navigate('/', { replace: true })
    } catch (error) {
      setSubmitError(extractErrorMessage(error))
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <FieldGroup>
        <Controller
          control={control}
          name="displayName"
          render={({ field, fieldState }) => (
            <Field data-invalid={!!fieldState.error}>
              <FieldLabel htmlFor="register-display-name">{t('auth.displayNameLabel')}</FieldLabel>
              <Input {...field} id="register-display-name" autoComplete="name" />
              {fieldState.error && <FieldError>{fieldState.error.message}</FieldError>}
            </Field>
          )}
        />
        <Controller
          control={control}
          name="email"
          render={({ field, fieldState }) => (
            <Field data-invalid={!!fieldState.error}>
              <FieldLabel htmlFor="register-email">{t('auth.emailLabel')}</FieldLabel>
              <Input {...field} id="register-email" type="email" autoComplete="email" />
              {fieldState.error && <FieldError>{fieldState.error.message}</FieldError>}
            </Field>
          )}
        />
        <Controller
          control={control}
          name="password"
          render={({ field, fieldState }) => (
            <Field data-invalid={!!fieldState.error}>
              <FieldLabel htmlFor="register-password">{t('auth.passwordLabel')}</FieldLabel>
              <Input {...field} id="register-password" type="password" autoComplete="new-password" />
              {fieldState.error && <FieldError>{fieldState.error.message}</FieldError>}
            </Field>
          )}
        />
        <TurnstileWidget onVerify={setTurnstileToken} onExpire={() => setTurnstileToken(null)} />
        <FormError message={submitError} />
        <Button type="submit" disabled={isSubmitting || turnstileToken === null} className="w-full">
          {t('auth.createAccount')}
        </Button>
      </FieldGroup>
    </form>
  )
}

export function Login() {
  const { t } = useTranslation()
  const { status } = useAuth()
  const [searchParams] = useSearchParams()
  const defaultTab = searchParams.get('tab') === 'register' ? 'register' : 'login'

  if (status === 'authenticated') {
    return <Navigate to="/" replace />
  }

  return (
    <div className="flex min-h-svh items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-sm rounded-lg border border-border bg-card p-6 shadow-sm">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-semibold">{t('common.appName')}</h1>
          <p className="text-sm text-muted-foreground">{t('auth.appTagline')}</p>
        </div>
        <Tabs defaultValue={defaultTab}>
          <TabsList className="w-full">
            <TabsTrigger value="login">{t('auth.loginTab')}</TabsTrigger>
            <TabsTrigger value="register">{t('auth.registerTab')}</TabsTrigger>
          </TabsList>
          <TabsContent value="login" className="pt-4">
            <LoginForm />
          </TabsContent>
          <TabsContent value="register" className="pt-4">
            <RegisterForm />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
