import { Route, Routes } from 'react-router'
import { AppLayout } from '#components/layout/AppLayout'
import { AppLayoutSkeleton } from '#components/layout/AppLayoutSkeleton'
import { GlobalSearchCommand } from '#components/GlobalSearchCommand'
import { ProtectedRoute } from '#components/ProtectedRoute'
import { UserRole } from '#api/auth'
import { useAuth } from '#hooks/useAuth'
import { AdminAuditLog } from '#pages/AdminAuditLog'
import { AdminMcpAudit } from '#pages/AdminMcpAudit'
import { AdminMcpKeys } from '#pages/AdminMcpKeys'
import { AdminSettings } from '#pages/AdminSettings'
import { AdminUsers } from '#pages/AdminUsers'
import { Home } from '#pages/Home'
import { Login } from '#pages/Login'
import { PageCreate } from '#pages/PageCreate'
import { PageEditor } from '#pages/PageEditor'
import { PageHistory } from '#pages/PageHistory'
import { PageView } from '#pages/PageView'
import { SearchResults } from '#pages/SearchResults'

const EDITOR_ROLES = [UserRole.Editor, UserRole.Admin]

export function App() {
  const { status } = useAuth()

  if (status === 'loading') {
    return <AppLayoutSkeleton />
  }

  return (
    <>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route element={<ProtectedRoute roles={EDITOR_ROLES} />}>
          <Route path="/new" element={<PageCreate />} />
          <Route path="/edit/*" element={<PageEditor />} />
        </Route>
        <Route element={<AppLayout />}>
          <Route index element={<Home />} />
          <Route path="/pages/*" element={<PageView />} />
          <Route path="/history/*" element={<PageHistory />} />
          <Route path="/search" element={<SearchResults />} />
          <Route element={<ProtectedRoute roles={[UserRole.Admin]} />}>
            <Route path="/admin/users" element={<AdminUsers />} />
            <Route path="/admin/settings" element={<AdminSettings />} />
            <Route path="/admin/mcp/api-keys" element={<AdminMcpKeys />} />
            <Route path="/admin/mcp/audit-log" element={<AdminMcpAudit />} />
            <Route path="/admin/audit-log" element={<AdminAuditLog />} />
          </Route>
        </Route>
      </Routes>
      <GlobalSearchCommand />
    </>
  )
}
