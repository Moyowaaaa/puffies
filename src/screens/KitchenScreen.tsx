import { useMemo, useState } from 'react'
import { BoxTags } from '../components/BoxBuilder'
import { FLAVOURS } from '../data/mock'
import { boxTypeLabel } from '../lib/pricing'
import type { Order, OrderStatus } from '../types'

interface Props {
  orders: Order[]
  onSetStatus: (id: number, status: OrderStatus) => void
}

export default function KitchenScreen({ orders, onSetStatus }: Props) {
  const [query, setQuery] = useState('')
  const [mode, setMode] = useState<'all' | 'in_progress' | 'ready'>('all')

  const tickets = useMemo(() => {
    const active = orders.filter(o => o.status === 'in_queue' || o.status === 'ready')
    const q = query.trim().toLowerCase()
    const searched = q ? active.filter(o => o.name.toLowerCase().includes(q) || String(o.id).includes(q)) : active
    if (mode === 'ready') return searched.filter(o => o.status === 'ready')
    if (mode === 'in_progress') return searched.filter(o => o.status === 'in_queue')
    return searched
  }, [orders, query, mode])

  const count = (s: OrderStatus) => orders.filter(o => o.status === s).length

  return (
    <div className="page">
      <div className="kitchen-head">
        <div>
          <div className="kitchen-title">Kitchen</div>
          <div style={{ fontSize: 11, color: 'rgba(245,240,224,.55)', letterSpacing: '.05em', textTransform: 'uppercase' }}>
            Live tickets
          </div>
        </div>
        <div className="kitchen-counts">
          <div className="kcount">
            <div className="kcount-num amber">{count('in_queue')}</div>
            <div className="kcount-label">In progress</div>
          </div>
          <div className="kcount">
            <div className="kcount-num green">{count('ready')}</div>
            <div className="kcount-label">Ready</div>
          </div>
        </div>
      </div>

      <div className="wrap">
        <input
          className="search-bar"
          placeholder="Search order number or name…"
          value={query}
          onChange={e => setQuery(e.target.value)}
          aria-label="Search tickets"
        />
        <div style={{ display: 'flex', gap: 6, padding: '12px 16px 0' }}>
          {(['all', 'in_progress', 'ready'] as const).map(m => (
            <button
              key={m}
              className={`toggle-btn${mode === m ? ' active' : ''}`}
              style={{ flex: 1, padding: 8, fontSize: 12 }}
              onClick={() => setMode(m)}
            >
              {m === 'all' ? 'All tickets' : m === 'in_progress' ? 'In progress' : 'Ready'}
            </button>
          ))}
        </div>

        <div className="order-cards">
          {tickets.length === 0 && <div className="empty-col">No tickets</div>}
          {tickets.map(o => (
            <div
              key={o.id}
              className={`order-card${o.status === 'ready' ? ' ready' : ''}${o.source === 'preorder' ? ' preorder' : ''}`}
            >
              <div className="oc-head">
                <div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                    <span className="oc-num">#{o.id}</span>
                    <span className="oc-name">{o.name}</span>
                  </div>
                  <div className="oc-meta">
                    {o.source === 'preorder' ? `⏰ Pre-order · ${o.slot} slot` : o.source === 'kiosk' ? 'Kiosk' : 'Walk-in'} ·{' '}
                    {o.placedAt}
                  </div>
                </div>
                <div className={`oc-time ${o.status === 'ready' ? 'ready' : o.source === 'preorder' ? 'preorder' : 'new'}`}>
                  {o.status === 'ready' ? 'READY' : o.boxes.length > 1 ? `${o.boxes.length} boxes` : '1 box'}
                </div>
              </div>

              {o.boxes.map((b, i) => (
                <div key={i} style={{ marginBottom: 10 }}>
                  <div className="label" style={{ fontSize: 10, marginBottom: 2 }}>
                    {o.boxes.length > 1 ? `Box ${i + 1} · ` : ''}
                    {boxTypeLabel(b.size, b.slots, FLAVOURS)}
                  </div>
                  <BoxTags slots={b.slots} flavours={FLAVOURS} />
                </div>
              ))}

              {o.note && (
                <div
                  style={{
                    background: '#fffbeb',
                    border: '1px solid #fde68a',
                    borderRadius: 8,
                    padding: '8px 10px',
                    marginBottom: 12,
                    fontSize: 12,
                    color: '#92400e',
                    fontWeight: 600,
                  }}
                >
                  📝 {o.note}
                </div>
              )}

              <div className="oc-actions">
                {o.status === 'in_queue' ? (
                  <button className="btn-green" onClick={() => onSetStatus(o.id, 'ready')}>
                    Mark ready ✓
                  </button>
                ) : (
                  <button className="btn-blue" style={{ flex: 1 }} onClick={() => onSetStatus(o.id, 'collected')}>
                    Collected
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
