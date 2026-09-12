import { type FormEvent, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '#components/ui/button'
import { Textarea } from '#components/ui/textarea'

const COMMENT_MAX_LENGTH = 2000

interface CommentFormProps {
  initialValue?: string
  submitLabel: string
  autoFocus?: boolean
  onSubmit: (content: string) => Promise<void>
  onCancel?: () => void
}

export function CommentForm({ initialValue = '', submitLabel, autoFocus, onSubmit, onCancel }: CommentFormProps) {
  const { t } = useTranslation()
  const [content, setContent] = useState(initialValue)
  const [pending, setPending] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const trimmed = content.trim()
    if (!trimmed || pending) return

    setPending(true)
    try {
      await onSubmit(trimmed)
      setContent('')
    } finally {
      setPending(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <Textarea
        value={content}
        onChange={(event) => setContent(event.target.value)}
        placeholder={t('comments.placeholder')}
        maxLength={COMMENT_MAX_LENGTH}
        autoFocus={autoFocus}
        rows={3}
      />
      <div className="flex justify-end gap-2">
        {onCancel && (
          <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
            {t('common.cancel')}
          </Button>
        )}
        <Button type="submit" size="sm" disabled={pending || !content.trim()}>
          {submitLabel}
        </Button>
      </div>
    </form>
  )
}
