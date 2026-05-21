'use client';

import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';
import { GILD_ADMIN_TOKENS, GILD_FONTS } from '@/components/gild/styles';

type Props = { defaultValue: string };

export default function AdminSearch({ defaultValue }: Props) {
  const router = useRouter();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [focused, setFocused] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      if (val) {
        router.push(`/admin/communities?q=${encodeURIComponent(val)}`);
      } else {
        router.push('/admin/communities');
      }
    }, 300);
  };

  return (
    <input
      type="search"
      defaultValue={defaultValue}
      onChange={handleChange}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      placeholder="Search communities..."
      style={{
        width: '100%',
        maxWidth: 384,
        background: GILD_ADMIN_TOKENS.bg.surface,
        border: `1px solid ${focused ? GILD_ADMIN_TOKENS.border.focus : GILD_ADMIN_TOKENS.border.default}`,
        borderRadius: 8,
        padding: '8px 16px',
        fontSize: 14,
        fontFamily: GILD_FONTS.sans,
        color: GILD_ADMIN_TOKENS.text.primary,
        outline: 'none',
        transition: 'border-color 150ms ease',
      }}
    />
  );
}
