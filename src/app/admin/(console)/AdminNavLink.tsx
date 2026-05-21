'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { GILD_ADMIN_TOKENS, GILD_FONTS } from '@/components/gild/styles';

type Props = {
  href: string;
  label: string;
};

export default function AdminNavLink({ href, label }: Props) {
  const pathname = usePathname();
  const isActive = href === '/admin' ? pathname === '/admin' : pathname.startsWith(href);
  const [hover, setHover] = useState(false);

  const background = isActive
    ? GILD_ADMIN_TOKENS.bg.raised
    : hover
      ? GILD_ADMIN_TOKENS.bg.surfaceSoft
      : 'transparent';
  const color = isActive || hover ? GILD_ADMIN_TOKENS.text.primary : GILD_ADMIN_TOKENS.text.muted;

  return (
    <Link
      href={href}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: 'block',
        padding: '8px 12px',
        borderRadius: 8,
        fontSize: 14,
        fontWeight: 500,
        fontFamily: GILD_FONTS.sans,
        textDecoration: 'none',
        transition: 'background-color 150ms ease, color 150ms ease',
        background,
        color,
      }}
    >
      {label}
    </Link>
  );
}
