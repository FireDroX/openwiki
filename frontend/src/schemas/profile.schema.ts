import { z } from 'zod'
import type { TFunction } from 'i18next'

const DISPLAY_NAME_MIN_LENGTH = 2
const DISPLAY_NAME_MAX_LENGTH = 100
const MIN_PASSWORD_LENGTH = 8
const PASSWORD_COMPLEXITY_REGEX = /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/

export function createUpdateProfileSchema(t: TFunction) {
  return z.object({
    displayName: z
      .string()
      .min(DISPLAY_NAME_MIN_LENGTH, t('auth.validation.displayNameMinLength', { count: DISPLAY_NAME_MIN_LENGTH }))
      .max(DISPLAY_NAME_MAX_LENGTH, t('auth.validation.displayNameMaxLength', { count: DISPLAY_NAME_MAX_LENGTH })),
  })
}

export function createChangePasswordSchema(t: TFunction) {
  return z.object({
    currentPassword: z.string().min(1, t('auth.validation.passwordRequired')),
    newPassword: z
      .string()
      .min(MIN_PASSWORD_LENGTH, t('auth.validation.passwordMinLength', { count: MIN_PASSWORD_LENGTH }))
      .regex(PASSWORD_COMPLEXITY_REGEX, t('auth.validation.passwordComplexity')),
  })
}

export type UpdateProfileFormValues = z.infer<ReturnType<typeof createUpdateProfileSchema>>
export type ChangePasswordFormValues = z.infer<ReturnType<typeof createChangePasswordSchema>>
