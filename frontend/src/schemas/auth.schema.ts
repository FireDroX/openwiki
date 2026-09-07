import { z } from 'zod'
import type { TFunction } from 'i18next'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const MIN_PASSWORD_LENGTH = 8
const PASSWORD_COMPLEXITY_REGEX = /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/
const DISPLAY_NAME_MIN_LENGTH = 2
const DISPLAY_NAME_MAX_LENGTH = 100

export function createLoginSchema(t: TFunction) {
  return z.object({
    email: z.string().regex(EMAIL_REGEX, t('auth.validation.emailInvalid')),
    password: z.string().min(1, t('auth.validation.passwordRequired')),
  })
}

export function createRegisterSchema(t: TFunction) {
  return z.object({
    email: z.string().regex(EMAIL_REGEX, t('auth.validation.emailInvalid')),
    password: z
      .string()
      .min(MIN_PASSWORD_LENGTH, t('auth.validation.passwordMinLength', { count: MIN_PASSWORD_LENGTH }))
      .regex(PASSWORD_COMPLEXITY_REGEX, t('auth.validation.passwordComplexity')),
    displayName: z
      .string()
      .min(DISPLAY_NAME_MIN_LENGTH, t('auth.validation.displayNameMinLength', { count: DISPLAY_NAME_MIN_LENGTH }))
      .max(DISPLAY_NAME_MAX_LENGTH, t('auth.validation.displayNameMaxLength', { count: DISPLAY_NAME_MAX_LENGTH })),
  })
}

export type LoginFormValues = z.infer<ReturnType<typeof createLoginSchema>>
export type RegisterFormValues = z.infer<ReturnType<typeof createRegisterSchema>>
