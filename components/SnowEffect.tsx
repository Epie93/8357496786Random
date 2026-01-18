'use client'

import { useState, useEffect } from 'react'

// Générer les flocons
const generateSnowflakes = (count: number) => {
  return Array.from({ length: count }, (_, i) => {
    const left = Math.random() * 100
    const duration = Math.random() * 5 + 5
    const delay = Math.random() * 5
    const size = Math.random() * 6 + 4
    const opacity = Math.random() * 0.4 + 0.6
    const drift = (Math.random() - 0.5) * 100

    return { id: i, left, duration, delay, size, opacity, drift }
  })
}

export default function SnowEffect() {
  const [mounted, setMounted] = useState(false)
  const [snowflakes, setSnowflakes] = useState<ReturnType<typeof generateSnowflakes>>([])

  useEffect(() => {
    // Marquer comme monté et générer les flocons côté client uniquement
    setMounted(true)
    setSnowflakes(generateSnowflakes(80))
    
    // Ajouter l'animation CSS directement au chargement
    if (typeof document !== 'undefined') {
      // Vérifier si l'animation existe déjà
      if (!document.getElementById('snow-animation-style')) {
        const style = document.createElement('style')
        style.id = 'snow-animation-style'
        style.textContent = `
          @keyframes snowFall {
            0% {
              transform: translateY(-100vh) translateX(0) rotate(0deg);
              opacity: 0;
            }
            10% {
              opacity: 1;
            }
            90% {
              opacity: 1;
            }
            100% {
              transform: translateY(100vh) translateX(var(--snow-x)) rotate(360deg);
              opacity: 0;
            }
          }
        `
        document.head.appendChild(style)
      }
    }
  }, [])

  // Ne rien rendre côté serveur pour éviter l'erreur d'hydratation
  if (!mounted || snowflakes.length === 0) return null

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 9999,
        overflow: 'hidden',
      }}
    >
      {snowflakes.map((flake) => (
        <div
          key={flake.id}
          style={{
            position: 'absolute',
            left: `${flake.left}%`,
            top: '-50px',
            width: `${flake.size}px`,
            height: `${flake.size}px`,
            backgroundColor: 'white',
            borderRadius: '50%',
            opacity: flake.opacity,
            boxShadow: `0 0 ${flake.size * 3}px rgba(255, 255, 255, 0.8)`,
            animation: `snowFall ${flake.duration}s linear infinite`,
            animationDelay: `${flake.delay}s`,
            '--snow-x': `${flake.drift}px`,
            pointerEvents: 'none',
          } as React.CSSProperties & { '--snow-x'?: string }}
        />
      ))}
    </div>
  )
}

