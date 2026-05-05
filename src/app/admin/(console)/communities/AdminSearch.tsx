'use client';

import { useRouter } from 'next/navigation';
import { useRef } from 'react';

type Props = { defaultValue: string };

export default function AdminSearch({ defaultValue }: Props) {
  const router = useRouter();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
      placeholder="Search communities..."
      className="w-full max-w-sm bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-2 text-sm text-white placeholder-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-600"
    />
  );
}
