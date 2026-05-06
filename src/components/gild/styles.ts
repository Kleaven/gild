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
