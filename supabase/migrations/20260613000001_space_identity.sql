-- Per-space identity: accent hue + emoji icon, owner/admin editable from
-- Space Settings. NULL hue falls back to the community accent.
SET search_path = public, extensions;

ALTER TABLE public.spaces
  ADD COLUMN IF NOT EXISTS color_hue integer CHECK (color_hue >= 0 AND color_hue <= 360),
  ADD COLUMN IF NOT EXISTS icon text CHECK (char_length(icon) <= 16);
