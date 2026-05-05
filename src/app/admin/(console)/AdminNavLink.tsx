'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

type Props = {
  href: string;
  label: string;
};

export default function AdminNavLink({ href, label }: Props) {
  const pathname = usePathname();
  const isActive = href === '/admin' ? pathname === '/admin' : pathname.startsWith(href);
  return (
    <Link
      href={href}
      className={`block px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
        isActive
          ? 'bg-neutral-800 text-white'
          : 'text-neutral-400 hover:text-white hover:bg-neutral-800/50'
      }`}
    >
      {label}
    </Link>
  );
}
