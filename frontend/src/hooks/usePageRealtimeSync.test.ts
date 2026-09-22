import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { usePageRealtimeSync } from './usePageRealtimeSync'

const handlers: Record<string, (payload: { pageId: string }) => void> = {}
const mockSocket = {
  emit: vi.fn(),
  on: vi.fn((event: string, handler: (payload: { pageId: string }) => void) => {
    handlers[event] = handler
  }),
  off: vi.fn(),
}

vi.mock('#lib/realtime-client', () => ({
  getRealtimeSocket: () => mockSocket,
}))

const mergePreviewMock = vi.fn()
vi.mock('#api/pages', () => ({
  mergePreview: (...args: unknown[]) => mergePreviewMock(...args),
}))

describe('usePageRealtimeSync', () => {
  beforeEach(() => {
    mockSocket.emit.mockClear()
    mockSocket.on.mockClear()
    mergePreviewMock.mockReset()
  })

  it('joins the page room on mount and leaves it on unmount', () => {
    const { unmount } = renderHook(() =>
      usePageRealtimeSync('page-1', {
        getBaseVersionId: () => 'version-1',
        getContent: () => 'my draft',
        onMergeResult: vi.fn(),
      }),
    )

    expect(mockSocket.emit).toHaveBeenCalledWith('page:join', { pageId: 'page-1' })

    unmount()

    expect(mockSocket.emit).toHaveBeenCalledWith('page:leave', { pageId: 'page-1' })
  })

  it('previews and reports a merge result when a version-created event arrives for this page', async () => {
    const onMergeResult = vi.fn()
    mergePreviewMock.mockResolvedValue({
      conflict: false,
      mergedContent: 'merged content',
      newBaseVersionId: 'version-2',
    })

    renderHook(() =>
      usePageRealtimeSync('page-1', {
        getBaseVersionId: () => 'version-1',
        getContent: () => 'my draft',
        onMergeResult,
      }),
    )

    handlers['page:version-created']({ pageId: 'page-1' })

    await waitFor(() => {
      expect(onMergeResult).toHaveBeenCalledWith({
        conflict: false,
        mergedContent: 'merged content',
        newBaseVersionId: 'version-2',
      })
    })
    expect(mergePreviewMock).toHaveBeenCalledWith('page-1', {
      baseVersionId: 'version-1',
      content: 'my draft',
    })
  })

  it('ignores version-created events for a different page', () => {
    const onMergeResult = vi.fn()

    renderHook(() =>
      usePageRealtimeSync('page-1', {
        getBaseVersionId: () => 'version-1',
        getContent: () => 'my draft',
        onMergeResult,
      }),
    )

    handlers['page:version-created']({ pageId: 'other-page' })

    expect(mergePreviewMock).not.toHaveBeenCalled()
  })
})
