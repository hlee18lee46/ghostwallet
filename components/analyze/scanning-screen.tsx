'use client'

import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useState } from 'react'
import { Boo } from '@/components/boo'

const STEPS = [
  'Summoning Boo…',
  'Reading your transaction history…',
  'Counting swaps you regret…',
  'Inspecting your JPEGs…',
  'Calculating gas fee trauma…',
  'Consulting the ghost council…',
]

export function ScanningScreen({ isDemo }: { isDemo: boolean }) {
  const [step, setStep] = useState(0)

  useEffect(() => {
    const id = setInterval(() => setStep((s) => Math.min(s + 1, STEPS.length - 1)), 1400)
    return () => clearInterval(id)
  }, [])

  return (
    <section
      aria-live="polite"
      aria-busy="true"
      className="hero-glow flex min-h-[70dvh] flex-col items-center justify-center gap-8 px-4 py-16 text-center"
    >
      <div className="relative">
        <Boo expression="shocked" float className="w-56 md:w-72" />
        <motion.div
          aria-hidden
          className="absolute inset-x-6 h-1 rounded-full bg-accent/80 shadow-[0_0_24px_4px] shadow-accent/50"
          initial={{ top: '20%' }}
          animate={{ top: ['20%', '80%', '20%'] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>
      <div className="flex h-20 flex-col items-center gap-2">
        <AnimatePresence mode="wait">
          <motion.p
            key={step}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="font-display text-2xl font-semibold md:text-3xl"
          >
            {STEPS[step]}
          </motion.p>
        </AnimatePresence>
        <p className="text-sm text-muted-foreground">
          {isDemo ? 'Loading demo wallet' : 'Live Solana mainnet data · usually 5–15 seconds'}
        </p>
      </div>
      <div className="h-2 w-64 overflow-hidden rounded-full bg-muted">
        <motion.div
          className="h-full rounded-full bg-primary"
          initial={{ width: '5%' }}
          animate={{ width: `${((step + 1) / STEPS.length) * 92}%` }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
        />
      </div>
    </section>
  )
}
