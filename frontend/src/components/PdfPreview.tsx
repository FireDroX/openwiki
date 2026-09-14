import { useState, type MouseEvent } from 'react'
import { FileText } from 'lucide-react'
import { cn } from '#lib/utils'

interface PdfPreviewProps {
  url: string
  filename: string
  className?: string
}

export function PdfPreview({ url, filename, className }: PdfPreviewProps) {
  const [failed, setFailed] = useState(false)

  function openInNewTab(event: MouseEvent) {
    event.stopPropagation()
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  if (failed) {
    return (
      <button
        type="button"
        onClick={openInNewTab}
        title={filename}
        className={cn(
          'flex flex-col items-center justify-center gap-1 bg-muted p-2 text-muted-foreground',
          className,
        )}
      >
        <FileText className="size-8" />
        <span className="w-full truncate text-center text-xs">{filename}</span>
      </button>
    )
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={openInNewTab}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          window.open(url, '_blank', 'noopener,noreferrer')
        }
      }}
      title={filename}
      className={cn('block cursor-pointer overflow-hidden', className)}
    >
      <iframe
        src={`${url}#toolbar=0&page=1`}
        title={filename}
        onError={() => setFailed(true)}
        className="pointer-events-none h-full w-full border-0"
      />
    </div>
  )
}
