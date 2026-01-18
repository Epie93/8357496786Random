import Link from 'next/link'

interface LogoProps {
  className?: string
  showText?: boolean
}

export default function Logo({ className = '', showText = true }: LogoProps) {
  return (
    <Link href="/" className={`flex items-center gap-3 hover:scale-105 transition-transform duration-300 ${className}`}>
      {/* Shield Logo with EA */}
      <svg
        width="48"
        height="56"
        viewBox="0 0 48 56"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="flex-shrink-0"
      >
        {/* Shield gradient border */}
        <defs>
          <linearGradient id="shieldGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#9333ea" />
            <stop offset="50%" stopColor="#a855f7" />
            <stop offset="100%" stopColor="#06b6d4" />
          </linearGradient>
        </defs>
        
        {/* Shield shape */}
        <path
          d="M24 4 L6 12 L6 28 C6 40 12 50 24 52 C36 50 42 40 42 28 L42 12 Z"
          fill="url(#shieldGradient)"
          stroke="url(#shieldGradient)"
          strokeWidth="2"
        />
        
        {/* Inner dark shield */}
        <path
          d="M24 6 L8 13 L8 28 C8 39 13 47 24 50 C35 47 40 39 40 28 L40 13 Z"
          fill="#0f0f1e"
        />
        
        {/* EA letters */}
        <text
          x="24"
          y="32"
          fontSize="18"
          fontWeight="bold"
          fill="white"
          textAnchor="middle"
          fontFamily="Arial, sans-serif"
        >
          EA
        </text>
      </svg>
      
      {/* Text */}
      {showText && (
        <span className="text-white font-semibold text-xl whitespace-nowrap">
          Epie FiveM
        </span>
      )}
    </Link>
  )
}

