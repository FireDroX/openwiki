import { useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import { Button } from '#components/ui/button'
import { Field, FieldLabel } from '#components/ui/field'
import { Input } from '#components/ui/input'
import { FormError } from '#components/FormError'
import { updateMe } from '#api/users'
import type { AuthUser } from '#api/auth'
import { extractErrorMessage } from '#lib/api-errors'

interface ProfileFormProps {
  user: AuthUser
  onUpdate: (updated: AuthUser) => void
}

export function ProfileForm({ user, onUpdate }: ProfileFormProps) {
  const { t } = useTranslation()
  const [displayName, setDisplayName] = useState(user.displayName)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setPending(true)
    setError(null)
    try {
      const updated = await updateMe({ displayName })
      onUpdate(updated)
      toast.success(t('profile.updateSuccess'))
    } catch (err) {
      setError(extractErrorMessage(err, t('profile.updateFailed')))
    } finally {
      setPending(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex max-w-sm flex-col gap-4">
      <Field>
        <FieldLabel htmlFor="profile-display-name">{t('profile.displayNameLabel')}</FieldLabel>
        <Input
          id="profile-display-name"
          value={displayName}
          onChange={(event) => setDisplayName(event.target.value)}
          disabled={pending}
        />
      </Field>
      <FormError message={error} />
      <Button type="submit" disabled={pending} className="self-start">
        {t('profile.save')}
      </Button>
    </form>
  )
}
