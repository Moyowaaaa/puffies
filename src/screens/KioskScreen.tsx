import { useMemo, useState } from 'react'
import BoxBuilder, { BoxTags } from '../components/BoxBuilder'
import { BOX_SIZES, CUSTOMERS, FLAVOURS } from '../data/mock'
import { calcBoxPrice, maxFlavoursFor } from '../lib/pricing'
import type { Box, BoxSize, StockMap } from '../types'

const STEPS = ['1. Select size', '2. Choose flavours', '3. Review your order', '4. Checkout']

interface Props {
  stock: StockMap
  nextOrderId: number
  onPlaceOrder: (order: { id: number; name: string; email?: string; boxes: Box[]; total: number; note?: string }) => void
}

type Stage = 'attract' | 'size' | 'flavours' | 'review' | 'checkout' | 'done'

export default function KioskScreen({ stock, nextOrderId, onPlaceOrder }: Props) {
  const [stage, setStage] = useState<Stage>('attract')
  const [size, setSize] = useState<BoxSize>('small')
  const [slots, setSlots] = useState<Array<string | null>>([])
  const [sel, setSel] = useState(0)
  const [boxes, setBoxes] = useState<Box[]>([])
  const [editing, setEditing] = useState<number | null>(null)
  const [email, setEmail] = useState('')
  const [placed, setPlaced] = useState<number | null>(null)

  const stepIndex = stage === 'size' ? 0 : stage === 'flavours' ? 1 : stage === 'review' ? 2 : 3

  const boxPrice = useMemo(() => calcBoxPrice(size, slots, FLAVOURS), [size, slots])
  const filledCount = slots.filter(Boolean).length
  const slotCount = size === 'small' ? 4 : 8

  const customer = CUSTOMERS.find(c => c.email && c.email.toLowerCase() === email.trim().toLowerCase())
  const freeBoxOwed = Boolean(customer?.freeBoxOwed)
  const orderTotal = boxes.reduce((sum, b) => sum + (b.free ? 0 : b.price), 0)

  const resetAll = () => {
    setStage('attract')
    setSize('small')
    setSlots([])
    setSel(0)
    setBoxes([])
    setEditing(null)
    setEmail('')
    setPlaced(null)
  }

  const chooseSize = (id: BoxSize) => {
    setSize(id)
    setSlots(Array(id === 'small' ? 4 : 8).fill(null))
    setSel(0)
  }

  const pick = (flavourId: string) => {
    const next = [...slots]
    next[sel] = flavourId
    setSlots(next)
    const after = next.findIndex((x, i) => i > sel && !x)
    const any = next.findIndex(x => !x)
    setSel(after !== -1 ? after : any !== -1 ? any : sel)
  }

  const addBox = () => {
    const box: Box = { size, slots: [...slots], price: boxPrice }
    setBoxes(prev => {
      if (editing !== null) {
        const next = [...prev]
        next[editing] = box
        return next
      }
      return [...prev, box]
    })
    setEditing(null)
    setStage('review')
  }

  const editBox = (idx: number) => {
    const b = boxes[idx]
    setSize(b.size)
    setSlots([...b.slots])
    setSel(0)
    setEditing(idx)
    setStage('flavours')
  }

  const goAddAnother = () => {
    setEditing(null)
    setSize('small')
    setSlots([])
    setSel(0)
    setStage('size')
  }

  const placeOrder = () => {
    onPlaceOrder({
      id: nextOrderId,
      name: customer?.name.split(' ')[0] ?? 'Kiosk order',
      email: email.trim() || undefined,
      boxes,
      total: orderTotal,
    })
    setPlaced(nextOrderId)
    setStage('done')
  }

  if (stage === 'attract') {
    return (
      <div className="page">
        <div className="kiosk-attract" onClick={() => setStage('size')}>
          <div className="kiosk-logo">puffies</div>
          <div className="kiosk-tagline">doughnut&apos;s tastier cousin</div>
          <button className="kiosk-cta" onClick={() => setStage('size')}>
            Tap to order →
          </button>
          <div className="flavour-preview">
            {FLAVOURS.map(f => (
              <div className="fp-dot" key={f.id} style={{ background: f.hex }}>
                {f.emoji}
              </div>
            ))}
          </div>
          <div style={{ color: 'rgba(245,240,224,.4)', fontSize: 12 }}>9 flavours · build your own box</div>
        </div>
      </div>
    )
  }

  if (stage === 'done') {
    return (
      <div className="page">
        <div className="wrap" style={{ padding: '48px 16px', textAlign: 'center' }}>
          <div style={{ fontSize: 56, marginBottom: 8 }}>🍡</div>
          <div className="h1" style={{ fontSize: 26 }}>
            Order #{placed}
          </div>
          <div style={{ color: 'var(--fg2)', fontSize: 14, marginBottom: 24 }}>
            Please pay at the counter · Then collect your puffies
          </div>
          <div className="summary-card" style={{ textAlign: 'left', marginBottom: 24 }}>
            {boxes.map((b, i) => (
              <div key={i} style={{ marginBottom: i < boxes.length - 1 ? 12 : 0 }}>
                <div className="summary-title">
                  {b.size === 'small' ? 'Small Box' : 'Large Box'} · £{b.price}
                </div>
                <BoxTags slots={b.slots} flavours={FLAVOURS} />
              </div>
            ))}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                borderTop: '1px solid var(--line2)',
                marginTop: 12,
                paddingTop: 12,
                fontFamily: 'Poppins',
                fontWeight: 700,
              }}
            >
              <span>Total</span>
              <span>£{orderTotal}</span>
            </div>
          </div>
          <button
            style={{
              background: 'var(--blue)',
              color: 'var(--cream)',
              borderRadius: 14,
              padding: '14px 32px',
              fontFamily: 'Poppins',
              fontSize: 16,
              fontWeight: 700,
              width: '100%',
            }}
            onClick={resetAll}
          >
            Start new order
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="page" style={{ paddingBottom: 90 }}>
      <div className="steps-wrap">
        <div className="steps">
          {STEPS.map((label, i) => (
            <div key={label} className={`step${i < stepIndex ? ' done' : i === stepIndex ? ' active' : ''}`}>
              {label}
            </div>
          ))}
        </div>
      </div>

      {stage === 'size' && (
        <>
          <div className="wrap pad">
            <div className="h1">Choose your box</div>
            <div style={{ fontSize: 13, color: 'var(--fg2)' }}>How many puffies do you want?</div>
          </div>
          <div className="wrap box-sizes">
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
        </>
      )}

      {stage === 'flavours' && (
        <div className="wrap" style={{ padding: '0 16px' }}>
          <BoxBuilder
            size={size}
            slots={slots}
            selected={sel}
            flavours={FLAVOURS}
            stock={stock}
            mode="kiosk"
            onSelectSlot={setSel}
            onClearSlot={i => {
              setSlots(prev => prev.map((x, j) => (j === i ? null : x)))
              setSel(i)
            }}
            onPick={pick}
          />
        </div>
      )}

      {stage === 'review' && (
        <div className="wrap pad">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {boxes.map((b, i) => (
              <div className="summary-card" key={i}>
                <div className="summary-head">
                  <div>
                    <div className="summary-title">
                      {b.size === 'small' ? 'Small Box' : 'Large Box'}
                      {b.free && <span className="free-badge" style={{ marginLeft: 8 }}>Free</span>}
                    </div>
                    <div className="small">Up to {maxFlavoursFor(b.size)} flavours</div>
                  </div>
                  <div className="summary-price">£{b.free ? 0 : b.price}</div>
                </div>
                <BoxTags slots={b.slots} flavours={FLAVOURS} />
                <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                  <button className="btn-ghost" onClick={() => editBox(i)}>
                    Edit box
                  </button>
                  <button
                    className="btn-ghost"
                    onClick={() => setBoxes(prev => prev.filter((_, j) => j !== i))}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
            {freeBoxOwed && (
              <div className="loyalty-bar" style={{ margin: 0 }}>
                <div style={{ fontSize: 26 }}>🎁</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: 'Poppins', fontWeight: 700, fontSize: 14, color: 'var(--fg)' }}>
                    Free box earned!
                  </div>
                  <div className="small">Mention this at the counter to claim your free Small Box.</div>
                </div>
              </div>
            )}
          </div>
          <button className="add-another" onClick={goAddAnother}>
            + Add another box
          </button>

          <div style={{ marginTop: 20 }}>
            <label className="field-label" htmlFor="kiosk-email">
              Email for loyalty (optional)
            </label>
            <input
              id="kiosk-email"
              className="field"
              type="email"
              placeholder="you@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
            {customer && (
              <div className="loyalty-bar" style={{ margin: '12px 0 0' }}>
                <div className="stamps">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className={`stamp${customer.orders > i ? ' filled' : ''}`}>
                      {customer.orders > i ? '★' : ''}
                    </div>
                  ))}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: 'Poppins', fontWeight: 700, fontSize: 14 }}>{customer.name}</div>
                  <div className="small">
                    {customer.freeBoxOwed ? 'Free box owed 🎁' : `${customer.orders} of 5 stamps`}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {stage === 'checkout' && (
        <div className="wrap pad" style={{ textAlign: 'center', paddingTop: 48 }}>
          <div style={{ fontSize: 56, marginBottom: 12 }}>💳</div>
          <div className="h1" style={{ fontSize: 24 }}>
            Pay at the counter
          </div>
          <div style={{ color: 'var(--fg2)', fontSize: 14, marginBottom: 24 }}>
            Your order goes straight to the till — staff will take payment and send it to the kitchen.
          </div>
          <div className="summary-card" style={{ textAlign: 'left' }}>
            <div className="summary-head">
              <div className="summary-title">{boxes.length} box{boxes.length === 1 ? '' : 'es'}</div>
              <div className="summary-price">£{orderTotal}</div>
            </div>
            {boxes.map((b, i) => (
              <div key={i}>
                <BoxTags slots={b.slots} flavours={FLAVOURS} />
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bottom-bar">
        <div className="bottom-bar-inner">
          {stage === 'size' && (
            <>
              <div>
                <div className="bb-price">£{slots.length ? calcBoxPrice(size, slots, FLAVOURS) : 0}</div>
                <div className="bb-sub">{slots.length ? 'from — varies by mix' : 'Select a box to continue'}</div>
              </div>
              <div className="bar-actions">
                <button className="bb-back" onClick={resetAll}>
                  ← Back
                </button>
                <button className="bb-cta" disabled={!slots.length} onClick={() => setStage('flavours')}>
                  Next →
                </button>
              </div>
            </>
          )}
          {stage === 'flavours' && (
            <>
              <div>
                <div className="bb-price">£{boxPrice}</div>
                <div className="bb-sub">
                  {slotCount - filledCount > 0 ? `${slotCount - filledCount} more slot${slotCount - filledCount > 1 ? 's' : ''} to fill` : 'Box complete! ✓'}
                </div>
              </div>
              <div className="bar-actions">
                <button className="bb-back" onClick={() => (editing !== null ? setStage('review') : setStage('size'))}>
                  ← Back
                </button>
                <button className="bb-cta" disabled={filledCount !== slotCount} onClick={addBox}>
                  {editing !== null ? 'Save changes →' : 'Add to order →'}
                </button>
              </div>
            </>
          )}
          {stage === 'review' && (
            <>
              <div>
                <div className="bb-price">£{orderTotal}</div>
                <div className="bb-sub">{boxes.length} box{boxes.length === 1 ? '' : 'es'}</div>
              </div>
              <div className="bar-actions">
                <button className="bb-back" onClick={resetAll}>
                  ← Back
                </button>
                <button className="bb-cta" disabled={!boxes.length} onClick={() => setStage('checkout')}>
                  Place order →
                </button>
              </div>
            </>
          )}
          {stage === 'checkout' && (
            <>
              <div>
                <div className="bb-price">£{orderTotal}</div>
                <div className="bb-sub">{boxes.length} box{boxes.length === 1 ? '' : 'es'}</div>
              </div>
              <div className="bar-actions">
                <button className="bb-back" onClick={() => setStage('review')}>
                  ← Back
                </button>
                <button className="bb-cta" onClick={placeOrder}>
                  Place order ✓
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
