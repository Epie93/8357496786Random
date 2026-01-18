'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

function PurchaseSuccessContent() {
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session_id')

  return (
    <div className="min-h-screen py-12 px-4 flex items-center justify-center bg-gradient-to-b from-primary-darker via-primary-dark to-primary-darker">
      <div className="max-w-2xl w-full">
        <div className="card text-center">
          <div className="text-6xl mb-4">✅</div>
          <h1 className="text-4xl font-black mb-4 bg-gradient-to-r from-purple-300 via-pink-400 to-purple-500 bg-clip-text text-transparent">
            Payment Successful!
          </h1>
          <p className="text-xl text-gray-300 mb-6">
            Thank you for your purchase!
          </p>
          
          <div className="bg-blue-500/20 border border-blue-500/50 rounded-lg p-6 mb-6 text-left">
            <h2 className="text-xl font-bold text-blue-300 mb-4 flex items-center gap-2">
              <span>📸</span>
              <span>Next Steps:</span>
            </h2>
            <ol className="space-y-3 text-gray-300">
              <li className="flex items-start gap-3">
                <span className="text-blue-300 font-bold text-lg">1.</span>
                <span><strong className="text-white">Take a screenshot</strong> of this page or your payment confirmation</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-blue-300 font-bold text-lg">2.</span>
                <span><strong className="text-white">Open a ticket</strong> on our Discord server</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-blue-300 font-bold text-lg">3.</span>
                <span><strong className="text-white">Attach the screenshot</strong> and provide your payment details</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-blue-300 font-bold text-lg">4.</span>
                <span>You will receive your key once we verify your payment</span>
              </li>
            </ol>
          </div>

          {sessionId && (
            <div className="bg-gray-custom/50 border border-purple/20 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-400 mb-2">Payment Session ID:</p>
              <code className="text-xs text-purple-300 font-mono break-all bg-primary-dark p-2 rounded block">
                {sessionId}
              </code>
              <p className="text-xs text-gray-500 mt-2">Include this ID in your ticket for faster processing</p>
            </div>
          )}

          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 mb-6">
            <p className="text-yellow-300 text-sm">
              ⚠️ <strong>Important:</strong> Your key will be delivered after we verify your payment. Please be patient.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a 
              href="https://discord.gg/8x7PrHnA7z" 
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary flex items-center justify-center gap-2"
            >
              <span>💬</span>
              <span>Open Ticket on Discord</span>
            </a>
            <Link href="/dashboard" className="btn-secondary">
              Go to Dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function PurchaseSuccess() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-4xl animate-pulse-slow">⏳</div>
      </div>
    }>
      <PurchaseSuccessContent />
    </Suspense>
  )
}

