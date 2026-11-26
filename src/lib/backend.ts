import { supabase } from './supabase'
import type { Box, BoxSize, Order, OrderSource, OrderStatus, StockMap } from '../types'

interface SlotRow {
  slot_index: number
  flavour_id: string
}

interface BoxRow {
  id: string
  box_size_id: string
  price_gbp: number | string
  order_box_slots: SlotRow[] | null
}

interface OrderRow {
  id: number
  source: string
  customer_name: string | null
  customer_email: string | null
  status: string
  total_gbp: number | string
  note: string | null
  pickup_slot: string | null
  expires_at: string | null
  created_at: string
  order_boxes: BoxRow[] | null
}

const money = (n: number | string) => Number(n)

function toOrder(row: OrderRow): Order {
  const boxes: Box[] = (row.order_boxes ?? []).map(b => {
    const size: BoxSize = b.box_size_id === 'large' ? 'large' : 'small'
    const slots: Array<string | null> = Array(size === 'small' ? 4 : 8).fill(null)
    for (const slot of b.order_box_slots ?? []) {
      if (slot.slot_index < slots.length) slots[slot.slot_index] = slot.flavour_id
    }
    return { size, slots, price: money(b.price_gbp) }
  })

  return {
    id: row.id,
    name: row.customer_name ?? 'Walk-in',
    email: row.customer_email ?? undefined,
    source: row.source as OrderSource,
    status: row.status as OrderStatus,
    total: money(row.total_gbp),
    boxes,
    note: row.note ?? undefined,
    slot: row.pickup_slot ?? undefined,
    placedAt: new Date(row.created_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
    secondsLeft: row.expires_at
      ? Math.max(0, Math.round((Date.parse(row.expires_at) - Date.now()) / 1000))
      : undefined,
  }
}

export async function fetchOrders(): Promise<Order[]> {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('orders')
    .select('*, order_boxes(id, box_size_id, price_gbp, order_box_slots(slot_index, flavour_id))')
    .order('id', { ascending: false })

  if (error) {
    console.error('[puffies] fetchOrders failed:', error.message)
    return []
  }
  return (data as unknown as OrderRow[]).map(toOrder)
}

export async function insertOrder(order: Omit<Order, 'placedAt'>): Promise<number | null> {
  if (!supabase) return null

  const { data: inserted, error } = await supabase
    .from('orders')
    .insert({
      source: order.source,
      customer_name: order.name,
      customer_email: order.email ?? null,
      status: order.status,
      total_gbp: order.total,
      note: order.note ?? null,
      pickup_slot: order.slot ?? null,
      expires_at: order.secondsLeft ? new Date(Date.now() + order.secondsLeft * 1000).toISOString() : null,
    })
    .select('id')
    .single()

  if (error || !inserted) {
    console.error('[puffies] insertOrder failed:', error?.message)
    return null
  }

  const orderId = Number((inserted as { id: number }).id)
  const boxRows = order.boxes.map(b => ({
    order_id: orderId,
    box_size_id: b.size,
    price_gbp: b.price,
  }))
  const { data: insertedBoxes, error: boxError } = await supabase
    .from('order_boxes')
    .insert(boxRows)
    .select('id')

  if (boxError || !insertedBoxes) {
    console.error('[puffies] insertOrder boxes failed:', boxError?.message)
    return orderId
  }

  const boxIds = (insertedBoxes as Array<{ id: string }>).map(b => b.id)
  const slots = order.boxes.flatMap((b, i) =>
    b.slots
      .map((flavourId, slotIndex) =>
        flavourId ? { order_box_id: boxIds[i], slot_index: slotIndex, flavour_id: flavourId } : null,
      )
      .filter((row): row is { order_box_id: string; slot_index: number; flavour_id: string } => row !== null),
  )

  if (slots.length) {
    const { error: slotError } = await supabase.from('order_box_slots').insert(slots)
    if (slotError) console.error('[puffies] insertOrder slots failed:', slotError.message)
  }

  return orderId
}

export async function setOrderStatus(id: number, status: OrderStatus): Promise<void> {
  if (!supabase) return
  const { error } = await supabase.from('orders').update({ status }).eq('id', id)
  if (error) console.error('[puffies] setOrderStatus failed:', error.message)
}

/** Subscribe to inserts and status changes. Returns an unsubscribe function. */
export function subscribeOrders(onChange: () => void): () => void {
  const client = supabase
  if (!client) return () => {}
  const channel = client
    .channel('puffies-orders')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, onChange)
    .subscribe()
  return () => {
    void client.removeChannel(channel)
  }
}

export async function fetchStock(): Promise<StockMap | null> {
  if (!supabase) return null
  const { data, error } = await supabase.from('flavours').select('id, stock_qty, sold_out')
  if (error) {
    console.error('[puffies] fetchStock failed:', error.message)
    return null
  }
  const stock: StockMap = {}
  for (const row of (data ?? []) as Array<{ id: string; stock_qty: number; sold_out: boolean }>) {
    stock[row.id] = { qty: row.stock_qty, isOut: row.sold_out }
  }
  return stock
}

export async function saveStock(id: string, qty: number, isOut: boolean): Promise<void> {
  if (!supabase) return
  const { error } = await supabase
    .from('flavours')
    .update({ stock_qty: qty, sold_out: isOut })
    .eq('id', id)
  if (error) console.error('[puffies] saveStock failed:', error.message)
}
