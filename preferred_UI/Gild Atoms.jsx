// Shared data + atoms for all four Gild directions.
// (cache bust)

const PEOPLE = [
  { id:'jordan', name:'Jordan Reyes',  handle:'jordan',  role:'owner',   hue: 220, online:true,  away:false },
  { id:'mira',   name:'Mira Patel',    handle:'mira',    role:'admin',   hue: 320, online:true,  away:false },
  { id:'sam',    name:'Sam Okafor',    handle:'sam',     role:'member',  hue: 150, online:true,  away:false },
  { id:'lena',   name:'Lena Vogel',    handle:'lena',    role:'member',  hue:  42, online:true,  away:false },
  { id:'kai',    name:'Kai Tanaka',    handle:'kaitn',   role:'member',  hue: 280, online:true,  away:false },
  { id:'ava',    name:'Ava Martinez',  handle:'ava',     role:'member',  hue:  14, online:false, away:false },
  { id:'theo',   name:'Theo Brand',    handle:'theo',    role:'member',  hue: 195, online:false, away:false },
  { id:'noor',   name:'Noor Hassan',   handle:'noor',    role:'admin',   hue:  85, online:false, away:false },
  { id:'ines',   name:'Inés Ribeiro',  handle:'ines',    role:'member',  hue: 350, online:false, away:false },
  { id:'felix',  name:'Felix Wu',      handle:'felix',   role:'member',  hue: 250, online:false, away:false },
];
const personFor = id => PEOPLE.find(p => p.id === id) || PEOPLE[0];

const SPACES = [
  { id:'announcements', name:'Announcements', desc:'Releases, weekly digests, and what’s shipping.', hue: 42,  members: 248, online: 5, posts: 134 },
  { id:'building',      name:'Building',      desc:'Work-in-progress, screenshots, code, and rough drafts.', hue: 220, members: 196, online: 4, posts: 412 },
  { id:'general',       name:'General',       desc:'Coffee chat, intros, and off-topic.', hue: 14,  members: 248, online: 8, posts: 287 },
  { id:'wins',          name:'Wins',          desc:'Ship logs, paid launches, milestone moments.', hue: 150, members: 220, online: 3, posts: 98 },
  { id:'feedback',      name:'Feedback',      desc:'Roadmap, requests, and product critique.', hue: 280, members: 168, online: 2, posts: 76 },
  { id:'library',       name:'Library',       desc:'Long reads, links, and saved threads.', hue: 195, members: 248, online: 1, posts: 36 },
];
const spaceFor = id => SPACES.find(s => s.id === id) || SPACES[0];

const POSTS = [
  { id:1, author:'mira', space:'announcements', date:'2h', pinned:true,
    title:'New: realtime presence + reactions are live',
    body:'You can now see who’s reading what in real time, and react with up to five emoji per post. Rolled out to everyone on Pro this morning. Tell us where it breaks.',
    image:'wash', likes: 84, comments: 23,
    reactions:[['✨',24],['❤️',18],['💪',12]] },
  { id:2, author:'jordan', space:'building', date:'4h',
    title:'Pricing page rewrite — three takes',
    body:'I cut the feature comparison and replaced it with a single big number: zero transaction fees. Three drafts attached. Want a sanity check before I push to staging on Friday.',
    image:'chart', likes: 41, comments: 17,
    reactions:[['🔥',9],['👀',6]] },
  { id:3, author:'sam', space:'wins', date:'yesterday',
    title:null,
    body:'$11k MRR this morning. Took 14 months. Posting here because every milestone post on Twitter feels like shouting into a wind tunnel. Thanks for being a calmer room.',
    image:null, likes: 132, comments: 38,
    reactions:[['🎉',42],['🙌',24],['💥',11]] },
  { id:4, author:'lena', space:'library', date:'2d',
    title:'Read this on community moderation if you run a paid space',
    body:'Short essay from a moderator who ran a 50k-member paid Discord for three years. The bit about "disagreement vs. distress" is the cleanest framing I’ve seen.',
    image:null,
    link:{ url:'arena.com/blocks/moderation', title:'Disagreement vs. distress: a field guide',
      desc:'Three years inside a 50k-person paid community. Where to step in, where to step away.' },
    likes: 56, comments: 11,
    reactions:[['📖',14],['🧠',7]] },
  { id:5, author:'kai', space:'general', date:'3d',
    title:null,
    body:'Hi all — just joined. Building a small cohort for indie iOS devs. Looking for advice from anyone who’s run a paid Slack/Discord for under 100 people. Worth the lift?',
    image:null, likes: 22, comments: 14,
    reactions:[['👋',9]] },
];

const MEMBERS = [
  { id:'jordan', name:'Jordan Reyes', handle:'jordan', email:'jordan@acme.co', role:'owner', joined:'Mar 12, 2024', posts: 84, online:true, hue: 220 },
  { id:'mira',   name:'Mira Patel',   handle:'mira',   email:'mira@acme.co',   role:'admin', joined:'Apr 04, 2024', posts: 142, online:true, hue: 320 },
  { id:'noor',   name:'Noor Hassan',  handle:'noor',   email:'noor@acme.co',   role:'admin', joined:'May 18, 2024', posts: 96, online:false, hue: 85 },
  { id:'sam',    name:'Sam Okafor',   handle:'sam',    email:'sam@acme.co',    role:'member', joined:'Jun 02, 2024', posts: 211, online:true, hue: 150 },
  { id:'lena',   name:'Lena Vogel',   handle:'lena',   email:'lena@acme.co',   role:'member', joined:'Jul 11, 2024', posts: 73, online:true, hue: 42 },
  { id:'kai',    name:'Kai Tanaka',   handle:'kaitn',  email:'kai@acme.co',    role:'member', joined:'Aug 22, 2024', posts: 41, online:true, hue: 280 },
  { id:'ava',    name:'Ava Martinez', handle:'ava',    email:'ava@acme.co',    role:'member', joined:'Sep 15, 2024', posts: 28, online:false, hue: 14 },
  { id:'theo',   name:'Theo Brand',   handle:'theo',   email:'theo@acme.co',   role:'member', joined:'Oct 03, 2024', posts: 19, online:false, hue: 195 },
  { id:'ines',   name:'Inés Ribeiro', handle:'ines',   email:'ines@acme.co',   role:'member', joined:'Nov 28, 2024', posts: 12, online:false, hue: 350 },
  { id:'felix',  name:'Felix Wu',     handle:'felix',  email:'felix@acme.co',  role:'member', joined:'Jan 09, 2025', posts: 8, online:false, hue: 250 },
];

const gildKeyframes = `
@keyframes gild-pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }
`;

// ─── Atoms ─────────────────────────────────────────────────────────────────

function Wordmark({ size = 22, color = 'currentColor' }) {
  return (
    <span style={{
      fontFamily:'"Bricolage Grotesque", Inter, sans-serif',
      fontWeight: 800, fontSize: size, letterSpacing:'-0.04em',
      color, lineHeight: 1, display:'inline-flex', alignItems:'baseline', gap: 1,
    }}>
      Gild<span style={{ color:'oklch(0.62 0.14 75)' }}>.</span>
    </span>
  );
}

function Avatar({ person, size = 32, presence = false }) {
  if (!person) return null;
  const initials = person.name.split(' ').map(n => n[0]).slice(0,2).join('');
  const ringW = Math.max(2, Math.round(size / 14));
  return (
    <span style={{ position:'relative', display:'inline-block', flexShrink: 0, width: size, height: size }}>
      <span style={{
        width: size, height: size, borderRadius:'50%',
        display:'flex', alignItems:'center', justifyContent:'center',
        background:`linear-gradient(135deg, oklch(0.78 0.10 ${person.hue}), oklch(0.55 0.14 ${person.hue}))`,
        color:'#fff', fontWeight: 600, fontSize: size * 0.40,
        fontFamily:'Inter, system-ui, sans-serif',
        letterSpacing:'-0.02em',
      }}>{initials}</span>
      {presence && person.online && (
        <span style={{
          position:'absolute', right: -1, bottom: -1,
          width: Math.max(8, size * 0.30), height: Math.max(8, size * 0.30),
          background:'oklch(0.62 0.18 150)', borderRadius:'50%',
          boxShadow: `0 0 0 ${ringW}px var(--gild-presence-bg, #fff)`,
        }}/>
      )}
    </span>
  );
}

function AvatarStack({ people, max = 4, size = 28, bg = '#fff' }) {
  const shown = people.slice(0, max);
  const extra = people.length - shown.length;
  return (
    <span style={{ display:'inline-flex', alignItems:'center' }}>
      {shown.map((p, i) => (
        <span key={p.id} style={{
          marginLeft: i === 0 ? 0 : -size * 0.32,
          borderRadius:'50%', boxShadow: `0 0 0 2px ${bg}`,
          display:'inline-block',
        }}>
          <Avatar person={p} size={size} />
        </span>
      ))}
      {extra > 0 && (
        <span style={{
          marginLeft: -size * 0.32, width: size, height: size, borderRadius:'50%',
          background:'oklch(0.94 0.005 80)', color:'oklch(0.40 0.04 80)',
          fontSize: size * 0.34, fontWeight: 600,
          display:'inline-flex', alignItems:'center', justifyContent:'center',
          boxShadow: `0 0 0 2px ${bg}`, fontFamily:'JetBrains Mono, monospace',
        }}>+{extra}</span>
      )}
    </span>
  );
}

function LivePill({ count, hue = 150 }) {
  return (
    <span style={{
      display:'inline-flex', alignItems:'center', gap: 6,
      padding:'3px 10px', borderRadius: 999,
      background:`oklch(0.96 0.04 ${hue})`,
      color:`oklch(0.36 0.10 ${hue})`,
      fontSize: 11, fontWeight: 600,
      fontFamily:'JetBrains Mono, monospace',
      letterSpacing:'0.02em',
    }}>
      <span style={{
        width: 6, height: 6, borderRadius:'50%',
        background:`oklch(0.62 0.18 ${hue})`,
        animation:'gild-pulse 2s ease-in-out infinite',
      }}/>
      {count} live
    </span>
  );
}

function Reactions({ items, hue = 220 }) {
  if (!items || !items.length) return null;
  return (
    <span style={{ display:'inline-flex', gap: 6, flexWrap:'wrap' }}>
      {items.map(([emoji, count], i) => (
        <span key={i} style={{
          display:'inline-flex', alignItems:'center', gap: 4,
          padding:'3px 9px', borderRadius: 999,
          background:`oklch(0.97 0.02 ${hue})`,
          border:`1px solid oklch(0.92 0.04 ${hue})`,
          fontSize: 12, color:`oklch(0.30 0.08 ${hue})`,
          fontWeight: 500,
        }}>
          <span style={{ fontSize: 13 }}>{emoji}</span>
          <span style={{ fontFamily:'JetBrains Mono, monospace', fontSize: 11 }}>{count}</span>
        </span>
      ))}
      <span style={{
        display:'inline-flex', alignItems:'center', justifyContent:'center',
        width: 26, height: 22, borderRadius: 999,
        border:'1px dashed oklch(0.85 0.02 80)',
        color:'oklch(0.55 0.04 80)', fontSize: 12, cursor:'pointer',
      }}>+</span>
    </span>
  );
}

function PostImage({ hue = 220, label = 'wash', height = 180, variant = 'wash' }) {
  if (variant === 'chart') {
    const bars = [42, 58, 71, 65, 84, 92, 88];
    return (
      <div style={{
        height, borderRadius: 10,
        background: `linear-gradient(135deg, oklch(0.97 0.02 ${hue}), oklch(0.92 0.04 ${hue}))`,
        border: `1px solid oklch(0.90 0.04 ${hue})`,
        padding:'18px 20px', display:'flex', alignItems:'flex-end', gap: 8,
      }}>
        {bars.map((h, i) => (
          <div key={i} style={{
            flex: 1, height: `${h}%`, borderRadius:'4px 4px 0 0',
            background: i === bars.length - 1
              ? `oklch(0.55 0.16 ${hue})`
              : `oklch(0.72 0.10 ${hue})`,
          }}/>
        ))}
      </div>
    );
  }
  return (
    <div style={{
      height, borderRadius: 10,
      background: `
        radial-gradient(ellipse at 20% 30%, oklch(0.85 0.10 ${hue}) 0%, transparent 50%),
        radial-gradient(ellipse at 75% 70%, oklch(0.78 0.14 ${(hue + 60) % 360}) 0%, transparent 50%),
        linear-gradient(135deg, oklch(0.92 0.04 ${hue}), oklch(0.82 0.10 ${hue}))
      `,
      position:'relative', overflow:'hidden',
    }}>
      <div style={{
        position:'absolute', inset: 0,
        backgroundImage: `linear-gradient(0deg, transparent 95%, oklch(0.40 0.10 ${hue} / 0.15) 100%)`,
        backgroundSize:'100% 14px',
      }}/>
    </div>
  );
}

function CoverArt({ space, height = 180, variant = 'rays' }) {
  const h = space.hue;
  if (variant === 'grid') {
    return (
      <div style={{
        height,
        background: `
          linear-gradient(135deg, oklch(0.92 0.06 ${h}), oklch(0.78 0.14 ${h})),
          repeating-linear-gradient(0deg, transparent 0 22px, oklch(0.40 0.10 ${h} / 0.10) 22px 23px),
          repeating-linear-gradient(90deg, transparent 0 22px, oklch(0.40 0.10 ${h} / 0.10) 22px 23px)
        `,
        backgroundBlendMode:'normal, overlay, overlay',
      }}/>
    );
  }
  return (
    <div style={{
      height, position:'relative', overflow:'hidden',
      background: `linear-gradient(135deg, oklch(0.95 0.04 ${h}), oklch(0.84 0.12 ${h}))`,
    }}>
      <div style={{
        position:'absolute', inset: 0,
        background: `
          radial-gradient(ellipse at 30% 50%, oklch(0.62 0.16 ${h} / 0.4) 0%, transparent 60%),
          radial-gradient(ellipse at 80% 30%, oklch(0.55 0.18 ${(h + 30) % 360} / 0.3) 0%, transparent 50%)
        `,
      }}/>
    </div>
  );
}

window.PEOPLE = PEOPLE;
window.SPACES = SPACES;
window.POSTS = POSTS;
window.MEMBERS = MEMBERS;
window.personFor = personFor;
window.spaceFor = spaceFor;
window.gildKeyframes = gildKeyframes;
window.Wordmark = Wordmark;
window.Avatar = Avatar;
window.AvatarStack = AvatarStack;
window.LivePill = LivePill;
window.Reactions = Reactions;
window.PostImage = PostImage;
window.CoverArt = CoverArt;
