import 'server-only';

export const FEATURE_FLAGS = {
  quizzes:          { default: true  },
  certificates:     { default: true  },
  drip_content:     { default: true  },
  invitations:      { default: true  },
  realtime:         { default: true  },
  events_space:     { default: true  },
  member_directory: { default: true  },
  chat_space:       { default: false },
  leaderboard:      { default: false },
  analytics:        { default: false },
  custom_domain:    { default: false },
  white_label:      { default: false },
  api_access:       { default: false },
} as const;

export type FlagName = keyof typeof FEATURE_FLAGS;
