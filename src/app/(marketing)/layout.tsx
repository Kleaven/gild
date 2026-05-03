import Link from 'next/link';

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <nav
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: 16,
          padding: '16px 32px',
          borderBottom: '1px solid #eee',
        }}
      >
        <Link href="/sign-in" style={{ color: '#333', textDecoration: 'none', fontWeight: 500 }}>
          Sign in
        </Link>
        <Link
          href="/sign-up"
          style={{
            background: '#000',
            color: '#fff',
            padding: '8px 16px',
            borderRadius: 6,
            textDecoration: 'none',
            fontWeight: 600,
            fontSize: 14,
          }}
        >
          Sign up
        </Link>
      </nav>
      {children}
    </>
  );
}
