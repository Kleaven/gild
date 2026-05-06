// Shared design tokens and primitives across all four directions.
// IMPORTANT: every styles object is uniquely-named to avoid global collisions.

const SPACES = [
  { id: 'announcements', name: 'Announcements', hue: 42,  // gold
    desc: 'What\u2019s new from the Acme team. Read first.', members: 248, online: 31 },
  { id: 'general',       name: 'General',       hue: 220, // ink-blue
    desc: 'The town square. Ideas, half-thoughts, links.', members: 248, online: 31 },
  { id: 'introductions', name: 'Introductions', hue: 14,  // coral
    desc: 'Tell us who you are and what you\u2019re building.', members: 248, online: 17 },
  { id: 'building',      name: 'Building in public', hue: 280, // violet
    desc: 'Ship logs, screenshots, postmortems.', members: 248, online: 22 },
  { id: 'wins',          name: 'Wins',          hue: 150, // emerald
    desc: 'Celebrate revenue, launches, breakthroughs.', members: 248, online: 12 },
];

const PEOPLE = [
  { id:'jordan',  name:'Jordan Lee',     handle:'jordan',   role:'owner',     hue: 42,  online:true,  initial:'JL' },
  { id:'mira',    name:'Mira Patel',     handle:'mira',     role:'admin',     hue: 280, online:true,  initial:'MP' },
  { id:'devon',   name:'Devon Brooks',   handle:'devon',    role:'mod',       hue: 14,  online:false, initial:'DB' },
  { id:'sasha',   name:'Sasha Wu',       handle:'sasha',    role:'tier2',     hue: 150, online:true,  initial:'SW' },
  { id:'eli',     name:'Eli Thompson',   handle:null,       role:'tier1',     hue: 220, online:false, initial:'ET' },
  { id:'reza',    name:'Reza Khan',      handle:'reza',     role:'free',      hue: 200, online:true,  initial:'RK' },
  { id:'noor',    name:'Noor Haddad',    handle:'noor',     role:'tier2',     hue: 320, online:true,  initial:'NH' },
  { id:'kai',     name:'Kai Okafor',     handle:'kai',      role:'tier1',     hue: 100, online:false, initial:'KO' },
];

const POSTS = [
  {
    id:'p1', space:'announcements', author:'jordan', date:'2h',
    title:'Office hours moving to Thursdays at 2pm PT',
    body:'We\u2019re shifting weekly office hours to a more global-friendly slot. RSVP in the calendar; recordings posted in #building afterwards. First session this week features Nikhil from Linear walking through async planning rituals.',
    image: 'cover',
    likes: 47, comments: 12, reactions: [['\ud83d\udc4d', 32], ['\ud83d\udd25', 11], ['\u2728', 4]],
    pinned: true,
  },
  {
    id:'p2', space:'building', author:'mira', date:'4h',
    title:'Pricing v3: we cut a tier and revenue went up',
    body:'Three weeks ago we collapsed our 4-tier price ladder into 2. Counter-intuitive: ARR is up 18%. Sharing the data and the email we sent existing customers. Roast the copy.',
    link: { url: 'mira.so/pricing-v3', title: 'Pricing v3 — what we changed and why', desc: 'A breakdown of the tier consolidation, the rollout email, and the 30-day revenue comparison.' },
    likes: 86, comments: 34, reactions: [['\ud83d\udd25', 41], ['\ud83d\udcaf', 18], ['\ud83d\udcc8', 9]],
  },
  {
    id:'p3', space:'general', author:'devon', date:'6h', title:null,
    body:'Anyone else hit a motivation wall between launches? Twenty-five-min focus block + five-min walk has been working. Curious what your routine looks like.',
    likes: 21, comments: 11, reactions: [['\ud83d\udc40', 14], ['\ud83d\udc4d', 7]],
  },
  {
    id:'p4', space:'wins', author:'sasha', date:'9h',
    title:'$10K MRR \u2014 finally',
    body:'Took 14 months. Posting the dashboard because someone two years ago posted theirs and it kept me going. Pay it forward: post your milestones, however small.',
    image: 'chart',
    likes: 142, comments: 41, reactions: [['\ud83c\udf89', 78], ['\ud83d\udc8e', 22], ['\u2764\ufe0f', 19]],
  },
  {
    id:'p5', space:'introductions', author:'noor', date:'1d', title:null,
    body:'Hi! I\u2019m Noor, designer in Beirut, building a research-ops tool for indie consultants. Looking for two folks to test the alpha next week \u2014 reply if interested.',
    likes: 18, comments: 9, reactions: [['\ud83d\udc4b', 14], ['\u2728', 5]],
  },
];

function spaceFor(id) { return SPACES.find(s => s.id === id) || SPACES[1]; }
function personFor(id) { return PEOPLE.find(p => p.id === id) || PEOPLE[0]; }

// Avatar — a soft gradient disc using the person's hue, with optional presence dot.
function Avatar({ person, size = 32, presence = false, ring = null }) {
  const h = person.hue;
  const bg = `linear-gradient(135deg, oklch(0.78 0.12 ${h}), oklch(0.55 0.16 ${h}))`;
  return (
    <span style={{
      position:'relative', display:'inline-flex', alignItems:'center', justifyContent:'center',
      width: size, height: size, borderRadius: '50%',
      background: bg, color:'#fff',
      fontSize: size*0.4, fontWeight: 600, letterSpacing:'0.02em',
      boxShadow: ring ? `0 0 0 2px ${ring}` : 'none',
      flexShrink: 0,
    }}>
      {person.initial}
      {presence && person.online && (
        <span style={{
          position:'absolute', right:-1, bottom:-1,
          width: Math.max(8, size*0.28), height: Math.max(8, size*0.28),
          borderRadius:'50%', background:'oklch(0.72 0.18 150)',
          boxShadow:'0 0 0 2px #fff, 0 0 8px oklch(0.72 0.18 150 / 0.6)',
        }}/>
      )}
    </span>
  );
}

// AvatarStack — overlapping avatars with overflow count.
function AvatarStack({ people, max = 4, size = 24, bg = '#fff' }) {
  const shown = people.slice(0, max);
  const rest  = people.length - shown.length;
  return (
    <span style={{ display:'inline-flex', alignItems:'center' }}>
      {shown.map((p, i) => (
        <span key={p.id} style={{ marginLeft: i === 0 ? 0 : -size*0.3, zIndex: shown.length - i }}>
          <Avatar person={p} size={size} ring={bg} />
        </span>
      ))}
      {rest > 0 && (
        <span style={{
          marginLeft: -size*0.3,
          width: size, height: size, borderRadius:'50%',
          background:'#f3f4f6', color:'#4b5563',
          fontSize: size*0.38, fontWeight:600,
          display:'inline-flex', alignItems:'center', justifyContent:'center',
          boxShadow: `0 0 0 2px ${bg}`,
        }}>+{rest}</span>
      )}
    </span>
  );
}

// CoverArt — a tasteful synthesized cover using the space hue (no SVG slop).
// Each space gets a recognizable but abstract pattern via CSS.
function CoverArt({ space, height = 140, variant = 'rays' }) {
  const h = space.hue;
  let bg;
  if (variant === 'rays') {
    bg = `
      radial-gradient(ellipse at 80% 20%, oklch(0.92 0.08 ${h}) 0%, transparent 55%),
      radial-gradient(ellipse at 10% 90%, oklch(0.85 0.14 ${h}) 0%, transparent 50%),
      linear-gradient(135deg, oklch(0.96 0.04 ${h}) 0%, oklch(0.88 0.10 ${h}) 100%)
    `;
  } else if (variant === 'grid') {
    bg = `
      repeating-linear-gradient(45deg, oklch(0.92 0.06 ${h}) 0 1px, transparent 1px 14px),
      linear-gradient(180deg, oklch(0.96 0.04 ${h}), oklch(0.86 0.12 ${h}))
    `;
  } else if (variant === 'wash') {
    bg = `linear-gradient(180deg, oklch(0.94 0.05 ${h}) 0%, oklch(0.78 0.14 ${h}) 100%)`;
  }
  return (
    <div style={{
      width:'100%', height, background: bg, position:'relative', overflow:'hidden',
    }}>
      {/* tiny decorative gild — a thin metallic line near bottom */}
      <div style={{
        position:'absolute', left:0, right:0, bottom:0, height: 2,
        background: 'linear-gradient(90deg, transparent, oklch(0.82 0.14 75), transparent)',
        opacity: 0.7,
      }}/>
    </div>
  );
}

// Imagery placeholder for post images (no SVG slop — just a colored field with a label).
function PostImage({ hue, label = 'image', height = 200, variant = 'wash' }) {
  return (
    <div style={{
      width:'100%', height, background:
        variant === 'chart'
          ? `linear-gradient(180deg, oklch(0.96 0.04 ${hue}) 0%, oklch(0.85 0.12 ${hue}) 100%)`
          : `linear-gradient(135deg, oklch(0.90 0.10 ${hue}) 0%, oklch(0.70 0.16 ${hue}) 100%)`,
      borderRadius: 8, position:'relative', overflow:'hidden',
      display:'flex', alignItems:'center', justifyContent:'center',
    }}>
      {variant === 'chart' && (
        <div style={{
          position:'absolute', inset: '20% 12% 18% 12%',
          backgroundImage: `
            linear-gradient(to top, oklch(0.55 0.16 ${hue}) 2px, transparent 2px),
            linear-gradient(to top, transparent 0, transparent 0)
          `,
          backgroundSize: '100% 25%, 100% 25%',
        }}>
          <div style={{
            position:'absolute', inset: 0,
            clipPath: 'polygon(0 80%, 18% 60%, 36% 65%, 54% 40%, 72% 30%, 90% 12%, 100% 8%, 100% 100%, 0 100%)',
            background: `linear-gradient(180deg, oklch(0.55 0.18 ${hue} / 0.8), oklch(0.55 0.18 ${hue} / 0.2))`,
          }}/>
        </div>
      )}
      <span style={{
        position:'absolute', top: 8, right: 10,
        fontFamily:'JetBrains Mono, ui-monospace, monospace',
        fontSize: 10, color: 'oklch(0.32 0.08 ' + hue + ')', opacity:0.6,
        letterSpacing:'0.08em', textTransform:'uppercase',
      }}>{label}</span>
    </div>
  );
}

// Live "online now" pill
function LivePill({ count, hue = 150 }) {
  return (
    <span style={{
      display:'inline-flex', alignItems:'center', gap:6,
      padding:'3px 8px 3px 7px', borderRadius:999,
      background:`oklch(0.96 0.04 ${hue})`,
      color:`oklch(0.42 0.14 ${hue})`,
      fontFamily:'JetBrains Mono, monospace',
      fontSize: 11, fontWeight: 500, letterSpacing:'0.02em',
    }}>
      <span style={{
        width:6, height:6, borderRadius:'50%',
        background:`oklch(0.62 0.18 ${hue})`,
        boxShadow:`0 0 0 3px oklch(0.62 0.18 ${hue} / 0.2)`,
        animation:'gild-pulse 2s ease-in-out infinite',
      }}/>
      {count} online
    </span>
  );
}

// Wordmark — "Gild" with a gilded swash on the G.
function Wordmark({ size = 28, color = '#0d0d0d' }) {
  return (
    <span style={{
      fontFamily:'"Bricolage Grotesque", "Inter", sans-serif',
      fontWeight: 800, fontSize: size, letterSpacing:'-0.04em',
      color, lineHeight: 1, display:'inline-flex', alignItems:'baseline',
    }}>
      <span style={{
        color:'oklch(0.62 0.16 75)',
        textShadow:'0 1px 0 oklch(0.78 0.14 75)',
      }}>G</span>
      ild
    </span>
  );
}

// Reaction row
function Reactions({ items, hue = 220 }) {
  return (
    <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
      {items.map(([emoji, n], i) => (
        <span key={i} style={{
          display:'inline-flex', alignItems:'center', gap:4,
          padding:'3px 8px', borderRadius:999,
          background:`oklch(0.97 0.02 ${hue})`,
          border:`1px solid oklch(0.92 0.04 ${hue})`,
          fontSize: 12, color:`oklch(0.32 0.08 ${hue})`,
          fontFamily:'Inter, system-ui, sans-serif', fontWeight: 500,
        }}>
          <span style={{ fontSize: 13 }}>{emoji}</span>
          <span style={{ fontFamily:'JetBrains Mono, monospace', fontSize: 11 }}>{n}</span>
        </span>
      ))}
      <button style={{
        padding:'3px 8px', borderRadius:999,
        background:'transparent', border:'1px dashed #d4d4d8',
        color:'#71717a', fontSize: 12, cursor:'pointer',
      }}>+</button>
    </div>
  );
}

// global keyframes
const gildKeyframes = `
@keyframes gild-pulse { 0%,100% { opacity:1; } 50% { opacity:0.55; } }
@keyframes gild-blink { 0%,49% { opacity:1; } 50%,100% { opacity:0; } }
`;

Object.assign(window, {
  SPACES, PEOPLE, POSTS, spaceFor, personFor,
  Avatar, AvatarStack, CoverArt, PostImage, LivePill, Wordmark, Reactions,
  gildKeyframes,
});
