import { useMemo, useState } from 'react'
import BoxBuilder, { BoxTags } from '../components/BoxBuilder'
import { BOX_SIZES, FLAVOURS, TIME_SLOTS } from '../data/mock'
import { boxTypeLabel, calcBoxPrice } from '../lib/pricing'
import type { Box, BoxSize, Order, OrderStatus, StockMap } from '../types'

interface Props {
  orders: Order[]
  stock: StockMap
  nextOrderId: number
  noNav: boolean
  onSetStatus: (id: number, status: OrderStatus) => void
  onAddOrder: (order: Omit<Order, 'placedAt'>) => void
  onEditPending: (id: number) => void
}

const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.max(0, s % 60)).padStart(2, '0')}`

function QueueCard({ order, onSetStatus, onEditPending }: {
  order: Order
  onSetStatus: (id: number, status: OrderStatus) => void
  onEditPending: (id: number) => void
}) {
  const low = order.status === 'pending' && (order.secondsLeft ?? 0) < 120
  return (
    <div className={`queue-card${low ? ' urgent' : ''}`}>
      <div className="qc-top">
        <div style={{ minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
            <span className="qc-num">#{order.id}</span>
            {order.freeBox && <span className="free-badge">🎁 Free box</span>}
            <span className="qc-name">{order.name}</span>
          </div>
          {order.boxes.map((b, i) => (
            <div key={i}>
              {order.boxes.length > 1 && (
                <div className="label" style={{ fontSize: 10, marginTop: 6 }}>
                  Box {i + 1} · {boxTypeLabel(b.size, b.slots, FLAVOURS)}
                </div>
              )}
              {order.boxes.length === 1 && <div className="qc-type">{boxTypeLabel(b.size, b.slots, FLAVOURS)}</div>}
              <BoxTags slots={b.slots} flavours={FLAVOURS} />
            </div>
          ))}
          {order.note && <div className="qc-note">📝 {order.note}</div>}
        </div>
        <div style={{ flexShrink: 0 }}>
          {order.status === 'pending' && (
            <>
              <div className={`qc-timer${low ? ' low' : ''}`}>{fmt(order.secondsLeft ?? 0)}</div>
              {low && <div className="qc-timer-note" style={{ color: 'var(--danger)' }}>EXPIRING</div>}
            </>
          )}
          {order.status === 'in_queue' && <div className="qc-timer">{order.placedAt}</div>}
          {order.status === 'ready' && (
            <div className="qc-timer" style={{ color: 'var(--ok)' }}>
              Ready
            </div>
          )}
          {order.boxes.length > 1 && order.status !== 'pending' && (
            <div className="qc-timer-note">{order.boxes.length} boxes</div>
          )}
        </div>
      </div>
      <div className="qc-actions">
        {order.status === 'pending' && (
          <>
            <button className="btn-primary" onClick={() => onSetStatus(order.id, 'in_queue')}>
              Confirm payment · £{order.total}
            </button>
            <button className="btn-blue" onClick={() => onEditPending(order.id)}>
              Edit
            </button>
            <button className="btn-ghost">+10m</button>
          </>
        )}
        {order.status === 'in_queue' && (
          <button className="btn-green" onClick={() => onSetStatus(order.id, 'ready')}>
            Mark ready
          </button>
        )}
        {order.status === 'ready' && (
          <button className="btn-blue" style={{ flex: 1 }} onClick={() => onSetStatus(order.id, 'collected')}>
            Mark collected
          </button>
        )}
      </div>
    </div>
  )
}

type Tab = 'queue' | 'neworder'
type NewStep = 'mode' | 'size' | 'flavours' | 'customer' | 'done'

export default function TillScreen({ orders, stock, nextOrderId, noNav, onSetStatus, onAddOrder, onEditPending }: Props) {
  const [tab, setTab] = useState<Tab>('queue')
  const [query, setQuery] = useState('')

  // new-order state
  const [step, setStep] = useState<NewStep>('mode')
  const [source, setSource] = useState<'walkin' | 'preorder'>('walkin')
  const [slot, setSlot] = useState(TIME_SLOTS[6].time)
  const [size, setSize] = useState<BoxSize>('small')
  const [slots, setSlots] = useState<Array<string | null>>([])
  const [sel, setSel] = useState(0)
  const [boxes, setBoxes] = useState<Box[]>([])
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [note, setNote] = useState('')
  const [placed, setPlaced] = useState<number | null>(null)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return orders
    return orders.filter(o => o.name.toLowerCase().includes(q) || String(o.id).includes(q))
  }, [orders, query])

  const col = (status: OrderStatus) => filtered.filter(o => o.status === status)
  const pending = col('pending')
  const inQueue = col('in_queue')
  const ready = col('ready')

  const filled = slots.filter(Boolean).length
  const slotCount = size === 'small' ? 4 : 8
  const boxPrice = size ? calcBoxPrice(size, slots, FLAVOURS) : 0
  const orderTotal = boxes.reduce((s, b) => s + b.price, 0)

  const chooseSize = (s: BoxSize) => {
    setSize(s)
    setSlots(Array(s === 'small' ? 4 : 8).fill(null))
    setSel(0)
  }

  const pick = (id: string) => {
    const next = [...slots]
    next[sel] = id
    setSlots(next)
    const after = next.findIndex((x, i) => i > sel && !x)
    const any = next.findIndex(x => !x)
    setSel(after !== -1 ? after : any !== -1 ? any : sel)
  }

  const resetNewOrder = () => {
    setStep('mode')
    setSource('walkin')
    setSize('small')
    setSlots([])
    setBoxes([])
    setName('')
    setEmail('')
    setNote('')
    setPlaced(null)
  }

  const confirmOrder = () => {
    onAddOrder({
      id: nextOrderId,
      name: name.trim() || 'Walk-in',
      email: email.trim() || undefined,
      source: source === 'preorder' ? 'preorder' : 'till',
      status: source === 'preorder' ? 'pending' : 'in_queue',
      total: orderTotal,
      boxes,
      note: note.trim() || undefined,
      slot: source === 'preorder' ? slot : undefined,
    })
    setPlaced(nextOrderId)
    setStep('done')
  }

  return (
    <div className={`till${noNav ? ' no-nav' : ''}`}>
      <div className="till-toolbar">
        <div className="till-brand">puffies</div>
        <button className={`till-tab${tab === 'queue' ? ' active' : ''}`} onClick={() => setTab('queue')}>
          Live queue
        </button>
        <button
          className={`till-tab${tab === 'neworder' ? ' active' : ''}`}
          onClick={() => {
            setTab('neworder')
            if (step === 'done') resetNewOrder()
          }}
        >
          + New order
        </button>
        <div className="spacer" />
        <div className="till-search">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
            <circle cx="6" cy="6" r="4.5" stroke="#9a9488" strokeWidth="1.5" />
            <line x1="9.5" y1="9.5" x2="12.5" y2="12.5" stroke="#9a9488" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <input
            placeholder="Search orders…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            aria-label="Search orders"
          />
        </div>
      </div>

      {tab === 'queue' ? (
        <div className="till-pane">
          <div className="queue-col">
            <div className="queue-col-head">
              Awaiting payment
              <span className="count-badge red">{pending.length}</span>
            </div>
            <div className="queue-list">
              {pending.length === 0 && <div className="empty-col">No orders awaiting payment</div>}
              {pending.map(o => (
                <QueueCard key={o.id} order={o} onSetStatus={onSetStatus} onEditPending={onEditPending} />
              ))}
            </div>
          </div>

          <div className="queue-col">
            <div className="queue-col-head">
              In queue
              <span className="count-badge amber">{inQueue.length}</span>
            </div>
            <div className="queue-list">
              {inQueue.length === 0 && <div className="empty-col">Kitchen is clear</div>}
              {inQueue.map(o => (
                <QueueCard key={o.id} order={o} onSetStatus={onSetStatus} onEditPending={onEditPending} />
              ))}
            </div>
          </div>

          <div className="queue-col">
            <div className="queue-col-head">
              Ready to collect
              <span className="count-badge green">{ready.length}</span>
            </div>
            <div className="queue-list">
              {ready.length === 0 && <div className="empty-col">Nothing ready yet</div>}
              {ready.map(o => (
                <QueueCard key={o.id} order={o} onSetStatus={onSetStatus} onEditPending={onEditPending} />
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="neworder">
          <div className="steps-wrap">
            <div className="steps">
              {['1. Order type', '2. Box size', '3. Flavours', '4. Customer', '5. Confirm'].map((l, i) => (
                <div
                  key={l}
                  className={`step${i < ['mode', 'size', 'flavours', 'customer', 'done'].indexOf(step) ? ' done' : i === ['mode', 'size', 'flavours', 'customer', 'done'].indexOf(step) ? ' active' : ''}`}
                >
                  {l}
                </div>
              ))}
            </div>
          </div>

          <div className="content">
            {step === 'mode' && (
              <div>
                <div className="h1" style={{ marginBottom: 12 }}>
                  Order type
                </div>
                <div className="toggle-row">
                  <button
                    className={`toggle-btn${source === 'walkin' ? ' active' : ''}`}
                    onClick={() => setSource('walkin')}
                  >
                    🚶 Walk-in
                  </button>
                  <button
                    className={`toggle-btn${source === 'preorder' ? ' active' : ''}`}
                    onClick={() => setSource('preorder')}
                  >
                    ⏰ Pre-order
                  </button>
                </div>
                {source === 'preorder' && (
                  <div style={{ marginTop: 16 }}>
                    <label className="field-label">Pickup slot</label>
                    <select className="field-sm" value={slot} onChange={e => setSlot(e.target.value)}>
                      {TIME_SLOTS.map(s => (
                        <option key={s.time} value={s.time}>
                          {s.time}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            )}

            {step === 'size' && (
              <div>
                <div className="h1" style={{ marginBottom: 12 }}>
                  Box size
                </div>
                <div className="box-sizes" style={{ padding: 0 }}>
                  {BOX_SIZES.map(b => (
                    <button
                      key={b.id}
                      className={`box-opt${size === b.id && slots.length ? ' selected' : ''}`}
                      onClick={() => chooseSize(b.id)}
                    >
                      <div className="box-opt-emoji">{b.emoji}</div>
                      <div className="box-opt-name">{b.name}</div>
                      <div className="box-opt-desc">{b.desc}</div>
                      <div className="box-opt-price">from £{b.priceFrom}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {step === 'flavours' && (
              <BoxBuilder
                size={size}
                slots={slots}
                selected={sel}
                flavours={FLAVOURS}
                stock={stock}
                mode="till"
                onSelectSlot={setSel}
                onClearSlot={i => {
                  setSlots(prev => prev.map((x, j) => (j === i ? null : x)))
                  setSel(i)
                }}
                onPick={pick}
              />
            )}

            {step === 'customer' && (
              <div>
                <div className="h1" style={{ marginBottom: 12 }}>
                  Customer details
                </div>
                <label className="field-label" htmlFor="till-name">
                  Name
                </label>
                <input
                  id="till-name"
                  className="field"
                  placeholder="Customer name"
                  value={name}
                  onChange={e => setName(e.target.value)}
                />
                <div style={{ height: 12 }} />
                <label className="field-label" htmlFor="till-email">
                  Email (optional · loyalty)
                </label>
                <input
                  id="till-email"
                  className="field"
                  type="email"
                  placeholder="you@email.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                />
                <div style={{ height: 12 }} />
                <label className="field-label" htmlFor="till-note">
                  Notes (optional)
                </label>
                <input
                  id="till-note"
                  className="field"
                  placeholder="Allergies, extra sauce…"
                  value={note}
                  onChange={e => setNote(e.target.value)}
                />
              </div>
            )}

            {step === 'done' && (
              <div style={{ textAlign: 'center', paddingTop: 24 }}>
                <div style={{ fontSize: 48, marginBottom: 8 }}>✅</div>
                <div className="h1">Order #{placed} placed</div>
                <div style={{ color: 'var(--fg2)', fontSize: 13, marginBottom: 20 }}>
                  {source === 'preorder' ? `Pre-order for ${slot} — auto-pushes 15 min before the slot.` : 'Sent to the kitchen queue.'}
                </div>
                <button className="btn-blue" style={{ width: '100%' }} onClick={resetNewOrder}>
                  New order
                </button>
              </div>
            )}
          </div>

          {step !== 'done' && (
            <div className="bottom-bar">
              <div className="bottom-bar-inner">
                <div>
                  <div className="bb-price">£{step === 'size' || step === 'mode' ? orderTotal : orderTotal + boxPrice}</div>
                  <div className="bb-sub">
                    {step === 'flavours'
                      ? filled === slotCount
                        ? 'Box complete ✓'
                        : `${slotCount - filled} more slot${slotCount - filled > 1 ? 's' : ''} to fill`
                      : `${boxes.length} box${boxes.length === 1 ? '' : 'es'}`}
                  </div>
                </div>
                <div className="bar-actions">
                  <button
                    className="bb-back"
                    onClick={() => {
                      if (step === 'mode') resetNewOrder()
                      else if (step === 'size') setStep('mode')
                      else if (step === 'flavours') setStep('size')
                      else if (step === 'customer') setStep('flavours')
                    }}
                  >
                    ← Back
                  </button>
                  {step === 'mode' && (
                    <button className="bb-cta" onClick={() => setStep('size')}>
                      Next →
                    </button>
                  )}
                  {step === 'size' && (
                    <button className="bb-cta" disabled={!slots.length} onClick={() => setStep('flavours')}>
                      Next →
                    </button>
                  )}
                  {step === 'flavours' && (
                    <button
                      className="bb-cta"
                      disabled={filled !== slotCount}
                      onClick={() => {
                        setBoxes(prev => [...prev, { size, slots: [...slots], price: boxPrice }])
                        setStep('customer')
                        setSlots(Array(size === 'small' ? 4 : 8).fill(null))
                        setSel(0)
                      }}
                    >
                      Add box →
                    </button>
                  )}
                  {step === 'customer' && (
                    <button className="bb-cta" disabled={boxes.length === 0} onClick={confirmOrder}>
                      Confirm order · £{orderTotal}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
