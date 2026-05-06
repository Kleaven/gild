const { PEOPLE, SPACES, POSTS, MEMBERS, personFor, spaceFor, gildKeyframes,
  Wordmark, Avatar, AvatarStack, LivePill, Reactions, PostImage, CoverArt } = window;
// Direction 4 — STUDIO
// Notion-flavored. Clean white, channel-color dots, "live now" rail, dense.

function StudioFeed({ spaceId = 'building' }) {
  const space = spaceFor(spaceId);
  const onlinePeople = PEOPLE.filter(p => p.online);
  const posts = POSTS;

  return (
    <div style={{
      fontFamily:'"Inter", system-ui, sans-serif',
      background:'#fff', minHeight:'100%', color:'#202020',
    }}>
      <style>{gildKeyframes}</style>

      <div style={{ display:'grid', gridTemplateColumns:'240px 1fr 280px', minHeight:'100%' }}>
        {/* Workspace rail */}
        <aside style={{
          background:'oklch(0.985 0.003 250)',
          borderRight:'1px solid oklch(0.94 0.005 250)',
          padding:'14px 10px', display:'flex', flexDirection:'column', gap: 18,
        }}>
          <div style={{
            display:'flex', alignItems:'center', gap: 10, padding:'4px 8px',
          }}>
            <div style={{
              width: 28, height: 28, borderRadius: 7,
              background:'linear-gradient(135deg, oklch(0.78 0.14 75), oklch(0.55 0.14 75))',
              color:'#fff', display:'flex', alignItems:'center', justifyContent:'center',
              fontFamily:'"Bricolage Grotesque", Inter, sans-serif',
              fontWeight: 800, fontSize: 14, letterSpacing:'-0.04em',
            }}>G</div>
            <div style={{ lineHeight: 1.25, flex: 1 }}>
              <p style={{ fontSize: 13, fontWeight: 600, margin: 0 }}>Acme Builders</p>
              <p style={{ fontSize: 11, color:'oklch(0.50 0.02 250)', margin: 0 }}>248 members · Pro</p>
            </div>
            <span style={{ fontSize: 13, color:'oklch(0.55 0.02 250)' }}>⌄</span>
          </div>

          <div>
            <p style={{
              fontSize: 11, fontWeight: 600,
              color:'oklch(0.55 0.02 250)', padding:'0 10px 4px', margin: 0,
              textTransform:'uppercase', letterSpacing:'0.04em',
            }}>Spaces</p>
            {SPACES.map(s => {
              const active = s.id === spaceId;
              return (
                <a key={s.id} href="#" style={{
                  display:'flex', alignItems:'center', gap: 10,
                  padding:'5px 10px', borderRadius: 6, marginBottom: 1,
                  textDecoration:'none', fontSize: 14,
                  background: active ? 'oklch(0.94 0.005 250)' : 'transparent',
                  color: active ? '#202020' : 'oklch(0.30 0.02 250)',
                  fontWeight: active ? 600 : 400,
                }}>
                  <span style={{
                    width: 8, height: 8, borderRadius: 2,
                    background: `oklch(0.62 0.16 ${s.hue})`,
                    boxShadow: active ? `0 0 0 3px oklch(0.62 0.16 ${s.hue} / 0.18)` : 'none',
                  }}/>
                  <span style={{ flex: 1 }}>{s.name}</span>
                  {s.id === 'wins' && (
                    <span style={{
                      fontFamily:'JetBrains Mono, monospace', fontSize: 10,
                      background:'oklch(0.94 0.005 250)', color:'oklch(0.40 0.02 250)',
                      padding:'1px 6px', borderRadius: 999,
                    }}>3</span>
                  )}
                </a>
              );
            })}
            <a href="#" style={{
              display:'block', padding:'5px 10px', borderRadius: 6,
              fontSize: 13, color:'oklch(0.55 0.02 250)',
              textDecoration:'none', marginTop: 2,
            }}>+ New space</a>
          </div>

          <div>
            <p style={{
              fontSize: 11, fontWeight: 600,
              color:'oklch(0.55 0.02 250)', padding:'0 10px 4px', margin: 0,
              textTransform:'uppercase', letterSpacing:'0.04em',
            }}>Library</p>
            {[
              ['Members', '248'],
              ['Courses', '4'],
              ['Search', null],
            ].map(([label, count]) => (
              <a key={label} href="#" style={{
                display:'flex', alignItems:'center',
                padding:'5px 10px', borderRadius: 6,
                textDecoration:'none', fontSize: 14, color:'oklch(0.30 0.02 250)',
              }}>
                <span style={{ flex: 1 }}>{label}</span>
                {count && (
                  <span style={{
                    fontFamily:'JetBrains Mono, monospace', fontSize: 11,
                    color:'oklch(0.55 0.02 250)',
                  }}>{count}</span>
                )}
              </a>
            ))}
          </div>

          <div style={{
            marginTop:'auto', padding: 10, borderRadius: 8,
            background:'oklch(0.94 0.005 250)',
            display:'flex', alignItems:'center', gap: 10,
          }}>
            <Avatar person={personFor('jordan')} size={24} presence />
            <div style={{ flex: 1, lineHeight: 1.2 }}>
              <p style={{ fontSize: 12, fontWeight: 600, margin: 0 }}>Jordan</p>
              <p style={{ fontSize: 11, color:'oklch(0.50 0.02 250)', margin: 0 }}>Owner</p>
            </div>
            <span style={{ fontSize: 13, color:'oklch(0.55 0.02 250)' }}>…</span>
          </div>
        </aside>

        {/* Main */}
        <main style={{ overflow:'auto' }}>
          {/* Space header */}
          <div style={{
            padding:'18px 36px 14px',
            borderBottom:'1px solid oklch(0.95 0.005 250)',
            background:'#fff',
          }}>
            <div style={{ display:'flex', alignItems:'center', gap: 10, marginBottom: 10 }}>
              <span style={{
                width: 22, height: 22, borderRadius: 6,
                background: `linear-gradient(135deg, oklch(0.85 0.10 ${space.hue}), oklch(0.62 0.16 ${space.hue}))`,
              }}/>
              <p style={{
                fontSize: 12, color:'oklch(0.50 0.02 250)', margin: 0,
                fontFamily:'JetBrains Mono, monospace',
              }}>Acme Builders / {space.name}</p>
            </div>
            <h1 style={{
              fontFamily:'"Bricolage Grotesque", Inter, sans-serif',
              fontSize: 30, fontWeight: 700, margin:'0 0 4px',
              letterSpacing:'-0.025em',
            }}>{space.name}</h1>
            <p style={{ fontSize: 14, color:'oklch(0.42 0.02 250)', margin: 0 }}>{space.desc}</p>
            <div style={{ display:'flex', alignItems:'center', gap: 16, marginTop: 12 }}>
              <AvatarStack people={onlinePeople} max={5} size={24} bg="#fff" />
              <LivePill count={onlinePeople.length} hue={150} />
              <span style={{
                fontFamily:'JetBrains Mono, monospace', fontSize: 11, color:'oklch(0.50 0.02 250)',
              }}>{space.members} members</span>
              <button style={{
                marginLeft:'auto', padding:'5px 12px', borderRadius: 6,
                background:'transparent', border:'1px solid oklch(0.88 0.01 250)',
                color:'oklch(0.30 0.02 250)', fontSize: 12, fontWeight: 500, cursor:'pointer',
              }}>Filter</button>
              <button style={{
                padding:'5px 12px', borderRadius: 6,
                background:`oklch(0.62 0.16 ${space.hue})`, color:'#fff',
                border:'none', fontSize: 12, fontWeight: 600, cursor:'pointer',
              }}>+ New post</button>
            </div>
          </div>

          {/* Composer */}
          <div style={{ padding:'18px 36px 0' }}>
            <div style={{
              display:'flex', alignItems:'center', gap: 10,
              padding:'10px 14px', borderRadius: 8,
              background:'oklch(0.985 0.003 250)',
              border:'1px solid oklch(0.94 0.005 250)',
            }}>
              <Avatar person={personFor('jordan')} size={28} />
              <input placeholder="What did you ship today?" style={{
                flex: 1, border:'none', outline:'none', background:'transparent',
                fontSize: 14, fontFamily:'inherit', color:'#202020',
              }}/>
              <button style={{
                padding:'5px 12px', borderRadius: 6, fontSize: 12, fontWeight: 600,
                background:`oklch(0.62 0.16 ${space.hue})`, color:'#fff',
                border:'none', cursor:'pointer',
              }}>Post</button>
            </div>
          </div>

          {/* Live activity bar */}
          <div style={{
            display:'flex', alignItems:'center', gap: 8,
            padding:'14px 36px 4px',
            fontSize: 12, color:'oklch(0.50 0.02 250)',
            fontFamily:'JetBrains Mono, monospace',
          }}>
            <span style={{
              width: 6, height: 6, borderRadius:'50%',
              background:'oklch(0.62 0.18 150)',
              animation:'gild-pulse 2s ease-in-out infinite',
            }}/>
            Mira is typing in #building
          </div>

          {/* Posts */}
          <div style={{ padding:'0 36px 40px' }}>
            {posts.map(post => {
              const author = personFor(post.author);
              const ps = spaceFor(post.space);
              return (
                <article key={post.id} style={{
                  padding:'18px 0',
                  borderBottom:'1px solid oklch(0.95 0.005 250)',
                  display:'grid', gridTemplateColumns:'40px 1fr', gap: 14,
                }}>
                  <Avatar person={author} size={36} presence />
                  <div>
                    <div style={{ display:'flex', alignItems:'center', gap: 8, marginBottom: 4, flexWrap:'wrap' }}>
                      <span style={{ fontSize: 14, fontWeight: 600 }}>{author.name}</span>
                      <span style={{
                        fontSize: 11, fontFamily:'JetBrains Mono, monospace',
                        color:'oklch(0.50 0.02 250)',
                      }}>
                        {author.handle ? '@' + author.handle : author.role} · {post.date}
                      </span>
                      <span style={{
                        display:'inline-flex', alignItems:'center', gap: 4,
                        padding:'1px 8px', borderRadius: 999,
                        background: `oklch(0.96 0.02 ${ps.hue})`,
                        color: `oklch(0.36 0.10 ${ps.hue})`,
                        fontSize: 10, fontWeight: 600,
                      }}>
                        <span style={{ width: 5, height: 5, borderRadius:'50%', background: `oklch(0.62 0.16 ${ps.hue})` }}/>
                        {ps.name}
                      </span>
                      {post.pinned && (
                        <span style={{
                          padding:'1px 8px', borderRadius: 999,
                          background:'oklch(0.94 0.06 75)', color:'oklch(0.40 0.10 75)',
                          fontSize: 10, fontWeight: 600,
                        }}>Pinned</span>
                      )}
                    </div>

                    {post.title && (
                      <h2 style={{
                        fontFamily:'"Bricolage Grotesque", Inter, sans-serif',
                        fontSize: 17, fontWeight: 700, margin:'2px 0 6px',
                        letterSpacing:'-0.015em', textWrap:'pretty',
                      }}>{post.title}</h2>
                    )}
                    <p style={{
                      fontSize: 14, lineHeight: 1.55, color:'oklch(0.28 0.02 250)',
                      margin:'0 0 10px', textWrap:'pretty',
                    }}>{post.body}</p>

                    {post.image && (
                      <div style={{ marginBottom: 10, maxWidth: 480 }}>
                        <PostImage hue={ps.hue} label={post.image} height={180}
                          variant={post.image === 'chart' ? 'chart' : 'wash'} />
                      </div>
                    )}

                    {post.link && (
                      <a href="#" style={{
                        display:'flex', gap: 12, textDecoration:'none', color:'inherit',
                        border:'1px solid oklch(0.93 0.005 250)', borderRadius: 8,
                        padding:'10px', marginBottom: 10, maxWidth: 480,
                        background:'oklch(0.985 0.003 250)',
                      }}>
                        <div style={{
                          width: 44, height: 44, borderRadius: 6, flexShrink: 0,
                          background: `linear-gradient(135deg, oklch(0.85 0.10 ${ps.hue}), oklch(0.62 0.16 ${ps.hue}))`,
                        }}/>
                        <div>
                          <p style={{ fontSize: 13, fontWeight: 600, margin:'0 0 2px' }}>{post.link.title}</p>
                          <p style={{
                            fontSize: 11, color:'oklch(0.50 0.02 250)', margin: 0,
                            fontFamily:'JetBrains Mono, monospace',
                          }}>{post.link.url}</p>
                        </div>
                      </a>
                    )}

                    <div style={{ display:'flex', alignItems:'center', gap: 10, flexWrap:'wrap' }}>
                      <Reactions items={post.reactions} hue={ps.hue} />
                      <span style={{ flex:1 }}/>
                      <span style={{
                        fontSize: 12, color:'oklch(0.50 0.02 250)',
                        fontFamily:'JetBrains Mono, monospace',
                      }}>{post.comments} replies</span>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </main>

        {/* Right: live now panel */}
        <aside style={{
          borderLeft:'1px solid oklch(0.94 0.005 250)',
          padding:'18px 18px', background:'oklch(0.99 0.002 250)',
          display:'flex', flexDirection:'column', gap: 18,
        }}>
          <div>
            <div style={{ display:'flex', alignItems:'center', gap: 8, marginBottom: 10 }}>
              <span style={{
                width: 8, height: 8, borderRadius:'50%',
                background:'oklch(0.62 0.18 150)',
                animation:'gild-pulse 2s ease-in-out infinite',
              }}/>
              <p style={{
                fontSize: 11, fontWeight: 600,
                textTransform:'uppercase', letterSpacing:'0.06em',
                color:'oklch(0.42 0.14 150)', margin: 0,
              }}>Live now · {onlinePeople.length}</p>
            </div>
            {onlinePeople.map(p => (
              <div key={p.id} style={{
                display:'flex', alignItems:'center', gap: 10, padding:'5px 0',
              }}>
                <Avatar person={p} size={24} presence />
                <div style={{ lineHeight: 1.2, flex: 1 }}>
                  <p style={{ fontSize: 13, fontWeight: 500, margin: 0 }}>{p.name}</p>
                  <p style={{
                    fontSize: 10, color:'oklch(0.50 0.02 250)', margin: 0,
                    fontFamily:'JetBrains Mono, monospace',
                  }}>in #{p.role === 'owner' ? 'announcements' : p.role === 'admin' ? 'building' : 'general'}</p>
                </div>
              </div>
            ))}
          </div>

          <div>
            <p style={{
              fontSize: 11, fontWeight: 600,
              textTransform:'uppercase', letterSpacing:'0.06em',
              color:'oklch(0.50 0.02 250)', margin:'0 0 8px',
            }}>Pulse · 7 days</p>
            <div style={{
              display:'grid', gridTemplateColumns:'repeat(2, 1fr)', gap: 8,
            }}>
              {[
                ['Posts', '+24', 280],
                ['Replies', '+118', 220],
                ['New members', '+12', 150],
                ['Reactions', '+342', 75],
              ].map(([label, val, hue]) => (
                <div key={label} style={{
                  padding:'10px 12px', borderRadius: 8,
                  background:'#fff',
                  border:'1px solid oklch(0.94 0.005 250)',
                }}>
                  <p style={{
                    fontFamily:'"Bricolage Grotesque", Inter, sans-serif',
                    fontSize: 18, fontWeight: 700, margin:'0 0 2px',
                    color: `oklch(0.42 0.14 ${hue})`, letterSpacing:'-0.02em',
                  }}>{val}</p>
                  <p style={{
                    fontSize: 10, color:'oklch(0.50 0.02 250)', margin: 0,
                    textTransform:'uppercase', letterSpacing:'0.04em', fontWeight: 600,
                  }}>{label}</p>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

window.StudioFeed = StudioFeed;
