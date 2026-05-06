const { PEOPLE, SPACES, POSTS, MEMBERS, personFor, spaceFor, gildKeyframes,
  Wordmark, Avatar, AvatarStack, LivePill, Reactions, PostImage, CoverArt } = window;
// Members table — one variant per direction. Uses shared MEMBERS data.

function NewsstandMembers() {
  return (
    <div style={{
      fontFamily:'"Inter", system-ui, sans-serif',
      background:'oklch(0.98 0.005 80)', minHeight:'100%', padding:'40px 36px',
      color:'oklch(0.20 0.02 80)',
    }}>
      <p style={{
        fontFamily:'JetBrains Mono, monospace', fontSize: 11,
        letterSpacing:'0.16em', textTransform:'uppercase',
        color:'oklch(0.62 0.14 75)', margin:'0 0 12px',
      }}>The masthead</p>
      <h1 style={{
        fontFamily:'"Instrument Serif", Georgia, serif',
        fontSize: 56, lineHeight: 1, fontWeight: 400,
        margin:'0 0 28px', letterSpacing:'-0.02em',
      }}>Members.</h1>
      <div style={{
        background:'#fff', border:'1px solid oklch(0.92 0.01 80)', borderRadius: 14,
        overflow:'hidden',
      }}>
        <div style={{
          display:'grid', gridTemplateColumns:'2.4fr 1fr 1fr 1fr 0.6fr',
          padding:'14px 22px', borderBottom:'1px solid oklch(0.92 0.01 80)',
          fontFamily:'JetBrains Mono, monospace', fontSize: 10,
          letterSpacing:'0.14em', textTransform:'uppercase',
          color:'oklch(0.50 0.04 80)',
        }}>
          <span>Member</span><span>Role</span><span>Joined</span><span>Posts</span><span></span>
        </div>
        {MEMBERS.map((m, i) => (
          <div key={m.id} style={{
            display:'grid', gridTemplateColumns:'2.4fr 1fr 1fr 1fr 0.6fr',
            alignItems:'center', padding:'14px 22px',
            borderBottom: i < MEMBERS.length-1 ? '1px solid oklch(0.95 0.01 80)' : 'none',
          }}>
            <div style={{ display:'flex', alignItems:'center', gap: 12 }}>
              <Avatar person={m} size={32} presence />
              <div style={{ lineHeight: 1.3 }}>
                <p style={{ fontSize: 14, fontWeight: 500, margin: 0 }}>{m.name}</p>
                <p style={{ fontSize: 12, color:'oklch(0.50 0.04 80)', margin: 0,
                  fontFamily:'"Instrument Serif", Georgia, serif', fontStyle:'italic' }}>
                  {m.handle ? '@' + m.handle : m.email}
                </p>
              </div>
            </div>
            <span style={{
              fontFamily:'"Instrument Serif", Georgia, serif', fontStyle:'italic',
              fontSize: 14, color: m.role === 'owner' ? 'oklch(0.62 0.14 75)' : 'oklch(0.36 0.02 80)',
              textTransform:'capitalize',
            }}>{m.role}</span>
            <span style={{ fontSize: 13, color:'oklch(0.40 0.02 80)' }}>{m.joined}</span>
            <span style={{ fontFamily:'JetBrains Mono, monospace', fontSize: 12, color:'oklch(0.40 0.02 80)' }}>{m.posts}</span>
            <span style={{ textAlign:'right', color:'oklch(0.55 0.04 80)', cursor:'pointer' }}>…</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function StorefrontMembers() {
  return (
    <div style={{
      fontFamily:'"Inter", system-ui, sans-serif',
      background:'oklch(0.97 0.008 250)', minHeight:'100%', padding:'28px 28px',
    }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom: 18 }}>
        <h1 style={{
          fontFamily:'"Bricolage Grotesque", Inter, sans-serif',
          fontSize: 28, fontWeight: 700, margin: 0, letterSpacing:'-0.025em',
        }}>Members <span style={{
          fontSize: 14, fontWeight: 500, color:'oklch(0.50 0.02 250)', marginLeft: 6,
        }}>248</span></h1>
        <button style={{
          padding:'8px 14px', borderRadius: 999,
          background:'oklch(0.62 0.16 75)', color:'#fff', border:'none',
          fontSize: 13, fontWeight: 600, cursor:'pointer',
        }}>+ Invite people</button>
      </div>
      <div style={{
        display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(220px, 1fr))', gap: 12,
      }}>
        {MEMBERS.map(m => (
          <div key={m.id} style={{
            background:'#fff', borderRadius: 14, padding:'16px 16px',
            border:'1px solid oklch(0.92 0.01 250)',
            display:'flex', flexDirection:'column', gap: 10,
          }}>
            <div style={{ display:'flex', alignItems:'center', gap: 10 }}>
              <Avatar person={m} size={36} presence />
              <div style={{ lineHeight: 1.25, flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 13, fontWeight: 600, margin: 0,
                  whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{m.name}</p>
                <p style={{ fontSize: 11, color:'oklch(0.50 0.02 250)', margin: 0,
                  fontFamily:'JetBrains Mono, monospace' }}>{m.handle ? '@' + m.handle : m.email}</p>
              </div>
            </div>
            <div style={{ display:'flex', gap: 6 }}>
              <span style={{
                padding:'2px 8px', borderRadius: 999, fontSize: 10, fontWeight: 600,
                background: m.role === 'owner' ? 'oklch(0.94 0.06 75)' : 'oklch(0.96 0.02 250)',
                color: m.role === 'owner' ? 'oklch(0.40 0.10 75)' : 'oklch(0.40 0.06 250)',
                textTransform:'capitalize',
              }}>{m.role}</span>
              {m.online && (
                <span style={{
                  padding:'2px 8px', borderRadius: 999, fontSize: 10, fontWeight: 600,
                  background:'oklch(0.96 0.04 150)', color:'oklch(0.36 0.10 150)',
                  display:'inline-flex', alignItems:'center', gap: 4,
                }}>
                  <span style={{ width: 5, height: 5, borderRadius:'50%', background:'oklch(0.62 0.18 150)' }}/>
                  online
                </span>
              )}
            </div>
            <div style={{
              display:'flex', justifyContent:'space-between',
              fontSize: 11, color:'oklch(0.50 0.02 250)',
              fontFamily:'JetBrains Mono, monospace',
              paddingTop: 8, borderTop:'1px solid oklch(0.95 0.005 250)',
            }}>
              <span>{m.joined}</span>
              <span>{m.posts} posts</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function InkwellMembers() {
  return (
    <div style={{
      fontFamily:'"Inter", system-ui, sans-serif',
      background:'oklch(0.96 0.012 80)', minHeight:'100%',
      padding:'48px 36px', color:'oklch(0.20 0.02 80)',
    }}>
      <p style={{
        fontFamily:'JetBrains Mono, monospace', fontSize: 11,
        letterSpacing:'0.22em', textTransform:'uppercase',
        color:'oklch(0.62 0.14 75)', margin:'0 0 12px',
      }}>The roll</p>
      <h1 style={{
        fontFamily:'"Instrument Serif", Georgia, serif',
        fontSize: 64, lineHeight: 0.95, fontWeight: 400,
        margin:'0 0 12px', letterSpacing:'-0.02em',
      }}>Members of record.</h1>
      <div style={{
        height: 1, width: 100,
        background:'oklch(0.62 0.14 75)', margin:'0 0 28px',
      }}/>
      {MEMBERS.map((m, i) => (
        <div key={m.id} style={{
          display:'grid', gridTemplateColumns:'auto 1.3fr 1fr 1fr 1fr',
          alignItems:'baseline', gap: 18, padding:'16px 0',
          borderBottom:'1px solid oklch(0.86 0.02 80)',
        }}>
          <span style={{
            fontFamily:'"Instrument Serif", Georgia, serif',
            fontSize: 24, color:'oklch(0.62 0.14 75)', lineHeight: 1, fontWeight: 400,
          }}>{String(i + 1).padStart(2,'0')}</span>
          <div style={{ display:'flex', alignItems:'center', gap: 12 }}>
            <Avatar person={m} size={28} presence />
            <span style={{
              fontFamily:'"Instrument Serif", Georgia, serif', fontSize: 22,
              fontWeight: 400, letterSpacing:'-0.01em',
            }}>{m.name}</span>
          </div>
          <span style={{
            fontFamily:'"Instrument Serif", Georgia, serif', fontStyle:'italic',
            fontSize: 16, color:'oklch(0.40 0.04 80)', textTransform:'capitalize',
          }}>{m.role}</span>
          <span style={{ fontFamily:'JetBrains Mono, monospace', fontSize: 12, color:'oklch(0.45 0.04 80)' }}>
            joined {m.joined}
          </span>
          <span style={{
            fontFamily:'JetBrains Mono, monospace', fontSize: 12, color:'oklch(0.45 0.04 80)',
            textAlign:'right',
          }}>
            {m.posts} marks
          </span>
        </div>
      ))}
    </div>
  );
}

function StudioMembers() {
  return (
    <div style={{
      fontFamily:'"Inter", system-ui, sans-serif',
      background:'#fff', minHeight:'100%', padding:'24px 28px',
      color:'#202020',
    }}>
      <div style={{ display:'flex', alignItems:'baseline', gap: 12, marginBottom: 18 }}>
        <h1 style={{
          fontFamily:'"Bricolage Grotesque", Inter, sans-serif',
          fontSize: 24, fontWeight: 700, margin: 0, letterSpacing:'-0.025em',
        }}>Members</h1>
        <span style={{
          padding:'2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600,
          background:'oklch(0.96 0.005 250)', color:'oklch(0.40 0.02 250)',
        }}>{MEMBERS.length}</span>
        <input placeholder="Filter members…" style={{
          marginLeft:'auto', padding:'6px 12px', fontSize: 13,
          border:'1px solid oklch(0.90 0.01 250)', borderRadius: 6, outline:'none',
          width: 220, fontFamily:'inherit',
        }}/>
        <button style={{
          padding:'7px 12px', borderRadius: 6, fontSize: 13, fontWeight: 500,
          background:'oklch(0.20 0.02 250)', color:'#fff', border:'none', cursor:'pointer',
        }}>Invite</button>
      </div>
      <table style={{ width:'100%', borderCollapse:'collapse', fontSize: 13 }}>
        <thead>
          <tr style={{
            textAlign:'left', fontSize: 11, fontWeight: 600,
            color:'oklch(0.50 0.02 250)', textTransform:'uppercase', letterSpacing:'0.04em',
          }}>
            <th style={{ padding:'10px 8px', borderBottom:'1px solid oklch(0.94 0.005 250)' }}>Name</th>
            <th style={{ padding:'10px 8px', borderBottom:'1px solid oklch(0.94 0.005 250)' }}>Role</th>
            <th style={{ padding:'10px 8px', borderBottom:'1px solid oklch(0.94 0.005 250)' }}>Joined</th>
            <th style={{ padding:'10px 8px', borderBottom:'1px solid oklch(0.94 0.005 250)' }}>Posts</th>
            <th style={{ padding:'10px 8px', borderBottom:'1px solid oklch(0.94 0.005 250)' }}>Status</th>
          </tr>
        </thead>
        <tbody>
          {MEMBERS.map(m => (
            <tr key={m.id} style={{ borderBottom:'1px solid oklch(0.96 0.005 250)' }}>
              <td style={{ padding:'10px 8px' }}>
                <div style={{ display:'flex', alignItems:'center', gap: 10 }}>
                  <Avatar person={m} size={26} presence />
                  <div style={{ lineHeight: 1.25 }}>
                    <p style={{ fontSize: 13, fontWeight: 500, margin: 0 }}>{m.name}</p>
                    <p style={{ fontSize: 11, color:'oklch(0.50 0.02 250)', margin: 0,
                      fontFamily:'JetBrains Mono, monospace' }}>{m.handle ? '@' + m.handle : m.email}</p>
                  </div>
                </div>
              </td>
              <td style={{ padding:'10px 8px' }}>
                <span style={{
                  padding:'2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600,
                  background: m.role === 'owner' ? 'oklch(0.94 0.06 75)' : 'oklch(0.96 0.005 250)',
                  color: m.role === 'owner' ? 'oklch(0.40 0.10 75)' : 'oklch(0.40 0.02 250)',
                  textTransform:'capitalize',
                }}>{m.role}</span>
              </td>
              <td style={{ padding:'10px 8px', color:'oklch(0.40 0.02 250)' }}>{m.joined}</td>
              <td style={{ padding:'10px 8px', fontFamily:'JetBrains Mono, monospace', color:'oklch(0.40 0.02 250)' }}>{m.posts}</td>
              <td style={{ padding:'10px 8px' }}>
                {m.online ? (
                  <span style={{ display:'inline-flex', alignItems:'center', gap: 6, fontSize: 12, color:'oklch(0.42 0.14 150)', fontWeight: 600 }}>
                    <span style={{ width: 6, height: 6, borderRadius:'50%', background:'oklch(0.62 0.18 150)' }}/>
                    Online
                  </span>
                ) : (
                  <span style={{ fontSize: 12, color:'oklch(0.55 0.02 250)' }}>Offline</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

window.NewsstandMembers = NewsstandMembers;
window.StorefrontMembers = StorefrontMembers;
window.InkwellMembers = InkwellMembers;
window.StudioMembers = StudioMembers;
