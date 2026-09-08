import { useTranslation } from 'react-i18next'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '#components/ui/table'
import type { UserActivityLogItem } from '#api/user-activity-log'
import { formatRelativeTime } from '#utils/relative-time'

interface AdminActivityLogTableProps {
  items: UserActivityLogItem[]
}

export function AdminActivityLogTable({ items }: AdminActivityLogTableProps) {
  const { t } = useTranslation()

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t('admin.activityLog.columnDate')}</TableHead>
          <TableHead>{t('admin.activityLog.columnUser')}</TableHead>
          <TableHead>{t('admin.activityLog.columnAction')}</TableHead>
          <TableHead>{t('admin.activityLog.columnTarget')}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item) => (
          <TableRow key={item.id}>
            <TableCell className="text-muted-foreground">{formatRelativeTime(item.createdAt)}</TableCell>
            <TableCell>{item.userDisplayName}</TableCell>
            <TableCell className="font-mono">
              {t(`admin.activityLog.actions.${item.action}`, { defaultValue: item.action })}
            </TableCell>
            <TableCell className="font-mono text-muted-foreground">
              {item.targetType}
              {item.targetId ? ` · ${item.targetId}` : ''}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
