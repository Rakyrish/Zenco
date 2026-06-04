'use client'

import { cn } from '@/lib/utils'

interface LogoProps {
  className?: string
  iconClassName?: string
  textClassName?: string
  subtitleClassName?: string
  showText?: boolean
}

export default function Logo({
  className,
  iconClassName,
  textClassName,
  subtitleClassName,
  showText = true,
}: LogoProps) {
  return (
    <div className={cn('flex items-center gap-3 group select-none', className)}>
      {/* Dynamic SVG Logo matching the user's uploaded images */}
      <svg
        viewBox="0 0 100 100"
        className={cn('w-10 h-10 text-accent transition-transform duration-300 group-hover:scale-105', iconClassName)}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Buildings / Storage tanks outline */}
        <path
          d="M 33 53 L 33 45 L 39 45 L 39 53"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M 42 53 L 42 32 L 49 32 L 49 53"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M 52 53 L 52 40 L 59 40 L 59 53"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M 39 40 L 42 32 M 49 32 L 52 40"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray="2 2"
          className="opacity-40"
        />
        
        {/* Slanted roofs of the structures */}
        <path
          d="M 42 32 L 49 35"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
        />

        {/* Horizontal lines under structures */}
        <line x1="36" y1="58" x2="56" y2="58" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" />
        <line x1="41" y1="63" x2="51" y2="63" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" />

        {/* Orbit crescent rings wrapping from bottom left to top right */}
        <path
          d="M 30 55 A 24 24 0 1 0 65 38"
          stroke="currentColor"
          strokeWidth="3.5"
          strokeLinecap="round"
        />
        <path
          d="M 35 60 A 19 19 0 1 0 60 45"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </svg>

      {showText && (
        <div className="flex flex-col">
          <span
            className={cn(
              'text-white font-display font-bold text-lg leading-tight tracking-tight',
              textClassName
            )}
          >
            Zenco Systems
          </span>
          <span
            className={cn(
              'text-accent text-[10px] font-semibold tracking-widest uppercase mt-0.5',
              subtitleClassName
            )}
          >
            Chemicals Division
          </span>
        </div>
      )}
    </div>
  )
}
