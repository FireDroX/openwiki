import { useEffect, useState } from 'react'
import { Eye } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '#components/ui/dialog'
import { Button } from '#components/ui/button'
import { MarkdownRenderer } from '#components/MarkdownRenderer'
import { Skeleton } from '#components/ui/skeleton'
import { getVersion, type VersionDetail } from '#api/versions'
import { formatDateTime } from '#utils/relative-time'

interface VersionContentDialogProps {
  pageId: string
  versionId: string
}

export function VersionContentDialog({ pageId, versionId }: VersionContentDialogProps) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [version, setVersion] = useState<VersionDetail | null>(null)

  useEffect(() => {
    if (!open) {
      return
    }
    let cancelled = false
    getVersion(pageId, versionId).then((result) => {
      if (!cancelled) setVersion(result)
    })
    return () => {
      cancelled = true
    }
  }, [open, pageId, versionId])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="ghost" size="icon-sm">
          <Eye />
          <span className="sr-only">{t('pageHistory.viewVersionSr')}</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[80vh] max-w-2xl overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{version?.title ?? t('pageHistory.versionContentTitle')}</DialogTitle>
          {version && <DialogDescription>{formatDateTime(version.createdAt)}</DialogDescription>}
        </DialogHeader>
        {version ? (
          <MarkdownRenderer content={version.content} mode="full" />
        ) : (
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
