import { LogOut, Menu, Moon, Search, Shield, Sun, User } from 'lucide-react'
import { Link } from 'react-router'
import { useTranslation } from 'react-i18next'
import { useTheme } from 'next-themes'
import { Avatar, AvatarFallback } from '#components/ui/avatar'
import { Button } from '#components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '#components/ui/dropdown-menu'
import { InputGroup, InputGroupAddon, InputGroupInput } from '#components/ui/input-group'
import { GLOBAL_SEARCH_OPEN_EVENT } from '#components/GlobalSearchCommand'
import { UserRole } from '#api/auth'
import { useAuth } from '#hooks/useAuth'
import { useCurrentUser } from '#hooks/useCurrentUser'

interface TopbarProps {
  onOpenSidebar: () => void
}

export function Topbar({ onOpenSidebar }: TopbarProps) {
  const { t } = useTranslation()
  const user = useCurrentUser()
  const { status, logout } = useAuth()
  const { resolvedTheme, setTheme } = useTheme()

  return (
    <header className="flex h-14 w-full shrink-0 items-center gap-3 border-b border-border bg-background px-4">
      <Button variant="ghost" size="icon" className="md:hidden" onClick={onOpenSidebar}>
        <Menu />
        <span className="sr-only">{t('topbar.openSidebar')}</span>
      </Button>
      <Link to="/" className="flex shrink-0 items-center">
        <img src="/openwiki-logo.svg" alt={t('common.appName')} className="h-7 w-auto" />
      </Link>
      <button
        type="button"
        className="flex max-w-md flex-1 items-center"
        onClick={() => window.dispatchEvent(new Event(GLOBAL_SEARCH_OPEN_EVENT))}
      >
        <InputGroup className="pointer-events-none w-full">
          <InputGroupAddon>
            <Search />
          </InputGroupAddon>
          <InputGroupInput placeholder={t('topbar.searchPlaceholder')} readOnly tabIndex={-1} />
          <InputGroupAddon align="inline-end">
            <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
              Ctrl K
            </kbd>
          </InputGroupAddon>
        </InputGroup>
      </button>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
      >
        {resolvedTheme === 'dark' ? <Sun /> : <Moon />}
        <span className="sr-only">{t('topbar.toggleTheme')}</span>
      </Button>
      {status === 'authenticated' ? (
        <DropdownMenu>
          <DropdownMenuTrigger className="ml-auto rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
            <Avatar>
              <AvatarFallback>{user?.initials}</AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>
              <User />
              {t('topbar.profile')}
            </DropdownMenuItem>
            {user?.role === UserRole.Admin && (
              <DropdownMenuItem asChild>
                <Link to="/admin/users">
                  <Shield />
                  {t('topbar.administration')}
                </Link>
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={logout}>
              <LogOut />
              {t('topbar.logout')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <div className="ml-auto flex items-center gap-2">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/login">{t('auth.loginTab')}</Link>
          </Button>
          <Button size="sm" asChild>
            <Link to="/login?tab=register">{t('auth.registerTab')}</Link>
          </Button>
        </div>
      )}
    </header>
  )
}
