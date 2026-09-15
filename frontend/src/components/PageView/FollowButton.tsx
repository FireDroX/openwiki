import { useState } from 'react'
import { Star } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '#components/ui/button'
import { followPage, unfollowPage } from '#api/pages'
import { cn } from '#lib/utils'

interface FollowButtonProps {
  pageId: string
  initialFollowed: boolean
}

export function FollowButton({ pageId, initialFollowed }: FollowButtonProps) {
  const { t } = useTranslation()
  const [isFollowed, setIsFollowed] = useState(initialFollowed)
  const [pending, setPending] = useState(false)

  async function toggle() {
    setPending(true)
    const next = !isFollowed
    try {
      await (next ? followPage(pageId) : unfollowPage(pageId))
      setIsFollowed(next)
    } finally {
      setPending(false)
    }
  }

  return (
    <Button variant="outline" size="sm" disabled={pending} onClick={() => void toggle()}>
      <Star className={cn(isFollowed && 'fill-current')} />
      {isFollowed ? t('pageView.unfollow') : t('pageView.follow')}
    </Button>
  )
}
