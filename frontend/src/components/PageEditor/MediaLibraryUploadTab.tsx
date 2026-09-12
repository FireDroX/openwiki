import { useRef, useState } from 'react'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import { Button } from '#components/ui/button'
import { uploadFile, type AttachmentDto } from '#api/media'
import { uploadErrorMessage } from '#hooks/useFileUpload'

interface MediaLibraryUploadTabProps {
  pageId?: string
  onUploaded: (item: AttachmentDto) => void
}

export function MediaLibraryUploadTab({ pageId, onUploaded }: MediaLibraryUploadTabProps) {
  const { t } = useTranslation()
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) {
      return
    }
    setUploading(true)
    try {
      const attachment = await uploadFile(file, pageId)
      onUploaded(attachment)
    } catch (error) {
      toast.error(uploadErrorMessage(error, t))
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border p-8 text-center">
      <p className="text-sm text-muted-foreground">{t('mediaLibrary.uploadHint')}</p>
      <Button type="button" disabled={uploading} onClick={() => inputRef.current?.click()}>
        {uploading ? t('mediaLibrary.uploading') : t('mediaLibrary.chooseFile')}
      </Button>
      <input ref={inputRef} type="file" className="hidden" onChange={handleChange} />
    </div>
  )
}
