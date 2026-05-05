import { requirePlatformAdmin } from '@/lib/admin/guards';
import AdminNavLink from './AdminNavLink';

type Props = { children: React.ReactNode };

export default async function AdminConsoleLayout({ children }: Props) {
  await requirePlatformAdmin();

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex">
      {/* Sidebar */}
      <aside className="w-56 shrink-0 border-r border-neutral-800 flex flex-col py-8 px-4 gap-1">
        <div className="px-3 mb-8">
          <span className="text-lg font-bold tracking-tight">Gild</span>
          <span className="ml-2 text-xs text-neutral-500 font-medium uppercase tracking-widest">
            Admin
          </span>
        </div>
        <AdminNavLink href="/admin" label="Overview" />
        <AdminNavLink href="/admin/communities" label="Communities" />
        <AdminNavLink href="/admin/flags" label="Feature Flags" />
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
