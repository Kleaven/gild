'use client';

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

// ─── Context shape ───────────────────────────────────────────────────────────
// The drawer is a single-conversation overlay — only one activeRecipientId at
// a time. Switching recipients while the drawer is open is supported: caller
// just invokes openChatWithUser(newId) and the drawer re-fetches.

type GildChatContextValue = {
  isChatOpen: boolean;
  activeRecipientId: string | null;
  /** Open the drawer to a specific user (or switch to another while open). */
  openChatWithUser: (userId: string) => void;
  /** Close the drawer — preserves activeRecipientId for the exit animation. */
  closeChat: () => void;
};

const GildChatContext = createContext<GildChatContextValue | null>(null);

// ─── Provider ────────────────────────────────────────────────────────────────
// Lightweight: a single useState pair, no useReducer ceremony. The drawer
// mounts at the layout shell and reads this context; trigger components
// (StudioMembers, profile cards) call openChatWithUser() to deploy it.

export function GildChatProvider({ children }: { children: ReactNode }) {
  const [activeRecipientId, setActiveRecipientId] = useState<string | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);

  const openChatWithUser = useCallback((userId: string) => {
    setActiveRecipientId(userId);
    setIsChatOpen(true);
  }, []);

  const closeChat = useCallback(() => {
    setIsChatOpen(false);
    // Don't null the recipient — AnimatePresence needs it for the exit frame.
    // The next open will overwrite it cleanly.
  }, []);

  const value = useMemo<GildChatContextValue>(
    () => ({ isChatOpen, activeRecipientId, openChatWithUser, closeChat }),
    [isChatOpen, activeRecipientId, openChatWithUser, closeChat],
  );

  return <GildChatContext.Provider value={value}>{children}</GildChatContext.Provider>;
}

// ─── Hook ────────────────────────────────────────────────────────────────────
// useGildChat() outside the provider returns a no-op shape rather than
// throwing — keeps trigger components (which might render in places the
// provider doesn't reach, e.g. marketing pages) from crashing. The Message
// button just won't do anything in that environment.

const NOOP_VALUE: GildChatContextValue = {
  isChatOpen: false,
  activeRecipientId: null,
  openChatWithUser: () => {},
  closeChat: () => {},
};

export function useGildChat(): GildChatContextValue {
  return useContext(GildChatContext) ?? NOOP_VALUE;
}
