export type FlavourType = 'sweet' | 'savoury'

export interface Flavour {
  id: string
  name: string
  emoji: string
  note: string
  hex: string
  type: FlavourType
  active: boolean
}

export type StockMap = Record<string, { qty: number; isOut: boolean }>

export type BoxSize = 'small' | 'large'

export interface BoxSizeOption {
  id: BoxSize
  name: string
  slots: number
  maxFlavours: number
  priceFrom: number
  emoji: string
  desc: string
}

export interface Box {
  size: BoxSize
  slots: Array<string | null>
  price: number
  free?: boolean
}

export type OrderStatus = 'pending' | 'in_queue' | 'ready' | 'collected' | 'cancelled'
export type OrderSource = 'kiosk' | 'till' | 'preorder'

export interface Order {
  id: number
  name: string
  email?: string
  source: OrderSource
  status: OrderStatus
  total: number
  boxes: Box[]
  note?: string
  slot?: string
  pickupDate?: string
  placedAt: string
  loyalty?: boolean
  freeBox?: boolean
  secondsLeft?: number
}

export interface Customer {
  id: number
  name: string
  email: string | null
  phone: string | null
  orders: number
  spend: number
  loyalty: boolean
  freeBoxOwed: boolean
  joined: string
  nudgeSent?: boolean
  history: Array<{ id: number; date: string; type: string; items: string; total: number }>
}
