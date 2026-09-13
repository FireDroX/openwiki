import i18n from '#lib/i18n'

const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ['year', 60 * 60 * 24 * 365],
  ['month', 60 * 60 * 24 * 30],
  ['day', 60 * 60 * 24],
  ['hour', 60 * 60],
  ['minute', 60],
]

const INTL_LOCALES: Record<string, string> = {
  fr: 'fr-FR',
  en: 'en-US',
}

export function intlLocale(): string {
  return INTL_LOCALES[i18n.language] ?? INTL_LOCALES.fr
}

export function formatRelativeTime(isoDate: string): string {
  const elapsedSeconds = (Date.parse(isoDate) - Date.now()) / 1000
  const formatter = new Intl.RelativeTimeFormat(intlLocale(), { numeric: 'auto' })

  for (const [unit, secondsInUnit] of UNITS) {
    if (Math.abs(elapsedSeconds) >= secondsInUnit) {
      return formatter.format(Math.round(elapsedSeconds / secondsInUnit), unit)
    }
  }

  return formatter.format(Math.round(elapsedSeconds), 'second')
}

export function formatDateTime(isoDate: string): string {
  return new Date(isoDate).toLocaleString(intlLocale(), {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

export function formatDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString(intlLocale(), { dateStyle: 'long' })
}
