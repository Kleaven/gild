// server-only — do not import from client components
import { env } from '../../env';

export function getWebAuthnConfig(): { rpID: string; rpName: string; origin: string } {
  const origin = env.NEXT_PUBLIC_APP_URL;
  const rpID = new URL(origin).hostname;
  return { rpID, rpName: 'Gild', origin };
}
