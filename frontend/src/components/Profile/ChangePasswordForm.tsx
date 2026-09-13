import { useState, type FormEvent } from 'react'
import { isAxiosError } from 'axios'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import type { TFunction } from 'i18next'
import { Button } from '#components/ui/button'
import { Field, FieldLabel } from '#components/ui/field'
import { Input } from '#components/ui/input'
import { FormError } from '#components/FormError'
import { changePassword } from '#api/auth'
import { extractErrorMessage } from '#lib/api-errors'

function changePasswordErrorMessage(error: unknown, t: TFunction): string {
  if (isAxiosError(error) && error.response?.status === 401) {
    return t('profile.security.incorrectCurrentPassword')
  }
  return extractErrorMessage(error, t('profile.security.updateFailed'))
}

export function ChangePasswordForm() {
  const { t } = useTranslation()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setPending(true)
    setError(null)
    try {
      await changePassword(currentPassword, newPassword)
      setCurrentPassword('')
      setNewPassword('')
      toast.success(t('profile.security.updateSuccess'))
    } catch (err) {
      setError(changePasswordErrorMessage(err, t))
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <h2 className="font-heading text-lg font-semibold">{t('profile.security.passwordTitle')}</h2>
      <form onSubmit={handleSubmit} className="mt-4 flex max-w-sm flex-col gap-4">
        <Field>
          <FieldLabel htmlFor="current-password">{t('profile.security.currentPasswordLabel')}</FieldLabel>
          <Input
            id="current-password"
            type="password"
            autoComplete="current-password"
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
            disabled={pending}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="new-password">{t('profile.security.newPasswordLabel')}</FieldLabel>
          <Input
            id="new-password"
            type="password"
            autoComplete="new-password"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            disabled={pending}
          />
        </Field>
        <FormError message={error} />
        <Button type="submit" disabled={pending} className="self-start">
          {t('profile.security.submit')}
        </Button>
      </form>
    </div>
  )
}
