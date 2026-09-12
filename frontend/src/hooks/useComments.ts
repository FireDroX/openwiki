import { useCallback, useEffect, useState } from 'react'
import { createComment, deleteComment, listComments, updateComment, type Comment } from '#api/comments'

export type CommentsStatus = 'loading' | 'ready' | 'error'

export interface UseCommentsResult {
  comments: Comment[]
  status: CommentsStatus
  addComment: (content: string, parentId?: string) => Promise<void>
  editComment: (commentId: string, content: string) => Promise<void>
  removeComment: (commentId: string) => Promise<void>
}

export function useComments(pageId: string | undefined): UseCommentsResult {
  const [comments, setComments] = useState<Comment[]>([])
  const [status, setStatus] = useState<CommentsStatus>('loading')

  const reload = useCallback(async () => {
    if (!pageId) return
    setStatus('loading')
    try {
      const result = await listComments(pageId)
      setComments(result)
      setStatus('ready')
    } catch {
      setStatus('error')
    }
  }, [pageId])

  useEffect(() => {
    void reload()
  }, [reload])

  async function addComment(content: string, parentId?: string): Promise<void> {
    if (!pageId) return
    await createComment(pageId, content, parentId)
    await reload()
  }

  async function editComment(commentId: string, content: string): Promise<void> {
    await updateComment(commentId, content)
    await reload()
  }

  async function removeComment(commentId: string): Promise<void> {
    await deleteComment(commentId)
    await reload()
  }

  return { comments, status, addComment, editComment, removeComment }
}
