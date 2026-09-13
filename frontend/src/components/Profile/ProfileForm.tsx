import { useMemo, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Controller, useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Button } from '#components/ui/button'
import { Field, FieldError, FieldLabel } from '#components/ui/field'
import { Input } from '#components/ui/input'
import { FormError } from '#components/FormError'
import { updateMe } from '#api/users'
import type { AuthUser } from '#api/auth'
import { extractErrorMessage } from '#lib/api-errors'
import { createUpdateProfileSchema, type UpdateProfileFormValues } from '#schemas/profile.schema'

interface ProfileFormProps {
  user: AuthUser
  onUpdate: (updated: AuthUser) => void
}

export function ProfileForm({ user, onUpdate }: ProfileFormProps) {
  const { t } = useTranslation()
  const [submitError, setSubmitError] = useState<string | null>(null)
  const schema = useMemo(() => createUpdateProfileSchema(t), [t])

  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<UpdateProfileFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { displayName: user.displayName },
  })

  async function onSubmit(data: UpdateProfileFormValues) {
    setSubmitError(null)
    try {
      const updated = await updateMe(data)
      onUpdate(updated)
      toast.success(t('profile.updateSuccess'))
    } catch (error) {
      setSubmitError(extractErrorMessage(error, t('profile.updateFailed')))
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex max-w-sm flex-col gap-4">
      <Controller
        control={control}
        name="displayName"
        render={({ field, fieldState }) => (
          <Field data-invalid={!!fieldState.error}>
            <FieldLabel htmlFor="profile-display-name">{t('profile.displayNameLabel')}</FieldLabel>
            <Input {...field} id="profile-display-name" disabled={isSubmitting} />
            {fieldState.error && <FieldError>{fieldState.error.message}</FieldError>}
          </Field>
        )}
      />
      <FormError message={submitError} />
      <Button type="submit" disabled={isSubmitting} className="self-start">
        {t('profile.save')}
      </Button>
    </form>
  )
}
