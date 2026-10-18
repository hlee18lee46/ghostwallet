'use client'

import { motion } from 'motion/react'
import type { AnalysisResponse } from '@/lib/analysis/service'
import { AchievementList } from './achievement-list'
import { DataNotice } from './data-notice'
import { MintDialog } from './mint-dialog'
import { PersonalityCard } from './personality-card'
import { RoastPanel } from './roast-panel'
import { ShareActions } from './share-actions'
import { StatsGrid } from './stats-grid'

const reveal = {
  hidden: { opacity: 0, y: 24 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { delay: 0.15 + i * 0.12, duration: 0.5, ease: 'easeOut' as const } }),
}

export function Results({
  data,
  rerolling,
  rerollError,
  onRoastAgain,
}: {
  data: AnalysisResponse
  rerolling: boolean
  rerollError: string | null
  onRoastAgain: () => void
}) {
  const { metrics, personality } = data
  const sections = [
    <RoastPanel
      key="roast"
      personality={personality}
      rerolling={rerolling}
      rerollError={rerollError}
      onRoastAgain={onRoastAgain}
    />,
    <StatsGrid key="stats" metrics={metrics} />,
    <AchievementList key="ach" achievements={personality.achievements} />,
    <DataNotice key="data" metrics={metrics} reasons={personality.reasons} />,
  ]

  return (
    <div className="hero-glow">
      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-10 md:py-14 lg:grid-cols-[minmax(0,420px)_1fr]">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, rotate: -3 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 160, damping: 16 }}
          className="flex flex-col gap-4 lg:sticky lg:top-24 lg:self-start"
        >
          <PersonalityCard metrics={metrics} personality={personality} />
          <ShareActions metrics={metrics} personality={personality} />
          <MintDialog metrics={metrics} personality={personality} />
        </motion.div>

        <div className="flex min-w-0 flex-col gap-6">
          {sections.map((node, i) => (
            <motion.div key={i} custom={i} variants={reveal} initial="hidden" animate="show">
              {node}
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}
