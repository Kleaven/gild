export type MemberRole = 'owner' | 'admin' | 'moderator' | 'tier2_member' | 'tier1_member' | 'free_member' | 'banned';

export interface Person {
  id: string;
  name: string;
  handle?: string | null;
  email?: string;
  role: MemberRole;
  hue: number;
  online?: boolean;
  initial?: string;
}

export interface Space {
  id: string;
  name: string;
  desc: string;
  hue: number;
  members?: number;
  online?: number;
  posts?: number;
}

export interface Post {
  id: string | number;
  author: string;
  space: string;
  date: string;
  title?: string | null;
  body: string;
  image?: string | null;
  likes?: number;
  comments?: number;
  reactions?: [string, number][];
  pinned?: boolean;
  link?: {
    url: string;
    title: string;
    desc: string;
  };
}
