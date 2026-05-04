'use client';

import { usePathname } from 'next/navigation';

const STEPS = [
  { path: '/onboarding', label: 'Community' },
  { path: '/plan', label: 'Plan' },
  { path: '/checkout', label: 'Checkout' },
  { path: '/customize', label: 'Customize' },
  { path: '/spaces', label: 'Spaces' },
  { path: '/invite', label: 'Invite' },
  { path: '/done', label: 'Done' },
];

function getActiveStep(pathname: string): number {
  if (pathname === '/onboarding') return 0;
  for (let i = STEPS.length - 1; i >= 1; i--) {
    if (pathname.includes(STEPS[i]!.path)) return i;
  }
  return 0;
}

export default function OnboardingProgress() {
  const pathname = usePathname();
  const active = getActiveStep(pathname);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        marginBottom: 32,
      }}
    >
      {STEPS.map((step, i) => (
        <div key={step.path} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div
            title={step.label}
            style={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              background: i <= active ? '#000' : '#ddd',
              transition: 'background 0.2s',
            }}
          />
          {i < STEPS.length - 1 && (
            <div style={{ width: 20, height: 1, background: i < active ? '#000' : '#ddd' }} />
          )}
        </div>
      ))}
      <span style={{ marginLeft: 12, fontSize: 12, color: '#888' }}>
        Step {active + 1} of {STEPS.length}
      </span>
    </div>
  );
}
