import { useRef } from 'react'
import { ImagePlus, Paperclip } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '#components/ui/button'

export type FileUploadVariant = 'image' | 'attachment'

const VARIANT_CONFIG: Record<FileUploadVariant, { icon: typeof ImagePlus; accept: string; labelKey: string }> = {
  image: { icon: ImagePlus, accept: 'image/*,.pdf', labelKey: 'fileUpload.insertImage' },
  attachment: { icon: Paperclip, accept: '*/*', labelKey: 'fileUpload.attachFile' },
}

interface FileUploadButtonProps {
  variant: FileUploadVariant
  onFilesSelected: (files: FileList) => void
  disabled?: boolean
}

export function FileUploadButton({ variant, onFilesSelected, disabled }: FileUploadButtonProps) {
  const { t } = useTranslation()
  const inputRef = useRef<HTMLInputElement>(null)
  const { icon: Icon, accept, labelKey } = VARIANT_CONFIG[variant]
  const label = t(labelKey)

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        title={label}
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
      >
        <Icon />
        <span className="sr-only">{label}</span>
      </Button>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(event) => {
          if (event.target.files?.length) {
            onFilesSelected(event.target.files)
          }
          event.target.value = ''
        }}
      />
    </>
  )
}
