const { PEOPLE, SPACES, POSTS, MEMBERS, personFor, spaceFor, gildKeyframes,
  Wordmark, Avatar, AvatarStack, LivePill, Reactions, PostImage, CoverArt } = window;
// STUDIO supporting screens

// Hand-drawn doodle primitives — thin ink, slightly wobbly, Notion-flavored.
// Each Doodle has a `style` for absolute positioning by parent.
const INK = 'oklch(0.30 0.02 250)';
const INK_WARM = 'oklch(0.55 0.14 75)'; // gold accent
const INK_GREEN = 'oklch(0.50 0.14 150)';
const INK_LILAC = 'oklch(0.55 0.14 280)';

function DoodleSquiggleArrow({ style, color = INK, rotate = 0 }) {
  // Looping arrow that points down-right, like Notion's "look here" arrow.
  return (
    <svg viewBox="0 0 120 90" width="120" height="90" fill="none"
      stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"
      style={{ position:'absolute', transform:`rotate(${rotate}deg)`, ...style }}>
      <path d="M5 12 C 22 4, 42 6, 56 18 C 70 30, 62 48, 44 50 C 28 52, 22 38, 32 30 C 44 22, 70 28, 86 44 C 96 54, 100 64, 102 76"/>
      <path d="M94 66 L 102 78 L 112 70"/>
    </svg>
  );
}

function DoodleStar({ style, color = INK_WARM, size = 28 }) {
  // 4-point sparkle, Notion-y.
  return (
    <svg viewBox="0 0 40 40" width={size} height={size} fill="none"
      stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"
      style={{ position:'absolute', ...style }}>
      <path d="M20 4 C 20 14, 22 18, 36 20 C 22 22, 20 26, 20 36 C 20 26, 18 22, 4 20 C 18 18, 20 14, 20 4 Z"/>
    </svg>
  );
}

function DoodleUnderline({ style, color = INK_WARM, w = 180 }) {
  return (
    <svg viewBox="0 0 200 16" width={w} height={w * 0.08} fill="none"
      stroke={color} strokeWidth="2.2" strokeLinecap="round"
      style={{ position:'absolute', ...style }}>
      <path d="M4 10 C 40 4, 80 14, 120 6 C 150 1, 180 10, 196 8"/>
    </svg>
  );
}

function DoodleCircle({ style, color = INK, size = 80 }) {
  // Hand-drawn ellipse, slightly imperfect.
  return (
    <svg viewBox="0 0 100 60" width={size} height={size * 0.6} fill="none"
      stroke={color} strokeWidth="1.6" strokeLinecap="round"
      style={{ position:'absolute', ...style }}>
      <path d="M52 4 C 78 5, 96 16, 96 30 C 95 46, 70 56, 46 56 C 22 56, 4 46, 4 30 C 4 16, 24 5, 52 4 Z"/>
    </svg>
  );
}

function DoodleHeart({ style, color = INK_WARM, size = 22 }) {
  return (
    <svg viewBox="0 0 30 28" width={size} height={size} fill="none"
      stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"
      style={{ position:'absolute', ...style }}>
      <path d="M15 25 C 4 18, 1 11, 5 6 C 9 1, 14 4, 15 8 C 16 4, 21 1, 25 6 C 29 11, 26 18, 15 25 Z"/>
    </svg>
  );
}

function DoodleSpark({ style, color = INK_GREEN, size = 22 }) {
  // Small "+" twinkle.
  return (
    <svg viewBox="0 0 20 20" width={size} height={size} fill="none"
      stroke={color} strokeWidth="1.6" strokeLinecap="round"
      style={{ position:'absolute', ...style }}>
      <path d="M10 2 L 10 18 M 2 10 L 18 10 M 4 4 L 16 16 M 16 4 L 4 16" strokeOpacity="0.85"/>
    </svg>
  );
}

function DoodleScribbleLine({ style, color = INK_LILAC, w = 90 }) {
  // Squiggle line emphasis.
  return (
    <svg viewBox="0 0 100 14" width={w} height={w * 0.14} fill="none"
      stroke={color} strokeWidth="1.6" strokeLinecap="round"
      style={{ position:'absolute', ...style }}>
      <path d="M2 7 C 10 2, 18 12, 26 7 C 34 2, 42 12, 50 7 C 58 2, 66 12, 74 7 C 82 2, 90 12, 98 7"/>
    </svg>
  );
}

function DoodleCheck({ style, color = INK_GREEN, size = 26 }) {
  return (
    <svg viewBox="0 0 30 30" width={size} height={size} fill="none"
      stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
      style={{ position:'absolute', ...style }}>
      <path d="M5 16 L 12 22 L 25 7"/>
    </svg>
  );
}

function DoodleArrowStraight({ style, color = INK, w = 70, rotate = 0 }) {
  return (
    <svg viewBox="0 0 80 30" width={w} height={w * 0.4} fill="none"
      stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"
      style={{ position:'absolute', transform:`rotate(${rotate}deg)`, ...style }}>
      <path d="M4 18 C 24 6, 50 6, 72 14"/>
      <path d="M64 8 L 72 14 L 66 22"/>
    </svg>
  );
}

function StudioLanding() {
  return (
    <div style={{
      fontFamily:'"Inter", system-ui, sans-serif',
      background:'#fff', minHeight:'100%', color:'#202020',
      position:'relative', overflow:'hidden',
    }}>
      <header style={{
        display:'flex', alignItems:'center', justifyContent:'space-between',
        padding:'14px 28px', borderBottom:'1px solid oklch(0.95 0.005 250)',
      }}>
        <div style={{ display:'flex', alignItems:'center', gap: 28 }}>
          <Wordmark size={22} />
          <nav style={{ display:'flex', gap: 18, fontSize: 13 }}>
            <a href="#" style={{ color:'oklch(0.30 0.02 250)', textDecoration:'none', fontWeight: 500 }}>Product</a>
            <a href="#" style={{ color:'oklch(0.30 0.02 250)', textDecoration:'none', fontWeight: 500 }}>Pricing</a>
            <a href="#" style={{ color:'oklch(0.30 0.02 250)', textDecoration:'none', fontWeight: 500 }}>Customers</a>
            <a href="#" style={{ color:'oklch(0.30 0.02 250)', textDecoration:'none', fontWeight: 500 }}>Changelog</a>
          </nav>
        </div>
        <div style={{ display:'flex', gap: 10, alignItems:'center', fontSize: 13 }}>
          <a href="#" style={{ color:'oklch(0.30 0.02 250)', textDecoration:'none' }}>Sign in</a>
          <a href="#" style={{
            padding:'7px 14px', borderRadius: 8,
            background:'oklch(0.20 0.02 250)', color:'#fff',
            textDecoration:'none', fontWeight: 500,
          }}>Get started</a>
        </div>
      </header>

      {/* Decorative ambient doodles, edge-of-canvas, low priority */}
      <DoodleStar style={{ top: 92, left: '8%' }} size={32} color={INK_WARM} />
      <DoodleSpark style={{ top: 160, left: '14%' }} size={18} color={INK_GREEN} />
      <DoodleCircle style={{ top: 240, left: '4%' }} size={92} color={INK_LILAC} />
      <DoodleScribbleLine style={{ top: 320, left: '5%' }} w={70} color={INK_WARM} />

      <DoodleHeart style={{ top: 110, right: '10%' }} size={26} color={INK_WARM} />
      <DoodleStar style={{ top: 200, right: '6%' }} size={22} color={INK_GREEN} />
      <DoodleSpark style={{ top: 270, right: '14%' }} size={20} color={INK_LILAC} />

      <main style={{ maxWidth: 1080, margin:'0 auto', padding:'80px 28px 40px', textAlign:'center', position:'relative' }}>
        <span style={{
          display:'inline-flex', alignItems:'center', gap: 8,
          padding:'5px 12px', borderRadius: 999, marginBottom: 28,
          background:'oklch(0.97 0.005 250)', border:'1px solid oklch(0.92 0.01 250)',
          fontSize: 12, fontWeight: 500, color:'oklch(0.32 0.02 250)',
          position:'relative',
        }}>
          <span style={{
            width: 6, height: 6, borderRadius:'50%',
            background:'oklch(0.62 0.18 150)',
          }}/>
          New · realtime presence + reactions
          <span style={{ color:'oklch(0.50 0.02 250)' }}>→</span>
        </span>
        <h1 style={{
          fontFamily:'"Bricolage Grotesque", Inter, sans-serif',
          fontSize: 80, lineHeight: 0.95, fontWeight: 800,
          margin:'0 auto 22px', letterSpacing:'-0.045em',
          textWrap:'balance', maxWidth: 920,
          position:'relative',
        }}>
          {/* Underline under "home" — second word of headline */}
          The <span style={{ position:'relative', display:'inline-block' }}>
            home
            <DoodleUnderline w={170} color={INK_WARM}
              style={{ left:'50%', bottom:-12, transform:'translateX(-50%)' }} />
          </span> for paid<br/>communities.
          {/* Sparkle on the period */}
          <DoodleStar style={{ top:-18, right:'14%' }} size={26} color={INK_WARM} />
        </h1>
        <p style={{
          fontSize: 19, lineHeight: 1.5, color:'oklch(0.42 0.02 250)',
          margin:'0 auto 32px', maxWidth: 580,
        }}>
          Spaces, courses, and events for premium creators. 0% transaction fees, forever.
        </p>
        <div style={{ display:'flex', gap: 10, justifyContent:'center', marginBottom: 60, position:'relative' }}>
          <a href="#" style={{
            padding:'12px 22px', borderRadius: 8, fontWeight: 600, fontSize: 14,
            background:'oklch(0.20 0.02 250)', color:'#fff', textDecoration:'none',
          }}>Start a 14-day trial</a>
          <a href="#" style={{
            padding:'12px 22px', borderRadius: 8, fontWeight: 600, fontSize: 14,
            background:'#fff', color:'#202020', textDecoration:'none',
            border:'1px solid oklch(0.90 0.01 250)',
          }}>Talk to sales</a>
          {/* Squiggly arrow pointing at primary CTA from the left */}
          <DoodleSquiggleArrow color={INK} rotate={-8}
            style={{ left:'calc(50% - 280px)', top:-30 }} />
          <span style={{
            position:'absolute', left:'calc(50% - 320px)', top: 4,
            fontFamily:'"Caveat", "Bradley Hand", cursive',
            fontSize: 18, color: INK, transform:'rotate(-6deg)', whiteSpace:'nowrap',
          }}>start here ✿</span>
          <DoodleSpark style={{ right:'calc(50% - 280px)', top:8 }} size={18} color={INK_GREEN} />
        </div>

        {/* Product canvas peek */}
        <div style={{
          maxWidth: 980, margin:'0 auto',
          background:'oklch(0.985 0.003 250)', borderRadius: 16,
          border:'1px solid oklch(0.92 0.01 250)',
          padding: 14,
          boxShadow:'0 30px 60px -30px oklch(0.30 0.04 250 / 0.3)',
          position:'relative',
        }}>
          {/* Doodles framing the product peek */}
          <DoodleStar style={{ top: -22, left: -28 }} size={26} color={INK_LILAC} />
          <DoodleSpark style={{ top: 40, left: -44 }} size={18} color={INK_GREEN} />
          <DoodleHeart style={{ bottom: -16, left: -20 }} size={20} color={INK_WARM} />
          <DoodleStar style={{ top: -20, right: -22 }} size={22} color={INK_GREEN} />
          <DoodleScribbleLine style={{ top: 80, right: -60 }} w={56} color={INK_WARM} />
          <DoodleSpark style={{ bottom: -8, right: -28 }} size={16} color={INK_LILAC} />
          <div style={{
            display:'grid', gridTemplateColumns:'180px 1fr 200px', gap: 14, textAlign:'left',
          }}>
            <div style={{
              background:'#fff', borderRadius: 10, padding:'14px 12px',
              border:'1px solid oklch(0.94 0.005 250)',
            }}>
              <p style={{ fontSize: 10, fontWeight: 600, margin:'0 0 8px', textTransform:'uppercase', letterSpacing:'0.06em', color:'oklch(0.55 0.02 250)' }}>Spaces</p>
              {SPACES.slice(0,4).map((s, i) => (
                <div key={s.id} style={{
                  display:'flex', alignItems:'center', gap: 8, padding:'5px 6px',
                  borderRadius: 6, fontSize: 12,
                  background: i === 0 ? 'oklch(0.96 0.005 250)' : 'transparent',
                  fontWeight: i === 0 ? 600 : 400,
                  color:'oklch(0.30 0.02 250)',
                }}>
                  <span style={{ width: 7, height: 7, borderRadius: 2, background: `oklch(0.62 0.16 ${s.hue})` }}/>
                  {s.name}
                </div>
              ))}
            </div>
            <div style={{
              background:'#fff', borderRadius: 10, padding:'16px 18px',
              border:'1px solid oklch(0.94 0.005 250)',
            }}>
              {POSTS.slice(0, 2).map((post, i) => {
                const author = personFor(post.author);
                const ps = spaceFor(post.space);
                return (
                  <div key={post.id} style={{
                    paddingTop: i === 0 ? 0 : 12, paddingBottom: 12,
                    borderBottom: i === 0 ? '1px solid oklch(0.95 0.005 250)' : 'none',
                  }}>
                    <div style={{ display:'flex', alignItems:'center', gap: 8, marginBottom: 6 }}>
                      <Avatar person={author} size={22} presence />
                      <span style={{ fontSize: 12, fontWeight: 600 }}>{author.name}</span>
                      <span style={{
                        padding:'1px 8px', borderRadius: 999, fontSize: 10, fontWeight: 600,
                        background:`oklch(0.96 0.02 ${ps.hue})`, color:`oklch(0.36 0.10 ${ps.hue})`,
                      }}>{ps.name}</span>
                    </div>
                    {post.title && <p style={{ fontSize: 13, fontWeight: 600, margin:'0 0 4px' }}>{post.title}</p>}
                    <p style={{ fontSize: 12, color:'oklch(0.40 0.02 250)', margin:'0 0 8px', lineHeight: 1.45 }}>
                      {post.body.slice(0, 110)}…
                    </p>
                    <Reactions items={post.reactions.slice(0, 2)} hue={ps.hue} />
                  </div>
                );
              })}
            </div>
            <div style={{
              background:'#fff', borderRadius: 10, padding:'14px 12px',
              border:'1px solid oklch(0.94 0.005 250)',
            }}>
              <div style={{ display:'flex', alignItems:'center', gap: 6, marginBottom: 10 }}>
                <span style={{
                  width: 6, height: 6, borderRadius:'50%',
                  background:'oklch(0.62 0.18 150)',
                }}/>
                <p style={{ fontSize: 10, fontWeight: 700, margin: 0, color:'oklch(0.42 0.14 150)', textTransform:'uppercase', letterSpacing:'0.06em' }}>Live now</p>
              </div>
              {PEOPLE.filter(p => p.online).slice(0, 4).map(p => (
                <div key={p.id} style={{ display:'flex', alignItems:'center', gap: 8, padding:'4px 0' }}>
                  <Avatar person={p} size={20} presence />
                  <span style={{ fontSize: 12, color:'oklch(0.30 0.02 250)' }}>{p.name.split(' ')[0]}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function StudioSignIn() {
  return (
    <div style={{
      minHeight:'100%', background:'#fff',
      fontFamily:'"Inter", system-ui, sans-serif',
      display:'grid', gridTemplateColumns:'1fr 1fr',
    }}>
      <div style={{ padding:'40px 48px', display:'flex', flexDirection:'column', justifyContent:'space-between' }}>
        <Wordmark size={22} />
        <div style={{ maxWidth: 360 }}>
          <h1 style={{
            fontFamily:'"Bricolage Grotesque", Inter, sans-serif',
            fontSize: 32, fontWeight: 700, margin:'0 0 4px',
            letterSpacing:'-0.025em',
          }}>Sign in</h1>
          <p style={{ fontSize: 14, color:'oklch(0.45 0.02 250)', margin:'0 0 24px' }}>
            Welcome back. Pick up where you left off.
          </p>
          <div style={{ display:'flex', flexDirection:'column', gap: 10 }}>
            <button style={{
              padding:'10px 14px', borderRadius: 8,
              border:'1px solid oklch(0.90 0.01 250)', background:'#fff',
              fontSize: 14, fontWeight: 500, cursor:'pointer',
              display:'flex', alignItems:'center', justifyContent:'center', gap: 8,
            }}>
              <span style={{
                width: 16, height: 16, borderRadius: 3,
                background:'linear-gradient(135deg, oklch(0.78 0.14 30), oklch(0.62 0.18 230))',
              }}/>
              Continue with Google
            </button>
            <div style={{ display:'flex', alignItems:'center', gap: 10, margin:'4px 0' }}>
              <div style={{ flex:1, height:1, background:'oklch(0.92 0.01 250)' }}/>
              <span style={{ fontSize: 12, color:'oklch(0.55 0.02 250)' }}>or</span>
              <div style={{ flex:1, height:1, background:'oklch(0.92 0.01 250)' }}/>
            </div>
            <input placeholder="Email" style={{
              padding:'10px 14px', border:'1px solid oklch(0.90 0.01 250)',
              borderRadius: 8, fontSize: 14, outline:'none', fontFamily:'inherit',
            }}/>
            <input placeholder="Password" type="password" style={{
              padding:'10px 14px', border:'1px solid oklch(0.90 0.01 250)',
              borderRadius: 8, fontSize: 14, outline:'none', fontFamily:'inherit',
            }}/>
            <button style={{
              padding:'10px 14px', borderRadius: 8,
              background:'oklch(0.20 0.02 250)', color:'#fff', border:'none',
              fontSize: 14, fontWeight: 500, cursor:'pointer',
            }}>Sign in →</button>
          </div>
          <p style={{ fontSize: 13, margin:'18px 0 0', color:'oklch(0.50 0.02 250)' }}>
            New here? <a href="#" style={{ color:'#202020', fontWeight: 600, textDecoration:'none' }}>Make an account</a>
          </p>
        </div>
        <div style={{ display:'flex', gap: 14, fontSize: 12, color:'oklch(0.55 0.02 250)' }}>
          <span>© Gild 2026</span>
          <span>Privacy</span>
          <span>Terms</span>
        </div>
      </div>
      <div style={{
        background:'oklch(0.985 0.003 250)',
        borderLeft:'1px solid oklch(0.94 0.005 250)',
        display:'flex', alignItems:'center', justifyContent:'center', padding: 40,
      }}>
        {/* Floating mock card */}
        <div style={{
          background:'#fff', borderRadius: 14, padding: 18, width:'100%', maxWidth: 360,
          border:'1px solid oklch(0.94 0.005 250)',
          boxShadow:'0 30px 60px -30px oklch(0.30 0.04 250 / 0.4)',
        }}>
          <div style={{ display:'flex', alignItems:'center', gap: 8, marginBottom: 12 }}>
            <span style={{
              width: 8, height: 8, borderRadius:'50%',
              background:'oklch(0.62 0.18 150)',
            }}/>
            <p style={{ fontSize: 11, fontWeight: 700, margin: 0, color:'oklch(0.42 0.14 150)', textTransform:'uppercase', letterSpacing:'0.08em' }}>Live now · 5</p>
          </div>
          {PEOPLE.filter(p=>p.online).slice(0, 4).map(p => (
            <div key={p.id} style={{ display:'flex', alignItems:'center', gap: 10, padding:'5px 0' }}>
              <Avatar person={p} size={26} presence />
              <div style={{ flex: 1, lineHeight: 1.2 }}>
                <p style={{ fontSize: 13, fontWeight: 500, margin: 0 }}>{p.name}</p>
                <p style={{ fontSize: 11, color:'oklch(0.50 0.02 250)', margin: 0, fontFamily:'JetBrains Mono, monospace' }}>
                  in #{['announcements','building','general','wins'][PEOPLE.indexOf(p)%4]}
                </p>
              </div>
            </div>
          ))}
          <div style={{
            marginTop: 14, padding:'8px 12px', borderRadius: 8,
            background:'oklch(0.96 0.04 75)', color:'oklch(0.36 0.10 75)',
            fontSize: 12, fontWeight: 500, textAlign:'center',
          }}>The room is busiest at 9am PT.</div>
        </div>
      </div>
    </div>
  );
}

function StudioDashboard() {
  return (
    <div style={{
      fontFamily:'"Inter", system-ui, sans-serif',
      background:'#fff', minHeight:'100%', color:'#202020',
    }}>
      <header style={{
        display:'flex', alignItems:'center', justifyContent:'space-between',
        padding:'14px 28px', borderBottom:'1px solid oklch(0.95 0.005 250)',
      }}>
        <div style={{ display:'flex', alignItems:'center', gap: 12 }}>
          <Wordmark size={22} />
          <span style={{ fontSize: 13, color:'oklch(0.40 0.02 250)' }}>/ Acme Builders / Dashboard</span>
        </div>
        <Avatar person={personFor('jordan')} size={28} presence />
      </header>

      <main style={{ maxWidth: 1080, margin:'0 auto', padding:'28px 28px' }}>
        <div style={{ display:'flex', alignItems:'baseline', gap: 12, marginBottom: 22 }}>
          <h1 style={{
            fontFamily:'"Bricolage Grotesque", Inter, sans-serif',
            fontSize: 28, fontWeight: 700, margin: 0, letterSpacing:'-0.025em',
          }}>Acme Builders</h1>
          <span style={{
            padding:'2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600,
            background:'oklch(0.96 0.04 150)', color:'oklch(0.36 0.10 150)',
          }}>Pro · trialing</span>
          <span style={{
            fontSize: 12, color:'oklch(0.50 0.02 250)', fontFamily:'JetBrains Mono, monospace',
            marginLeft:'auto',
          }}>last sync 2s ago</span>
        </div>

        <div style={{
          display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap: 0,
          border:'1px solid oklch(0.94 0.005 250)', borderRadius: 12, marginBottom: 24,
        }}>
          {[
            ['Members', 248, '+12', 220],
            ['Posts', 1043, '+24', 280],
            ['Reactions', 4218, '+342', 75],
            ['Online now', 5, 'live', 150],
          ].map(([label, val, sub, hue], i) => (
            <div key={label} style={{
              padding:'16px 18px',
              borderRight: i < 3 ? '1px solid oklch(0.94 0.005 250)' : 'none',
            }}>
              <div style={{ display:'flex', alignItems:'center', gap: 6, marginBottom: 6 }}>
                <span style={{ width: 7, height: 7, borderRadius: 2, background: `oklch(0.62 0.16 ${hue})` }}/>
                <p style={{ fontSize: 11, fontWeight: 600, margin: 0, color:'oklch(0.50 0.02 250)', textTransform:'uppercase', letterSpacing:'0.04em' }}>{label}</p>
              </div>
              <p style={{
                fontFamily:'"Bricolage Grotesque", Inter, sans-serif',
                fontSize: 28, fontWeight: 700, margin:'0 0 2px',
                letterSpacing:'-0.025em',
              }}>{val.toLocaleString()}</p>
              <p style={{
                fontSize: 11, fontWeight: 600, margin: 0,
                color: `oklch(0.42 0.14 ${hue})`,
              }}>{sub}</p>
            </div>
          ))}
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1.5fr 1fr', gap: 16 }}>
          <section style={{
            border:'1px solid oklch(0.94 0.005 250)', borderRadius: 12, padding: 20,
          }}>
            <h2 style={{
              fontFamily:'"Bricolage Grotesque", Inter, sans-serif',
              fontSize: 16, fontWeight: 700, margin:'0 0 14px', letterSpacing:'-0.02em',
            }}>Activity</h2>
            {POSTS.slice(0, 4).map(post => {
              const ps = spaceFor(post.space);
              const author = personFor(post.author);
              return (
                <div key={post.id} style={{
                  display:'grid', gridTemplateColumns:'24px 1fr auto', gap: 12,
                  alignItems:'center', padding:'10px 0',
                  borderTop:'1px solid oklch(0.95 0.005 250)',
                }}>
                  <Avatar person={author} size={22} />
                  <div style={{ minWidth: 0 }}>
                    <p style={{
                      fontSize: 13, margin: 0, whiteSpace:'nowrap',
                      overflow:'hidden', textOverflow:'ellipsis',
                    }}>
                      <span style={{ fontWeight: 600 }}>{author.name}</span>{' '}
                      <span style={{ color:'oklch(0.50 0.02 250)' }}>posted in </span>
                      <span style={{ color:`oklch(0.42 0.10 ${ps.hue})`, fontWeight: 500 }}>{ps.name}</span>
                    </p>
                    <p style={{
                      fontSize: 12, color:'oklch(0.45 0.02 250)', margin: 0,
                      whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis',
                    }}>{post.title || post.body}</p>
                  </div>
                  <span style={{
                    fontFamily:'JetBrains Mono, monospace', fontSize: 11, color:'oklch(0.50 0.02 250)',
                  }}>{post.date}</span>
                </div>
              );
            })}
          </section>

          <section style={{
            border:'1px solid oklch(0.94 0.005 250)', borderRadius: 12, padding: 20,
            background:'oklch(0.985 0.003 250)',
          }}>
            <p style={{
              fontSize: 11, fontWeight: 700, margin:'0 0 6px',
              textTransform:'uppercase', letterSpacing:'0.06em', color:'oklch(0.50 0.02 250)',
            }}>Subscription</p>
            <p style={{
              fontFamily:'"Bricolage Grotesque", Inter, sans-serif',
              fontSize: 22, fontWeight: 700, margin:'0 0 4px', letterSpacing:'-0.02em',
            }}>Pro — $59/mo</p>
            <p style={{ fontSize: 13, color:'oklch(0.45 0.02 250)', margin:'0 0 16px', lineHeight: 1.45 }}>
              Trial ends in 9 days. Renews automatically.
            </p>
            <button style={{
              padding:'8px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600,
              background:'oklch(0.20 0.02 250)', color:'#fff', border:'none', cursor:'pointer', marginRight: 6,
            }}>Manage plan</button>
            <button style={{
              padding:'8px 14px', borderRadius: 8, fontSize: 13, fontWeight: 500,
              background:'#fff', color:'#202020',
              border:'1px solid oklch(0.90 0.01 250)', cursor:'pointer',
            }}>View invoices</button>
          </section>
        </div>
      </main>
    </div>
  );
}

window.StudioLanding = StudioLanding;
window.StudioSignIn = StudioSignIn;
window.StudioDashboard = StudioDashboard;
