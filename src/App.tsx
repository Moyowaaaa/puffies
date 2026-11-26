import { useCallback, useEffect, useMemo, useState } from 'react'
import KioskScreen from './screens/KioskScreen'
import TillScreen from './screens/TillScreen'
import KitchenScreen from './screens/KitchenScreen'
import PreOrderScreen from './screens/PreOrderScreen'
import AdminScreen from './screens/AdminScreen'
import StaffLogin from './screens/StaffLogin'
import type { Session } from '@supabase/supabase-js'
import { INITIAL_ORDERS, INITIAL_STOCK } from './data/mock'
import { isBackendEnabled, supabase } from './lib/supabase'
import {
  fetchOrders,
  fetchStock,
  insertOrder,
  saveStock,
  setOrderStatus,
  subscribeOrders,
} from './lib/backend'
import type { Box, Order, OrderStatus, StockMap } from './types'

const APPS = ['kiosk', 'till', 'kitchen', 'preorder', 'admin'] as const
type AppId = (typeof APPS)[number]

const LABELS: Record<AppId, string> = {
  kiosk: '🛒 Kiosk',
  till: '🖥️ Till',
  kitchen: '📋 Kitchen',
  preorder: '🌐 Pre-Order',
  admin: '⚙️ Admin',
}

const STAFF_APPS: AppId[] = ['till', 'kitchen', 'admin']
// Admin is deliberately absent from the nav — reach it directly at /admin.
const NAV_APPS: AppId[] = ['kiosk', 'till', 'kitchen', 'preorder']

function readApp(): AppId | null {
  if (typeof window === 'undefined') return null
  const path = window.location.pathname.replace(/^\/+|\/+$/g, '')
  if ((APPS as readonly string[]).includes(path)) return path as AppId
  // Legacy ?app= links still work for old bookmarks.
  const param = new URLSearchParams(window.location.search).get('app')
  return param && (APPS as readonly string[]).includes(param) ? (param as AppId) : null
}

export default function App() {
  const pinnedApp = useMemo(() => readApp(), [])
  const app = useMemo<AppId>(() => pinnedApp ?? 'till', [pinnedApp])
  const pinned = app === 'admin'
  const backendEnabled = useMemo(() => isBackendEnabled(), [])
  const [orders, setOrders] = useState<Order[]>(INITIAL_ORDERS)
  const [stock, setStock] = useState<StockMap>(INITIAL_STOCK)
  const [session, setSession] = useState<Session | null>(null)
  const [authReady, setAuthReady] = useState(!backendEnabled)

  // Kiosk countdowns tick in real time
  useEffect(() => {
    const timer = window.setInterval(() => {
      setOrders(prev =>
        prev.map(o =>
          o.status === 'pending' && o.secondsLeft
            ? { ...o, secondsLeft: Math.max(0, o.secondsLeft - 1) }
            : o,
        ),
      )
    }, 1000)
    return () => window.clearInterval(timer)
  }, [])

  // Staff session. Kiosk + pre-order remain public.
  useEffect(() => {
    if (!backendEnabled || !supabase) return
    void supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setAuthReady(true)
    })
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, next) => setSession(next))
    return () => subscription.unsubscribe()
  }, [])

  // Replace mock state with Supabase data, kept live by Realtime.
  useEffect(() => {
    if (!backendEnabled) return
    void fetchStock().then(s => {
      if (s) setStock(s)
    })
    if (!session) return
    void fetchOrders().then(setOrders)
    return subscribeOrders(() => {
      void fetchOrders().then(setOrders)
    })
  }, [session])

  const nextOrderId = useMemo(() => Math.max(...orders.map(o => o.id)) + 1, [orders])

  const setStatus = useCallback((id: number, status: OrderStatus) => {
    setOrders(prev => prev.map(o => (o.id === id ? { ...o, status } : o)))
    void setOrderStatus(id, status)
  }, [])

  const addOrder = useCallback((order: Omit<Order, 'placedAt'>) => {
    setOrders(prev => [{ ...order, placedAt: 'just now' }, ...prev])
    void insertOrder(order)
  }, [])

  const placeKioskOrder = useCallback(
    (o: { id: number; name: string; email?: string; boxes: Box[]; total: number; note?: string }) =>
      addOrder({
        ...o,
        source: 'kiosk',
        status: 'pending',
        secondsLeft: 600,
      }),
    [addOrder],
  )

  const placePreorder = useCallback(
    (o: {
      id: number
      name: string
      email?: string
      boxes: Box[]
      total: number
      slot: string
      pickupDate: string
    }) => addOrder({ ...o, source: 'preorder', status: 'pending' }),
    [addOrder],
  )

  const changeStock = useCallback((id: string, qty: number) => {
    setStock(prev => ({ ...prev, [id]: { qty, isOut: qty === 0 } }))
    void saveStock(id, qty, qty === 0)
  }, [])

  const toggleOut = useCallback(
    (id: string) => {
      const current = stock[id] ?? { qty: 0, isOut: false }
      const isOut = !current.isOut
      const next = { qty: isOut ? 0 : Math.max(current.qty, 6), isOut }
      setStock(prev => ({ ...prev, [id]: next }))
      void saveStock(id, next.qty, isOut)
    },
    [stock],
  )

  const editPending = useCallback((id: number) => {
    // Wireframe behaviour: staff edits happen in the new-order flow; pre-filling lands in phase 2.
    window.alert(`Editing order #${id} — the edit flow lands in phase 2 (box builder pre-filled from the order).`)
  }, [])

  const noNav = pinned
  const needsLogin = backendEnabled && authReady && STAFF_APPS.includes(app) && !session

  return (
    <>
      {!pinned && (
        <nav className="nav">
          <div className="nav-inner">
            {NAV_APPS.map(a => (
              <a key={a} href={`/${a}`} className={`tab${app === a ? ' active' : ''}`}>
                {LABELS[a]}
              </a>
            ))}
            <span
              style={{
                marginLeft: 'auto',
                alignSelf: 'center',
                padding: '0 10px',
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: '.08em',
                color: backendEnabled ? '#4ED68A' : 'rgba(245,240,224,.5)',
              }}
            >
              {backendEnabled ? '● LIVE' : '● MOCK'}
            </span>
          </div>
        </nav>
      )}

      {needsLogin && <StaffLogin />}
      {!needsLogin && app === 'kiosk' && (
        <KioskScreen stock={stock} nextOrderId={nextOrderId} onPlaceOrder={placeKioskOrder} />
      )}
      {!needsLogin && app === 'till' && (
        <TillScreen
          orders={orders}
          stock={stock}
          nextOrderId={nextOrderId}
          noNav={noNav}
          onSetStatus={setStatus}
          onAddOrder={addOrder}
          onEditPending={editPending}
        />
      )}
      {!needsLogin && app === 'kitchen' && <KitchenScreen orders={orders} onSetStatus={setStatus} />}
      {!needsLogin && app === 'preorder' && (
        <PreOrderScreen stock={stock} nextOrderId={nextOrderId} onPlacePreorder={placePreorder} />
      )}
      {!needsLogin && app === 'admin' && (
        <AdminScreen
          orders={orders}
          stock={stock}
          noNav={noNav}
          useMock={!backendEnabled}
          onSetStatus={setStatus}
          onStockChange={changeStock}
          onToggleOut={toggleOut}
        />
      )}
    </>
  )
}
