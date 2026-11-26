import { Fragment, useMemo, useState } from 'react'
import { CUSTOMERS, EMAIL_TYPES, FLAVOURS, HOURS_DATA, REV_DATA, UNITS_DATA } from '../data/mock'
import { boxTypeLabel } from '../lib/pricing'
import { setUseMock, supabase, supabaseConfigured } from '../lib/supabase'
import type { Flavour, Order, OrderStatus, StockMap } from '../types'

type AdminTab = 'dashboard' | 'liveops' | 'orders' | 'customers' | 'menu' | 'emails' | 'settings'

const TABS: Array<{ id: AdminTab; label: string; icon: string }> = [
  { id: 'dashboard', label: 'Dashboard', icon: '▦' },
  { id: 'liveops', label: 'Live ops', icon: '◎' },
  { id: 'orders', label: 'Orders', icon: '☰' },
  { id: 'customers', label: 'Customers', icon: '👥' },
  { id: 'menu', label: 'Menu', icon: '🍡' },
  { id: 'emails', label: 'Notifications', icon: '✉' },
  { id: 'settings', label: 'Settings', icon: '⚙' },
]

const AVATAR_COLORS = ['#1A4FA0', '#7B3F6E', '#D4697A', '#5C7A5C', '#4A2C2A', '#C4882D', '#B5651D', '#153E82']

function BarChart({ data, suffix = '' }: { data: ReadonlyArray<{ l: string; v: number }>; suffix?: string }) {
  const max = Math.max(...data.map(d => d.v))
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 120 }}>
        {data.map((d, i) => {
          const last = i === data.length - 1
          return (
            <div key={d.l} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, height: '100%', justifyContent: 'flex-end' }}>
              {last && (
                <span style={{ fontFamily: 'Poppins', fontSize: 10, fontWeight: 800, color: 'var(--blue)' }}>
                  £{d.v}
                </span>
              )}
              <div
                style={{
                  width: '100%',
                  maxWidth: 36,
                  height: `${Math.max(4, (d.v / max) * 100)}%`,
                  background: 'var(--blue)',
                  opacity: last ? 1 : 0.45,
                  borderRadius: 4,
                }}
              />
            </div>
          )
        })}
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
        {data.map((d, i) => (
          <div
            key={d.l}
            style={{
              flex: 1,
              textAlign: 'center',
              fontSize: 10,
              fontWeight: i === data.length - 1 ? 800 : 600,
              color: i === data.length - 1 ? 'var(--blue)' : '#9a9488',
            }}
          >
            {d.l}
            {suffix}
          </div>
        ))}
      </div>
    </div>
  )
}

function StatusPill({ status }: { status: OrderStatus }) {
  const label =
    status === 'collected' ? 'Collected ✓' : status === 'ready' ? 'Ready' : status === 'in_queue' ? 'In queue' : status === 'pending' ? 'Awaiting' : 'Cancelled'
  return <span className={`status-pill ${status}`}>{label}</span>
}

interface Props {
  orders: Order[]
  stock: StockMap
  noNav: boolean
  useMock: boolean
  onSetStatus: (id: number, status: OrderStatus) => void
  onStockChange: (id: string, qty: number) => void
  onToggleOut: (id: string) => void
}

export default function AdminScreen({
  orders,
  stock,
  noNav,
  useMock,
  onSetStatus,
  onStockChange,
  onToggleOut,
}: Props) {
  const [tab, setTab] = useState<AdminTab>('dashboard')
  const [revRange, setRevRange] = useState<'7d' | '30d' | 'all'>('7d')
  const [hoursRange, setHoursRange] = useState<'today' | '7d' | '30d' | 'all'>('today')
  const [expanded, setExpanded] = useState<number | null>(null)
  const [ordSearch, setOrdSearch] = useState('')
  const [ordFilter, setOrdFilter] = useState<'all' | 'till' | 'kiosk' | 'preorder'>('all')
  const [flavours, setFlavours] = useState<Flavour[]>(FLAVOURS)

  const collected = orders.filter(o => o.status === 'collected')
  const revenue = collected.reduce((s, o) => s + o.total, 0)
  const aov = collected.length ? revenue / collected.length : 0

  const units = useMemo(() => UNITS_DATA[hoursRange === 'today' ? 'today' : hoursRange === '7d' ? '7d' : hoursRange === '30d' ? '30d' : 'all'], [hoursRange])
  const maxUnit = Math.max(...units.map(u => u.v))

  const filteredOrders = useMemo(() => {
    const q = ordSearch.trim().toLowerCase()
    return orders.filter(o => {
      if (ordFilter !== 'all' && o.source !== ordFilter) return false
      if (q && !o.name.toLowerCase().includes(q) && !String(o.id).includes(q)) return false
      return true
    })
  }, [orders, ordSearch, ordFilter])

  const heading = TABS.find(t => t.id === tab)?.label ?? 'Dashboard'

  return (
    <div className={`admin-shell${noNav ? ' no-nav' : ''}`}>
      <aside className="admin-sidebar">
        <div className="admin-sidebar-logo">
          <div>
            <div className="wordmark">puffies</div>
            <div className="sub">Admin</div>
          </div>
        </div>
        <nav className="admin-sidenav">
          {TABS.map(t => (
            <button
              key={t.id}
              className={`admin-sidenav-item${tab === t.id ? ' active' : ''}`}
              onClick={() => setTab(t.id)}
            >
              <span className="snav-icon" aria-hidden style={{ fontSize: 13, display: 'inline-flex', justifyContent: 'center' }}>
                {t.icon}
              </span>
              {t.label}
            </button>
          ))}
        </nav>
        <div className="admin-sidebar-foot">
          <div className="live-badge">
            <span className="live-dot" /> {useMock ? 'Mock data' : 'Live · Supabase'}
          </div>
          {!useMock && (
            <button
              type="button"
              className="admin-signout"
              onClick={() => {
                void supabase?.auth.signOut()
              }}
            >
              Sign out
            </button>
          )}
        </div>
      </aside>

      <main className="admin-content">
        <div className="admin-header">
          <div className="admin-title">{heading}</div>
          <div style={{ fontSize: 12, color: 'rgba(245,240,224,.6)', marginTop: 2 }}>
            Puffies pop-up · Day 12 of 30
          </div>
        </div>

        <div className="admin-body">
          {tab === 'dashboard' && (
            <>
              <div className="metric-grid">
                <div className="metric">
                  <div className="metric-label">Revenue today</div>
                  <div className="metric-value">£{revenue}</div>
                  <div className="metric-delta">+12.4% vs last week</div>
                </div>
                <div className="metric">
                  <div className="metric-label">Orders</div>
                  <div className="metric-value">{orders.length}</div>
                  <div className="metric-delta">{collected.length} collected</div>
                </div>
                <div className="metric">
                  <div className="metric-label">Avg order</div>
                  <div className="metric-value">£{aov.toFixed(2)}</div>
                  <div className="metric-delta">+£0.60</div>
                </div>
                <div className="metric">
                  <div className="metric-label">Units sold</div>
                  <div className="metric-value">{units.reduce((s, u) => s + u.v, 0)}</div>
                  <div className="metric-delta">across 6 flavours</div>
                </div>
              </div>

              <div className="panel">
                <div className="panel-head">
                  <div className="panel-title">Revenue</div>
                  <div className="seg">
                    {(['7d', '30d', 'all'] as const).map(r => (
                      <button key={r} className={revRange === r ? 'active' : ''} onClick={() => setRevRange(r)}>
                        {r === 'all' ? 'All' : r.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>
                <BarChart data={REV_DATA[revRange]} />
              </div>

              <div className="panel">
                <div className="panel-head">
                  <div className="panel-title">Busiest hours</div>
                  <div className="seg">
                    {(['today', '7d', '30d'] as const).map(r => (
                      <button key={r} className={hoursRange === r ? 'active' : ''} onClick={() => setHoursRange(r)}>
                        {r === 'today' ? 'Today' : r.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>
                <BarChart data={HOURS_DATA[hoursRange]} />
              </div>

              <div className="panel">
                <div className="panel-head">
                  <div className="panel-title">Units sold per flavour</div>
                </div>
                {units.map(u => (
                  <div className="bar-row" key={u.name}>
                    <div className="bar-row-name">
                      {u.emoji} {u.name}
                    </div>
                    <div className="bar-track">
                      <div className="bar-fill" style={{ width: `${(u.v / maxUnit) * 100}%`, background: u.hex }} />
                    </div>
                    <div className="bar-row-val">{u.v}</div>
                  </div>
                ))}
              </div>
            </>
          )}

          {tab === 'liveops' && (
            <>
              <div className="metric-grid">
                <div className="metric">
                  <div className="metric-label">Awaiting payment</div>
                  <div className="metric-value">{orders.filter(o => o.status === 'pending').length}</div>
                </div>
                <div className="metric">
                  <div className="metric-label">In queue</div>
                  <div className="metric-value">{orders.filter(o => o.status === 'in_queue').length}</div>
                </div>
                <div className="metric">
                  <div className="metric-label">Ready</div>
                  <div className="metric-value">{orders.filter(o => o.status === 'ready').length}</div>
                </div>
                <div className="metric">
                  <div className="metric-label">Collected today</div>
                  <div className="metric-value">{collected.length}</div>
                </div>
              </div>

              <div className="panel">
                <div className="panel-head">
                  <div className="panel-title">Pre-orders pushing soon</div>
                </div>
                {orders
                  .filter(o => o.source === 'preorder' && (o.status === 'pending' || o.status === 'in_queue'))
                  .map(o => (
                    <div className="customer-row" key={o.id}>
                      <div className="menu-name">
                        <strong>#{o.id} · {o.name}</strong>
                        <span>
                          {o.slot} slot · auto-push 15 min before
                        </span>
                      </div>
                      <StatusPill status={o.status} />
                    </div>
                  ))}
                {orders.filter(o => o.source === 'preorder' && o.status !== 'collected').length === 0 && (
                  <div className="empty-col">Nothing scheduled</div>
                )}
              </div>
            </>
          )}

          {tab === 'orders' && (
            <div className="panel" style={{ marginTop: 0 }}>
              <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
                <input
                  className="field-sm"
                  style={{ flex: 1, minWidth: 160 }}
                  placeholder="Search name or order #"
                  value={ordSearch}
                  onChange={e => setOrdSearch(e.target.value)}
                />
                <div className="seg">
                  {(['all', 'till', 'kiosk', 'preorder'] as const).map(f => (
                    <button key={f} className={ordFilter === f ? 'active' : ''} onClick={() => setOrdFilter(f)}>
                      {f === 'all' ? 'All' : f === 'till' ? 'Walk-in' : f === 'kiosk' ? 'Kiosk' : 'Pre-order'}
                    </button>
                  ))}
                </div>
              </div>
              <table className="ord-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Customer</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map(o => (
                    <Fragment key={o.id}>
                      <tr style={{ cursor: 'pointer' }} onClick={() => setExpanded(expanded === o.id ? null : o.id)}>
                        <td style={{ fontFamily: 'Poppins', fontWeight: 700 }}>{o.id}</td>
                        <td>
                          <div style={{ fontWeight: 700 }}>
                            {o.name} {o.loyalty && '🎁'} {o.note && '📝'}
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--muted)' }}>
                            {o.source === 'preorder' ? `Pre-order · ${o.slot}` : o.source === 'kiosk' ? 'Kiosk' : 'Walk-in'} · {o.placedAt}
                          </div>
                        </td>
                        <td style={{ fontWeight: 700 }}>£{o.total}</td>
                        <td>
                          <StatusPill status={o.status} />
                        </td>
                        <td style={{ textAlign: 'right', color: '#9a9488' }}>{expanded === o.id ? '▴' : '▾'}</td>
                      </tr>
                      {expanded === o.id && (
                        <tr>
                          <td colSpan={5} style={{ background: '#faf8f5' }}>
                            {o.boxes.map((b, i) => (
                              <div key={i} style={{ marginBottom: 6 }}>
                                <div className="label" style={{ fontSize: 10 }}>
                                  {o.boxes.length > 1 ? `Box ${i + 1} · ` : ''}
                                  {boxTypeLabel(b.size, b.slots, FLAVOURS)}
                                </div>
                                <div className="tag-row">
                                  {b.slots.filter(Boolean).map((id, j) => {
                                    const f = FLAVOURS.find(x => x.id === id)
                                    return (
                                      <span className="order-tag" key={j}>
                                        {f?.emoji} {f?.name}
                                      </span>
                                    )
                                  })}
                                </div>
                              </div>
                            ))}
                            {o.status !== 'collected' && (
                              <button
                                className="btn-blue"
                                style={{ marginTop: 8 }}
                                onClick={() => onSetStatus(o.id, 'collected')}
                              >
                                Mark collected
                              </button>
                            )}
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {tab === 'customers' && (
            <div className="panel" style={{ marginTop: 0 }}>
              <div className="panel-head">
                <div className="panel-title">{CUSTOMERS.length} customers</div>
                <div className="small">{CUSTOMERS.filter(c => c.loyalty).length} loyalty members</div>
              </div>
              {CUSTOMERS.map((c, i) => (
                <div className="customer-row" key={c.id}>
                  <div className="avatar" style={{ background: AVATAR_COLORS[i % AVATAR_COLORS.length] }}>
                    {c.name.charAt(0)}
                  </div>
                  <div className="menu-name">
                    <strong>{c.name}</strong>
                    <span>
                      {c.email ?? 'No email'} · {c.orders} orders · £{c.spend}
                    </span>
                  </div>
                  {c.freeBoxOwed && <span className="free-badge">🎁 Free box</span>}
                  {!c.freeBoxOwed && c.loyalty && (
                    <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--blue)' }}>{c.orders % 5}/5 stamps</span>
                  )}
                  {!c.loyalty && <span className="small">New</span>}
                </div>
              ))}
            </div>
          )}

          {tab === 'menu' && (
            <>
              <div className="panel" style={{ marginTop: 0 }}>
                <div className="panel-head">
                  <div className="panel-title">Flavours & stock</div>
                  <div className="small">Auto sold-out at 0</div>
                </div>
                {flavours.map(f => {
                  const s = stock[f.id]
                  const soldOut = s?.isOut || s?.qty === 0
                  return (
                    <div className="menu-row" key={f.id}>
                      <div className="menu-dot" style={{ background: `${f.hex}22` }}>
                        {f.emoji}
                      </div>
                      <div className="menu-name">
                        <strong>{f.name}</strong>
                        <span>{f.type === 'sweet' ? 'Sweet' : 'Savoury'} · {f.note}</span>
                      </div>
                      <input
                        className="qty-input"
                        type="number"
                        min={0}
                        value={s?.qty ?? 0}
                        onChange={e => onStockChange(f.id, parseInt(e.target.value, 10) || 0)}
                        aria-label={`${f.name} stock`}
                      />
                      <button
                        className={`switch${!soldOut ? ' on' : ''}`}
                        onClick={() => onToggleOut(f.id)}
                        aria-label={`Toggle ${f.name} availability`}
                        title={soldOut ? 'Mark in stock' : 'Mark sold out'}
                      />
                      <button
                        className={`switch${f.active ? ' on' : ''}`}
                        onClick={() => setFlavours(prev => prev.map(x => (x.id === f.id ? { ...x, active: !x.active } : x)))}
                        aria-label={`Toggle ${f.name} on menu`}
                        title={f.active ? 'Hide from menu' : 'Show on menu'}
                      />
                    </div>
                  )
                })}
              </div>

              <div className="panel">
                <div className="panel-head">
                  <div className="panel-title">Box sizes & prices</div>
                </div>
                {[
                  { name: 'Small Box', desc: '4 puffies · 2 flavours', prices: '£5 sweet · £6 combo · £7 savoury' },
                  { name: 'Large Box', desc: '8 puffies · 4 flavours', prices: '£9 sweet · £12 combo · £13 savoury' },
                ].map(b => (
                  <div className="menu-row" key={b.name}>
                    <div className="menu-name">
                      <strong>{b.name}</strong>
                      <span>{b.desc}</span>
                    </div>
                    <div className="small">{b.prices}</div>
                  </div>
                ))}
              </div>
            </>
          )}

          {tab === 'emails' && (
            <div className="panel" style={{ marginTop: 0 }}>
              <div className="panel-head">
                <div className="panel-title">Automated emails</div>
                <span className="pill online">
                  <span className="dot" /> Resend connected
                </span>
              </div>
              {Object.entries(EMAIL_TYPES).map(([id, t]) => (
                <div key={id} style={{ padding: '12px 0', borderBottom: '1px solid #f6f3ec' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div className="menu-name">
                      <strong>{t.title}</strong>
                      <span>{t.trigger} · sends {t.delayHours === 0 ? 'immediately' : `${t.delayHours}h later`}</span>
                    </div>
                    <button className="btn-ghost">Edit</button>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 6 }}>
                    <strong>Subject:</strong> {t.subject}
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === 'settings' && (
            <div className="panel" style={{ marginTop: 0 }}>
              <div className="panel-head">
                <div className="panel-title">Settings</div>
              </div>
              <div style={{ display: 'grid', gap: 14, maxWidth: 420 }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 16,
                    padding: '12px 14px',
                    background: 'var(--cream-2, #efe9db)',
                    borderRadius: 12,
                  }}
                >
                  <div>
                    <div className="field-label" style={{ marginBottom: 4 }}>
                      Use mock data
                    </div>
                    <div style={{ fontSize: 12, color: '#7a7468', lineHeight: 1.4 }}>
                      {supabaseConfigured
                        ? useMock
                          ? 'Wireframe data only — Supabase is paused in this browser.'
                          : 'Live Supabase data — turn on to demo without writing to the DB.'
                        : 'Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to enable live mode.'}
                    </div>
                  </div>
                  <button
                    type="button"
                    className={useMock ? 'btn-blue' : 'btn-ghost'}
                    disabled={!supabaseConfigured}
                    aria-pressed={useMock}
                    onClick={() => {
                      setUseMock(!useMock)
                      window.location.reload()
                    }}
                    style={{
                      flexShrink: 0,
                      minWidth: 72,
                      opacity: supabaseConfigured ? 1 : 0.5,
                      cursor: supabaseConfigured ? 'pointer' : 'not-allowed',
                    }}
                  >
                    {useMock ? 'On' : 'Off'}
                  </button>
                </div>
                <div>
                  <label className="field-label">Kiosk unpaid order expiry</label>
                  <select className="field-sm" defaultValue="10 minutes">
                    <option>5 minutes</option>
                    <option>10 minutes</option>
                    <option>15 minutes</option>
                  </select>
                </div>
                <div>
                  <label className="field-label">Pre-order auto-push</label>
                  <select className="field-sm" defaultValue="15 minutes before slot">
                    <option>10 minutes before slot</option>
                    <option>15 minutes before slot</option>
                    <option>20 minutes before slot</option>
                  </select>
                </div>
                <div>
                  <label className="field-label">Orders per pre-order slot</label>
                  <input className="field-sm" type="number" defaultValue={6} />
                </div>
                <div>
                  <label className="field-label">Popup dates</label>
                  <input className="field-sm" defaultValue="14 Nov – 14 Dec 2026" />
                </div>
                <button className="btn-blue">Save settings</button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
