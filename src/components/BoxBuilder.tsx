import type { ReactNode } from 'react'
import type { BoxSize, Flavour, StockMap } from '../types'
import { canPickFlavour, maxFlavoursFor, summariseBox } from '../lib/pricing'

interface Props {
  size: BoxSize
  slots: Array<string | null>
  selected: number
  flavours: Flavour[]
  stock: StockMap
  /** kiosk hides stock numbers, till shows them */
  mode: 'kiosk' | 'till' | 'pre'
  onSelectSlot: (index: number) => void
  onClearSlot: (index: number) => void
  onPick: (flavourId: string) => void
  showBanner?: boolean
}

export default function BoxBuilder({
  size,
  slots,
  selected,
  flavours,
  stock,
  mode,
  onSelectSlot,
  onClearSlot,
  onPick,
  showBanner = true,
}: Props) {
  const slotCount = size === 'small' ? 4 : 8
  const filled = slots.filter(Boolean) as string[]
  const maxFlavours = maxFlavoursFor(size)
  const unique = new Set(filled)
  const slotsLeft = slotCount - filled.length

  const byId = new Map(flavours.map(f => [f.id, f]))
  const sweetSlots = filled.filter(id => byId.get(id)?.type === 'sweet').length
  const savSlots = filled.filter(id => byId.get(id)?.type === 'savoury').length
  const isCombo = sweetSlots > 0 && savSlots > 0

  const isSoldOut = (id: string) => stock[id]?.isOut || stock[id]?.qty === 0

  const renderCard = (f: Flavour) => {
    const count = slots.filter(x => x === f.id).length
    const inBox = count > 0
    const blocked = !inBox && !canPickFlavour(size, slots, flavours, f.id)
    const soldOut = isSoldOut(f.id)
    const stockQty = stock[f.id]?.qty ?? 0
    const lowStock = !soldOut && stockQty > 0 && stockQty <= 5

    const sub: ReactNode = soldOut ? (
      <span style={{ color: '#ef4444', fontWeight: 700, fontSize: 11 }}>SOLD OUT</span>
    ) : mode === 'kiosk' ? (
      <span>{f.note}</span>
    ) : lowStock ? (
      <span style={{ color: '#f59e0b', fontWeight: 700, fontSize: 11 }}>Only {stockQty} left</span>
    ) : (
      <span>{mode === 'pre' ? f.note : `${stockQty} left`}</span>
    )

    return (
      <button
        key={f.id}
        type="button"
        className={`f-card${inBox ? ' selected' : ''}${soldOut ? ' sold-out' : ''}${blocked ? ' greyed' : ''}`}
        style={{ borderColor: inBox ? f.hex : undefined }}
        disabled={soldOut || blocked}
        onClick={() => onPick(f.id)}
        aria-label={`${f.name}${inBox ? `, ${count} in box` : ''}`}
      >
        <div className="f-card-swatch" style={{ background: `${f.hex}20` }}>
          <span>{f.emoji}</span>
          {inBox && (
            <div className="f-card-qty" style={{ color: f.hex }}>
              ×{count}
            </div>
          )}
        </div>
        <div className="f-card-body">
          <div className="f-card-name">{f.name}</div>
          {sub && <div className="f-card-note">{sub}</div>}
        </div>
        {soldOut && <div className="f-sold-label">Sold out</div>}
      </button>
    )
  }

  return (
    <div>
      {showBanner && (
        <div className={`status-banner${slotsLeft === 0 ? ' full' : ''}`}>
          {slotsLeft === 0 ? (
            <>
              <div style={{ fontSize: 30, lineHeight: 1 }}>🎉</div>
              <div>
                <div style={{ fontFamily: 'Poppins', fontSize: 17, fontWeight: 700, color: '#fff' }}>Box full!</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,.8)', marginTop: 4 }}>
                  Tap any slot to swap a flavour.
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="stat">
                <div className="stat-num">{slotsLeft}</div>
                <div className="stat-label">{slotsLeft === 1 ? 'puffy' : 'puffies'} left</div>
              </div>
              <div className="divider-v" />
              <div className="stat">
                <div className="stat-num">{maxFlavours - unique.size}</div>
                <div className="stat-label">flavour{maxFlavours - unique.size === 1 ? '' : 's'} left</div>
              </div>
              <div className="divider-v" />
              <div style={{ paddingLeft: 18 }}>
                <div style={{ fontFamily: 'Poppins', fontSize: 13, fontWeight: 500, color: 'var(--blue)' }}>
                  Up to <strong>{maxFlavours} flavours</strong>
                </div>
                <div style={{ fontSize: 12, color: 'var(--fg2)', marginTop: 3 }}>
                  {isCombo ? 'Combo box · half sweet, half savoury' : 'Sweet, savoury or mix it up.'}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      <div className="bb-label">Your box — tap a flavour to fill each slot</div>
      <div className="bb-slots" style={{ gridTemplateColumns: `repeat(${slotCount}, minmax(0, 1fr))` }}>
        {slots.map((slotId, i) => {
          const f = slotId ? byId.get(slotId) : undefined
          const active = selected === i
          if (f) {
            return (
              <div
                key={i}
                className={`bb-slot filled${active ? ' active' : ''}`}
                style={{ borderColor: f.hex }}
                onClick={() => onSelectSlot(i)}
                role="button"
                tabIndex={0}
              >
                <span style={{ fontSize: 22 }}>{f.emoji}</span>
                <div className="bb-slot-name" style={{ color: f.hex }}>
                  {f.name.split(' ')[0]}
                </div>
                <button
                  className="bb-remove"
                  onClick={e => {
                    e.stopPropagation()
                    onClearSlot(i)
                  }}
                  aria-label={`Remove ${f.name} from slot ${i + 1}`}
                >
                  ×
                </button>
              </div>
            )
          }
          return (
            <div
              key={i}
              className={`bb-slot${active ? ' active' : ''}`}
              onClick={() => onSelectSlot(i)}
              role="button"
              tabIndex={0}
            >
              <span className="bb-slot-empty">+</span>
            </div>
          )
        })}
      </div>
      <div style={{ fontSize: 11, color: 'var(--fg2)', marginBottom: 14 }}>
        Tap the same flavour multiple times to add more · tap × on a slot to remove
      </div>

      <div className="label" style={{ marginBottom: 10 }}>
        Pick your flavours
      </div>
      <div className="flavour-grid">
        <div className="flavour-section">🍰 Sweet</div>
        {flavours.filter(f => f.type === 'sweet').map(renderCard)}
        <div className="flavour-section divide">🥩 Savoury</div>
        {flavours.filter(f => f.type === 'savoury').map(renderCard)}
      </div>
    </div>
  )
}

export function BoxTags({ slots, flavours }: { slots: Array<string | null>; flavours: Flavour[] }) {
  const byId = new Map(flavours.map(f => [f.id, f]))
  return (
    <div className="tag-row">
      {summariseBox(slots).map(({ id, qty }) => {
        const f = byId.get(id)
        if (!f) return null
        return (
          <span className="order-tag" key={id}>
            <span className="qty">×{qty}</span>
            {f.name}
          </span>
        )
      })}
    </div>
  )
}
