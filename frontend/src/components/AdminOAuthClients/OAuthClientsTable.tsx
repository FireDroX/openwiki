import { Ban } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '#components/ui/alert-dialog'
import { Badge } from '#components/ui/badge'
import { Button } from '#components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '#components/ui/table'
import type { OAuthClientSummary } from '#api/admin-oauth'
import { formatRelativeTime } from '#utils/relative-time'

interface OAuthClientsTableProps {
  clients: OAuthClientSummary[]
  pendingTokenId: string | null
  onRevoke: (clientId: string, tokenId: string, userDisplayName: string) => void
}

export function OAuthClientsTable({ clients, pendingTokenId, onRevoke }: OAuthClientsTableProps) {
  const { t } = useTranslation()

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t('admin.oauthClients.columnClient')}</TableHead>
          <TableHead>{t('admin.oauthClients.columnActiveTokens')}</TableHead>
          <TableHead>{t('admin.oauthClients.columnCreated')}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {clients.map((client) => (
          <TableRow key={client.id}>
            <TableCell className="align-top font-medium">{client.name}</TableCell>
            <TableCell className="align-top">
              {client.activeTokens.length === 0 ? (
                <span className="text-sm text-muted-foreground">{t('admin.oauthClients.noActiveTokens')}</span>
              ) : (
                <div className="flex flex-col gap-2">
                  {client.activeTokens.map((token) => {
                    const isPending = pendingTokenId === token.id
                    return (
                      <div key={token.id} className="flex items-center justify-between gap-2">
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">{token.userDisplayName}</span>
                          <span className="text-xs text-muted-foreground">
                            {t('admin.oauthClients.tokenCreated', { time: formatRelativeTime(token.createdAt) })}
                          </span>
                        </div>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button type="button" variant="ghost" size="icon-sm" disabled={isPending}>
                              <Ban />
                              <span className="sr-only">
                                {t('admin.oauthClients.revokeSr', { name: token.userDisplayName })}
                              </span>
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>{t('admin.oauthClients.revokeConfirmTitle')}</AlertDialogTitle>
                              <AlertDialogDescription>
                                {t('admin.oauthClients.revokeConfirmDescription', {
                                  name: token.userDisplayName,
                                  client: client.name,
                                })}
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                              <AlertDialogAction
                                variant="destructive"
                                onClick={() => onRevoke(client.id, token.id, token.userDisplayName)}
                              >
                                {t('admin.oauthClients.revokeConfirmAction')}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    )
                  })}
                </div>
              )}
            </TableCell>
            <TableCell className="align-top text-muted-foreground">
              <Badge variant="outline">{formatRelativeTime(client.createdAt)}</Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
