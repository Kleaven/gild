export const gildKeyframes = `
  @keyframes gild-pulse { 
    0%, 100% { opacity: 1; } 
    50% { opacity: 0.55; } 
  }
  @keyframes gild-blink { 
    0%, 49% { opacity: 1; } 
    50%, 100% { opacity: 0; } 
  }
  button {
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1) !important;
  }
  button:hover:not(:disabled) {
    transform: translateY(-1px);
    filter: brightness(1.1);
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  }
  button:active:not(:disabled) {
    transform: translateY(0);
    filter: brightness(0.95);
  }
  a, [role="button"], .clickable {
    transition: all 0.2s ease;
    cursor: pointer;
  }
  a:hover {
    opacity: 0.7;
    text-decoration: underline;
  }
  a:active {
    opacity: 0.9;
  }
`;

export const GILD_FONTS = {
  display: 'var(--font-bricolage), "Inter", sans-serif',
  sans: 'var(--font-inter), system-ui, sans-serif',
  mono: 'var(--font-jetbrains), ui-monospace, monospace',
};

// Dark-mode design tokens for the platform admin console.
// Distinct from the light user-facing palette — admin is intentionally a dark
// ops surface. Mirrors the OKLCH usage pattern used throughout the user app.
export const GILD_ADMIN_TOKENS = {
  bg: {
    canvas: 'oklch(0.15 0 0)',
    surface: 'oklch(0.21 0 0)',
    surfaceSoft: 'oklch(0.21 0 0 / 60%)',
    surfaceFaint: 'oklch(0.21 0 0 / 40%)',
    raised: 'oklch(0.27 0 0)',
    raisedHover: 'oklch(0.32 0 0)',
    track: 'oklch(0.37 0 0)',
  },
  border: {
    default: 'oklch(0.27 0 0)',
    subtle: 'oklch(0.27 0 0 / 60%)',
    faint: 'oklch(0.27 0 0 / 40%)',
    focus: 'oklch(0.45 0 0)',
  },
  text: {
    primary: 'oklch(1 0 0)',
    body: 'oklch(0.92 0 0)',
    secondary: 'oklch(0.72 0 0)',
    muted: 'oklch(0.64 0 0)',
    subtle: 'oklch(0.55 0 0)',
    faint: 'oklch(0.45 0 0)',
  },
  accent: {
    success: 'oklch(0.70 0.18 155)',
    successText: 'oklch(0.78 0.16 155)',
    info: 'oklch(0.74 0.13 230)',
    warning: 'oklch(0.78 0.15 80)',
    danger: 'oklch(0.70 0.18 25)',
    dangerText: 'oklch(0.78 0.12 25)',
  },
  status: {
    proBg: 'oklch(0.30 0.10 80 / 40%)',
    proText: 'oklch(0.78 0.15 80)',
    badgeOkBg: 'oklch(0.20 0.08 155)',
    badgeOkText: 'oklch(0.84 0.14 155)',
    badgeOkBorder: 'oklch(0.55 0.16 155 / 40%)',
    warnBannerBg: 'oklch(0.20 0.05 80 / 30%)',
    warnBannerBorder: 'oklch(0.55 0.15 80 / 40%)',
    warnBannerHead: 'oklch(0.90 0.10 80)',
    warnBannerBody: 'oklch(0.92 0.05 80 / 70%)',
    errorBg: 'oklch(0.20 0.08 25 / 30%)',
    errorBorder: 'oklch(0.40 0.18 25 / 50%)',
    errorText: 'oklch(0.85 0.10 25)',
    errorToastBg: 'oklch(0.30 0.12 25 / 80%)',
    errorToastText: 'oklch(0.85 0.10 25)',
    errorHoverText: 'oklch(0.78 0.18 25)',
    errorHoverBorder: 'oklch(0.40 0.18 25 / 50%)',
    errorHoverBg: 'oklch(0.20 0.08 25 / 20%)',
  },
} as const;
