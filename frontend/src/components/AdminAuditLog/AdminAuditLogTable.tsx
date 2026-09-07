import { useTranslation } from 'react-i18next'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '#components/ui/table'
import type { AdminAuditLogItem } from '#api/admin-audit-log'
import { formatRelativeTime } from '#utils/relative-time'

interface AdminAuditLogTableProps {
  items: AdminAuditLogItem[]
}

export function AdminAuditLogTable({ items }: AdminAuditLogTableProps) {
  const { t } = useTranslation()

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t('admin.auditLog.columnDate')}</TableHead>
          <TableHead>{t('admin.auditLog.columnAdmin')}</TableHead>
          <TableHead>{t('admin.auditLog.columnAction')}</TableHead>
          <TableHead>{t('admin.auditLog.columnTarget')}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item) => (
          <TableRow key={item.id}>
            <TableCell className="text-muted-foreground">{formatRelativeTime(item.createdAt)}</TableCell>
            <TableCell>{item.adminDisplayName}</TableCell>
            <TableCell className="font-mono">
              {t(`admin.auditLog.actions.${item.action}`, { defaultValue: item.action })}
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
