import { useState } from 'react'
import BoxBuilder, { BoxTags } from '../components/BoxBuilder'
import { BOX_SIZES, FLAVOURS, TIME_SLOTS } from '../data/mock'
import { calcBoxPrice } from '../lib/pricing'
import type { Box, BoxSize, StockMap } from '../types'

const STEPS = ['1. Date', '2. Time slot', '3. Box size', '4. Flavours', '5. Confirm']
const DATES = ['Today', 'Tomorrow', 'Sat 29 Nov']

interface Props {
  stock: StockMap
  nextOrderId: number
  onPlacePreorder: (order: { id: number; name: string; email?: string; boxes: Box[]; total: number; slot: string; pickupDate: string }) => void
}

export default function PreOrderScreen({ stock, nextOrderId, onPlacePreorder }: Props) {
  const [step, setStep] = useState(0)
  const [date, setDate] = useState(DATES[0])
  const [slot, setSlot] = useState<string | null>(null)
  const [size, setSize] = useState<BoxSize>('small')
  const [slots, setSlots] = useState<Array<string | null>>([])
  const [sel, setSel] = useState(0)
  const [boxes, setBoxes] = useState<Box[]>([])
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [placed, setPlaced] = useState<number | null>(null)

  const slotCount = size === 'small' ? 4 : 8
  const filled = slots.filter(Boolean).length
  const boxPrice = calcBoxPrice(size, slots, FLAVOURS)
  const total = boxes.reduce((s, b) => s + b.price, 0)

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

  const submit = () => {
    if (!slot) return
    onPlacePreorder({
      id: nextOrderId,
      name: name.trim() || 'Pre-order',
      email: email.trim() || undefined,
      boxes,
      total,
      slot,
      pickupDate: date,
    })
    setPlaced(nextOrderId)
    setStep(5)
  }

  const reset = () => {
    setStep(0)
    setDate(DATES[0])
    setSlot(null)
    setSize('small')
    setSlots([])
    setBoxes([])
    setName('')
    setEmail('')
    setPlaced(null)
  }

  return (
    <div className="page">
      <div className="site-hero">
        <div style={{ fontSize: 44, marginBottom: 6 }}>🍡</div>
        <h2>Pre-order Puffies</h2>
        <p>Pick a collection slot · ready when you are</p>
      </div>

      <div className="steps-wrap">
        <div className="steps">
          {STEPS.map((l, i) => (
            <div key={l} className={`step${i < step ? ' done' : i === step ? ' active' : ''}`}>
              {l}
            </div>
          ))}
        </div>
      </div>

      <div className="wrap" style={{ padding: '16px 0 120px' }}>
        {step === 0 && (
          <>
            <div className="label" style={{ padding: '0 16px 8px' }}>
              Collection date
            </div>
            <div className="date-row">
              {DATES.map(d => (
                <button key={d} className={`ts${date === d ? ' selected' : ''}`} onClick={() => setDate(d)}>
                  <div className="ts-time">{d}</div>
                  <div className="ts-spots">11am–5:30pm</div>
                </button>
              ))}
            </div>
          </>
        )}

        {step === 1 && (
          <>
            <div className="label" style={{ padding: '0 16px 8px' }}>
              Time slot · {date}
            </div>
            <div className="time-slots">
              {TIME_SLOTS.map(s => (
                <button
                  key={s.time}
                  className={`ts${slot === s.time ? ' selected' : ''}${s.spotsLeft === 0 ? ' full' : ''}`}
                  onClick={() => setSlot(s.time)}
                >
                  <div className="ts-time">{s.time}</div>
                  <div className="ts-spots">{s.spotsLeft === 0 ? 'Full' : `${s.spotsLeft} left`}</div>
                </button>
              ))}
            </div>
            <div style={{ fontSize: 12, color: 'var(--fg2)', padding: '10px 16px' }}>
              Slots from 11:00am – 6:00pm · 30-min windows
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <div className="h1" style={{ padding: '0 16px 12px' }}>
              Box size
            </div>
            <div className="box-sizes">
              {BOX_SIZES.map(b => (
                <button
                  key={b.id}
                  className={`box-opt${size === b.id ? ' selected' : ''}`}
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

        {step === 3 && (
          <div style={{ padding: '0 16px' }}>
            <BoxBuilder
              size={size}
              slots={slots}
              selected={sel}
              flavours={FLAVOURS}
              stock={stock}
              mode="pre"
              onSelectSlot={setSel}
              onClearSlot={i => {
                setSlots(prev => prev.map((x, j) => (j === i ? null : x)))
                setSel(i)
              }}
              onPick={pick}
            />
          </div>
        )}

        {step === 4 && (
          <div style={{ padding: '0 16px' }}>
            <div className="summary-card">
              <div className="summary-head">
                <div>
                  <div className="summary-title">
                    {boxes.length} box{boxes.length === 1 ? '' : 'es'}
                  </div>
                  <div className="small">
                    {date} · {slot}
                  </div>
                </div>
                <div className="summary-price">£{total}</div>
              </div>
              {boxes.map((b, i) => (
                <div key={i} style={{ marginBottom: 10 }}>
                  <div className="label" style={{ fontSize: 10, marginBottom: 4 }}>
                    Box {i + 1} · {b.size === 'small' ? 'Small' : 'Large'} · £{b.price}
                  </div>
                  <BoxTags slots={b.slots} flavours={FLAVOURS} />
                </div>
              ))}
            </div>

            <div style={{ marginTop: 16 }}>
              <label className="field-label" htmlFor="pre-name">
                Name
              </label>
              <input
                id="pre-name"
                className="field"
                placeholder="Your name"
                value={name}
                onChange={e => setName(e.target.value)}
              />
              <div style={{ height: 12 }} />
              <label className="field-label" htmlFor="pre-email">
                Email (for confirmation + loyalty)
              </label>
              <input
                id="pre-email"
                className="field"
                type="email"
                placeholder="you@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>
          </div>
        )}

        {step === 5 && (
          <div style={{ padding: '40px 16px', textAlign: 'center' }}>
            <div style={{ fontSize: 56, marginBottom: 8 }}>🎉</div>
            <div className="h1" style={{ fontSize: 24 }}>
              Pre-order #{placed} confirmed
            </div>
            <div style={{ color: 'var(--fg2)', fontSize: 14, margin: '8px 0 24px' }}>
              {date} · {slot} · £{total}
              <br />
              It auto-pushes to the kitchen 15 minutes before your slot.
            </div>
            <button className="btn-blue" style={{ width: '100%' }} onClick={reset}>
              Order again
            </button>
          </div>
        )}
      </div>

      {step < 5 && (
        <div className="bottom-bar">
          <div className="bottom-bar-inner">
            <div>
              <div className="bb-price">£{step === 3 ? total + boxPrice : total}</div>
              {/* step 3 includes the box being built */}
              <div className="bb-sub">
                {step === 1 ? (slot ?? 'Choose a slot') : step === 3 ? `${slotCount - filled} more slot${slotCount - filled === 1 ? '' : 's'}` : 'Pre-order'}
              </div>
            </div>
            <div className="bar-actions">
              {step > 0 && (
                <button className="bb-back" onClick={() => setStep(s => s - 1)}>
                  ← Back
                </button>
              )}
              {step < 3 && (
                <button
                  className="bb-cta"
                  disabled={step === 1 && !slot}
                  onClick={() => {
                    setStep(s => s + 1)
                  }}
                >
                  Next →
                </button>
              )}
              {step === 3 && (
                <button
                  className="bb-cta"
                  disabled={filled !== slotCount}
                  onClick={() => {
                    setBoxes(prev => [...prev, { size, slots: [...slots], price: boxPrice }])
                    setSlots([])
                    setStep(4)
                  }}
                >
                  Continue →
                </button>
              )}
              {step === 4 && (
                <button className="bb-cta" disabled={boxes.length === 0 || !email.trim()} onClick={submit}>
                  Confirm · £{total}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
