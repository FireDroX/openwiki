import { useCallback, type RefObject } from 'react'
import { isAxiosError } from 'axios'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import type { TFunction } from 'i18next'
import type { MarkdownEditorHandle } from '#components/PageEditor/MarkdownEditor'
import type { FileUploadVariant } from '#components/PageEditor/FileUploadButton'
import { uploadFile } from '#api/media'
import { extractErrorMessage } from '#lib/api-errors'

export function uploadErrorMessage(error: unknown, t: TFunction): string {
  if (isAxiosError(error) && error.response?.status === 413) {
    return t('fileUpload.tooLarge')
  }
  if (isAxiosError(error) && error.response?.status === 415) {
    return t('fileUpload.unsupportedType')
  }
  return extractErrorMessage(error, t('fileUpload.uploadFailed'))
}

export function useFileUpload(
  editorRef: RefObject<MarkdownEditorHandle | null>,
  pageId?: string,
  variant: FileUploadVariant = 'image',
) {
  const { t } = useTranslation()

  return useCallback(
    async (files: FileList) => {
      const file = files[0]
      if (!file) {
        return
      }

      const placeholder = `${variant === 'image' ? '!' : ''}[${t('fileUpload.sending', { filename: file.name })}]()`
      editorRef.current?.insertAtCursor(placeholder)

      try {
        const attachment = await uploadFile(file, pageId)
        const markdown = `${variant === 'image' ? '!' : ''}[${attachment.filename}](${attachment.url})`
        editorRef.current?.replaceText(placeholder, markdown)
      } catch (error) {
        editorRef.current?.replaceText(placeholder, '')
        toast.error(uploadErrorMessage(error, t))
      }
    },
    [editorRef, pageId, variant, t],
  )
}
