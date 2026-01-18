'use client'

import { useCart } from '@/context/CartContext'
import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function Cart() {
  const { items, removeItem, clearCart, total } = useCart()
  const { user } = useAuth()
  const router = useRouter()
  const [isProcessing, setIsProcessing] = useState(false)

  const handleCheckout = async () => {
    if (!user) {
      alert('Please login to complete your purchase')
      router.push('/auth/login')
      return
    }

    if (items.length === 0) {
      alert('Your cart is empty')
      return
    }

    setIsProcessing(true)

    try {
      const item = items[0] // Un seul item à la fois
      
      // Créer une session Stripe Checkout
      const response = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          planId: item.id,
          email: user.email
        })
      })

      const data = await response.json()

      if (response.ok && data.url) {
        // Rediriger vers Stripe Checkout
        window.location.href = data.url
      } else {
        alert(data.error || 'Erreur lors de la création de la session de paiement')
        setIsProcessing(false)
      }
    } catch (error) {
      console.error('Checkout error:', error)
      alert('Error processing. Please try again.')
      setIsProcessing(false)
    }
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen py-12 px-4">
        <div className="container mx-auto text-center">
          <div className="text-6xl mb-4">🛒</div>
          <h1 className="text-4xl font-bold mb-4">Your cart is empty</h1>
          <button onClick={() => router.push('/shop')} className="btn-primary mt-6">
            Continue shopping
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="container mx-auto max-w-4xl">
        <h1 className="text-5xl font-bold text-center mb-8 bg-gradient-to-r from-purple-300 to-purple-500 bg-clip-text text-transparent">
          Cart
        </h1>

        <div className="space-y-4 mb-8">
          {items.map((item) => (
            <div key={item.id} className="card flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold text-purple-300">{item.name}</h3>
                <p className="text-gray-400">Duration: {item.duration}</p>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-2xl font-bold">
                  {item.price} {item.currency === 'USD' ? '$' : '€'}
                </span>
                <button
                  onClick={() => removeItem(item.id)}
                  className="text-red-400 hover:text-red-300 text-xl"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="card">
          <div className="flex justify-between items-center mb-6">
            <span className="text-2xl font-bold">Total:</span>
            <span className="text-3xl font-bold text-purple-300">
              {total} {items[0]?.currency === 'USD' ? '$' : '€'}
            </span>
          </div>

          <div className="flex gap-4">
            <button
              onClick={handleCheckout}
              disabled={isProcessing}
              className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? 'Processing...' : 'Proceed to payment'}
            </button>
            <button
              onClick={() => router.push('/shop')}
              className="btn-secondary"
            >
              Continue shopping
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
