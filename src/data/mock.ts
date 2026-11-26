import type { BoxSizeOption, Customer, Flavour, Order, StockMap } from '../types'

// ═══ FLAVOURS — lifted from the wireframe launch set ═══
export const FLAVOURS: Flavour[] = [
  { id: 'biscoff', name: 'Biscoff', emoji: '🍪', note: 'Biscoff syrup + crumbs', hex: '#B5651D', type: 'sweet', active: true },
  { id: 'cinnamon', name: 'Cinnamon Sugar', emoji: '🍂', note: 'Inject syrup · cinnamon coat', hex: '#C4882D', type: 'sweet', active: true },
  { id: 'tiramisu', name: 'Tiramisu', emoji: '🍦', note: 'Coffee + mascarpone', hex: '#4A2C2A', type: 'sweet', active: true },
  { id: 'ube', name: 'Ube Cream', emoji: '💜', note: 'Ube injection · piped cream', hex: '#7B3F6E', type: 'sweet', active: true },
  { id: 'strawberry', name: 'Strawberry Shortcake', emoji: '🍓', note: 'White choc · shortbread · berry', hex: '#D4697A', type: 'sweet', active: true },
  { id: 'pistachio', name: 'Pistachio', emoji: '🌰', note: 'Pistachio drizzle + crumble', hex: '#5C7A5C', type: 'sweet', active: true },
  { id: 'brisket', name: 'Beef Brisket', emoji: '🥩', note: 'Slow-cooked beef · jus', hex: '#6B2D1A', type: 'savoury', active: true },
  { id: 'katsu', name: 'Katsu Curry', emoji: '🍛', note: 'Japanese curry sauce', hex: '#C4882D', type: 'savoury', active: true },
  { id: 'cheesy', name: 'Cheesy Melt', emoji: '🧀', note: 'Melted cheese filling', hex: '#D4A017', type: 'savoury', active: true },
]

export const INITIAL_STOCK: StockMap = {
  biscoff: { qty: 12, isOut: false },
  cinnamon: { qty: 20, isOut: false },
  tiramisu: { qty: 8, isOut: false },
  ube: { qty: 15, isOut: false },
  strawberry: { qty: 6, isOut: false },
  pistachio: { qty: 18, isOut: false },
  brisket: { qty: 0, isOut: true },
  katsu: { qty: 14, isOut: false },
  cheesy: { qty: 4, isOut: false },
}

export const BOX_SIZES: BoxSizeOption[] = [
  { id: 'small', name: 'Small Box', slots: 4, maxFlavours: 2, priceFrom: 5, emoji: '🍡', desc: '4 puffies · 2 flavours' },
  { id: 'large', name: 'Large Box', slots: 8, maxFlavours: 4, priceFrom: 9, emoji: '📦', desc: '8 puffies · 4 flavours' },
]

// ═══ ORDERS — from the wireframe history ═══
const box = (size: 'small' | 'large', price: number, names: string[]) => ({
  size,
  price,
  slots: names.map(n => FLAVOURS.find(f => f.name === n)?.id ?? null),
})

export const INITIAL_ORDERS: Order[] = [
  {
    id: 67, name: 'Funmi', source: 'till', status: 'collected', total: 23, placedAt: '2:17pm',
    boxes: [
      box('large', 9, ['Biscoff', 'Ube Cream', 'Tiramisu', 'Pistachio', 'Cinnamon Sugar', 'Strawberry', 'Biscoff', 'Ube Cream']),
      box('large', 9, ['Tiramisu', 'Pistachio', 'Cinnamon Sugar', 'Strawberry', 'Biscoff', 'Ube Cream', 'Tiramisu', 'Pistachio']),
      box('small', 5, ['Biscoff', 'Ube Cream', 'Tiramisu', 'Strawberry']),
    ],
  },
  {
    id: 66, name: 'Yemi', source: 'preorder', status: 'ready', total: 9, placedAt: '2:00pm slot', slot: '2:00pm',
    boxes: [box('large', 9, ['Ube Cream', 'Pistachio', 'Tiramisu', 'Biscoff', 'Cinnamon Sugar', 'Strawberry', 'Ube Cream', 'Pistachio'])],
  },
  {
    id: 65, name: 'Khadija', source: 'till', status: 'collected', total: 5, loyalty: true, placedAt: '2:14pm',
    boxes: [box('small', 5, ['Biscoff', 'Ube Cream', 'Tiramisu', 'Strawberry'])],
  },
  {
    id: 64, name: 'Tumi', source: 'kiosk', status: 'collected', total: 9, placedAt: '1:58pm',
    boxes: [box('large', 9, ['Strawberry', 'Biscoff', 'Tiramisu', 'Ube Cream', 'Pistachio', 'Cinnamon Sugar', 'Strawberry', 'Biscoff'])],
  },
  {
    id: 63, name: 'Aisha', source: 'preorder', status: 'in_queue', total: 9, placedAt: '1:30pm slot', slot: '1:30pm',
    boxes: [box('large', 9, ['Tiramisu', 'Ube Cream', 'Biscoff', 'Pistachio', 'Cinnamon Sugar', 'Strawberry', 'Tiramisu', 'Ube Cream'])],
  },
  {
    id: 62, name: 'Tunde', source: 'till', status: 'in_queue', total: 5, note: 'Extra sauce on the side please', placedAt: '1:44pm',
    boxes: [box('small', 5, ['Cinnamon Sugar', 'Biscoff', 'Tiramisu', 'Pistachio'])],
  },
  {
    id: 61, name: 'Marcus', source: 'till', status: 'collected', total: 9, placedAt: '1:30pm',
    boxes: [box('large', 9, ['Biscoff', 'Tiramisu', 'Ube Cream', 'Strawberry', 'Pistachio', 'Cinnamon Sugar', 'Biscoff', 'Tiramisu'])],
  },
  {
    id: 60, name: 'Sade', source: 'preorder', status: 'collected', total: 14, placedAt: '1:00pm slot', slot: '1:00pm',
    boxes: [
      box('large', 9, ['Ube Cream', 'Pistachio', 'Tiramisu', 'Biscoff', 'Cinnamon Sugar', 'Strawberry', 'Ube Cream', 'Pistachio']),
      box('small', 5, ['Strawberry', 'Biscoff', 'Tiramisu', 'Cinnamon Sugar']),
    ],
  },
  {
    id: 69, name: 'Sade', source: 'kiosk', status: 'pending', total: 5, secondsLeft: 74, placedAt: 'just now',
    boxes: [box('small', 5, ['Tiramisu', 'Tiramisu', 'Biscoff', 'Biscoff'])],
  },
  {
    id: 68, name: 'Khadija', source: 'kiosk', status: 'pending', total: 12, freeBox: true, secondsLeft: 452, placedAt: '1 min ago',
    note: 'No brisket please, swap for extra ube',
    boxes: [box('large', 12, ['Ube Cream', 'Ube Cream', 'Pistachio', 'Pistachio', 'Katsu Curry', 'Katsu Curry', 'Cheesy Melt', 'Cheesy Melt'])],
  },
]

export const CUSTOMERS: Customer[] = [
  {
    id: 1, name: 'Khadija Osei', email: 'khadija@email.com', phone: '07712 345678', orders: 5, spend: 45,
    loyalty: true, freeBoxOwed: true, joined: 'today',
    history: [
      { id: 65, date: 'Today 2:14pm', type: 'Walk-in', items: 'Small Box', total: 5 },
      { id: 58, date: 'Last pop-up', type: 'Walk-in', items: 'Large Box', total: 9 },
      { id: 52, date: '2 pop-ups ago', type: 'Pre-order', items: 'Large Box', total: 9 },
      { id: 44, date: '3 pop-ups ago', type: 'Walk-in', items: 'Small Box', total: 5 },
      { id: 38, date: '4 pop-ups ago', type: 'Walk-in', items: 'Large Box', total: 17 },
    ],
  },
  {
    id: 2, name: 'Tunde Adeyemi', email: 'tunde@email.com', phone: '07823 456789', orders: 4, spend: 36,
    loyalty: true, freeBoxOwed: false, joined: 'returning', nudgeSent: true,
    history: [
      { id: 62, date: 'Today 1:44pm', type: 'Walk-in', items: 'Small Box', total: 5 },
      { id: 55, date: 'Last pop-up', type: 'Walk-in', items: 'Large Box', total: 9 },
      { id: 49, date: '2 pop-ups ago', type: 'Pre-order', items: 'Large Box', total: 9 },
      { id: 41, date: '3 pop-ups ago', type: 'Walk-in', items: 'Large Box + Small Box', total: 14 },
    ],
  },
  {
    id: 3, name: 'Aisha Mensah', email: 'aisha@email.com', phone: '07934 567890', orders: 3, spend: 27,
    loyalty: true, freeBoxOwed: false, joined: 'returning',
    history: [
      { id: 63, date: 'Today 1:30pm slot', type: 'Pre-order', items: 'Large Box', total: 9 },
      { id: 57, date: 'Last pop-up', type: 'Pre-order', items: 'Large Box', total: 9 },
      { id: 48, date: '2 pop-ups ago', type: 'Pre-order', items: 'Small Box', total: 9 },
    ],
  },
  {
    id: 4, name: 'Marcus Johnson', email: 'marcus@email.com', phone: '07645 678901', orders: 2, spend: 18,
    loyalty: false, freeBoxOwed: false, joined: 'returning',
    history: [
      { id: 61, date: 'Today 1:30pm', type: 'Walk-in', items: 'Large Box', total: 9 },
      { id: 54, date: 'Last pop-up', type: 'Walk-in', items: 'Large Box', total: 9 },
    ],
  },
  {
    id: 5, name: 'Sade Williams', email: 'sade@email.com', phone: '07756 789012', orders: 2, spend: 23,
    loyalty: false, freeBoxOwed: false, joined: 'returning',
    history: [
      { id: 60, date: 'Today 1:00pm slot', type: 'Pre-order', items: 'Large Box + Small Box', total: 14 },
      { id: 51, date: 'Last pop-up', type: 'Pre-order', items: 'Small Box', total: 9 },
    ],
  },
  {
    id: 6, name: 'Funmi Okafor', email: null, phone: null, orders: 1, spend: 23,
    loyalty: false, freeBoxOwed: false, joined: 'today',
    history: [{ id: 67, date: 'Today 2:17pm', type: 'Walk-in', items: '2× Large Box + Small Box', total: 23 }],
  },
  {
    id: 7, name: 'Yemi Taiwo', email: 'yemi@email.com', phone: null, orders: 1, spend: 9,
    loyalty: false, freeBoxOwed: false, joined: 'today',
    history: [{ id: 66, date: 'Today 2:00pm slot', type: 'Pre-order', items: 'Large Box', total: 9 }],
  },
  {
    id: 8, name: 'Tumi Osei', email: 'tumi@email.com', phone: '07867 890123', orders: 1, spend: 9,
    loyalty: false, freeBoxOwed: false, joined: 'today',
    history: [{ id: 64, date: 'Today 1:58pm', type: 'Kiosk', items: 'Large Box', total: 9 }],
  },
]

// ═══ ANALYTICS ═══
export const REV_DATA = {
  '7d': [{ l: 'Sat', v: 142 }, { l: 'Sun', v: 218 }, { l: 'Mon', v: 195 }, { l: 'Tue', v: 301 }, { l: 'Wed', v: 267 }, { l: 'Thu', v: 316 }, { l: 'Fri', v: 349 }],
  '30d': [{ l: 'W1', v: 580 }, { l: 'W2', v: 720 }, { l: 'W3', v: 650 }, { l: 'W4', v: 1140 }],
  all: [{ l: 'Oct', v: 1890 }, { l: 'Nov', v: 2340 }, { l: 'Dec', v: 3100 }],
} as const

export const HOURS_DATA = {
  today: [{ l: '11am', v: 3 }, { l: '12pm', v: 8 }, { l: '1pm', v: 22 }, { l: '2pm', v: 30 }, { l: '3pm', v: 21 }, { l: '4pm', v: 13 }, { l: '5pm', v: 7 }],
  '7d': [{ l: '11am', v: 18 }, { l: '12pm', v: 47 }, { l: '1pm', v: 134 }, { l: '2pm', v: 189 }, { l: '3pm', v: 142 }, { l: '4pm', v: 88 }, { l: '5pm', v: 41 }],
  '30d': [{ l: '11am', v: 72 }, { l: '12pm', v: 198 }, { l: '1pm', v: 541 }, { l: '2pm', v: 762 }, { l: '3pm', v: 580 }, { l: '4pm', v: 344 }, { l: '5pm', v: 163 }],
  all: [{ l: '11am', v: 210 }, { l: '12pm', v: 580 }, { l: '1pm', v: 1540 }, { l: '2pm', v: 2180 }, { l: '3pm', v: 1690 }, { l: '4pm', v: 1020 }, { l: '5pm', v: 490 }],
} as const

export const UNITS_DATA = {
  today: [
    { name: 'Biscoff', emoji: '🍪', hex: '#B5651D', v: 34 },
    { name: 'Ube Cream', emoji: '💜', hex: '#7B3F6E', v: 29 },
    { name: 'Tiramisu', emoji: '🍦', hex: '#4A2C2A', v: 26 },
    { name: 'Strawberry', emoji: '🍓', hex: '#D4697A', v: 22 },
    { name: 'Pistachio', emoji: '🌰', hex: '#5C7A5C', v: 18 },
    { name: 'Cinnamon', emoji: '🍂', hex: '#C4882D', v: 14 },
  ],
  '7d': [
    { name: 'Biscoff', emoji: '🍪', hex: '#B5651D', v: 201 },
    { name: 'Ube Cream', emoji: '💜', hex: '#7B3F6E', v: 188 },
    { name: 'Strawberry', emoji: '🍓', hex: '#D4697A', v: 162 },
    { name: 'Tiramisu', emoji: '🍦', hex: '#4A2C2A', v: 145 },
    { name: 'Pistachio', emoji: '🌰', hex: '#5C7A5C', v: 120 },
    { name: 'Cinnamon', emoji: '🍂', hex: '#C4882D', v: 98 },
  ],
  '30d': [
    { name: 'Biscoff', emoji: '🍪', hex: '#B5651D', v: 812 },
    { name: 'Tiramisu', emoji: '🍦', hex: '#4A2C2A', v: 734 },
    { name: 'Ube Cream', emoji: '💜', hex: '#7B3F6E', v: 698 },
    { name: 'Strawberry', emoji: '🍓', hex: '#D4697A', v: 601 },
    { name: 'Pistachio', emoji: '🌰', hex: '#5C7A5C', v: 488 },
    { name: 'Cinnamon', emoji: '🍂', hex: '#C4882D', v: 412 },
  ],
  all: [
    { name: 'Biscoff', emoji: '🍪', hex: '#B5651D', v: 2410 },
    { name: 'Tiramisu', emoji: '🍦', hex: '#4A2C2A', v: 2180 },
    { name: 'Ube Cream', emoji: '💜', hex: '#7B3F6E', v: 1990 },
    { name: 'Strawberry', emoji: '🍓', hex: '#D4697A', v: 1740 },
    { name: 'Cinnamon', emoji: '🍂', hex: '#C4882D', v: 1320 },
    { name: 'Pistachio', emoji: '🌰', hex: '#5C7A5C', v: 1150 },
  ],
} as const

// ═══ PRE-ORDER SLOTS — 11:00am–6:00pm, 30-min windows ═══
export const TIME_SLOTS = [
  '11:00am', '11:30am', '12:00pm', '12:30pm', '1:00pm', '1:30pm',
  '2:00pm', '2:30pm', '3:00pm', '3:30pm', '4:00pm', '4:30pm', '5:00pm', '5:30pm',
].map((time, i) => ({ time, spotsLeft: i % 4 === 0 ? 0 : 6 - (i % 5) }))

export const EMAIL_TYPES = {
  welcome: {
    title: 'Welcome',
    trigger: 'On first order',
    subject: 'Welcome to Puffies 🍡',
    body: 'Hey {{first_name}} — thanks for your first box! You can grab another box at any of our pop-ups.',
    delayHours: 0,
  },
  nudge: {
    title: 'Loyalty nudge',
    trigger: 'After order 4',
    subject: 'One more box to go 👀',
    body: 'Hey {{first_name}} — you’re one box away from a free Small Box. See you at the next pop-up.',
    delayHours: 24,
  },
  free_box: {
    title: 'Free box',
    trigger: 'After order 5',
    subject: 'Your free box is ready 🎁',
    body: 'Hey {{first_name}} — your free Small Box is ready. Just mention this email at the counter.',
    delayHours: 0,
  },
} as const
