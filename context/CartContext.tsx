'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

export interface CartItem {
  id: string
  name: string
  duration: string
  price: number
  currency: string
}

interface CartContextType {
  items: CartItem[]
  addItem: (item: CartItem) => void
  removeItem: (id: string) => void
  clearCart: () => void
  itemCount: number
  total: number
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])

  useEffect(() => {
    const savedCart = localStorage.getItem('cart')
    if (savedCart) {
      setItems(JSON.parse(savedCart))
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(items))
  }, [items])

  const addItem = (item: CartItem) => {
    setItems([item]) // Un seul item à la fois dans le panier
  }

  const removeItem = (id: string) => {
    setItems(items.filter(item => item.id !== id))
  }

  const clearCart = () => {
    setItems([])
  }

  const itemCount = items.length
  const total = items.reduce((sum, item) => sum + item.price, 0)

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, clearCart, itemCount, total }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}

