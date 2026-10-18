import Image from 'next/image'
import type { Expression } from '@/lib/types'
import { cn } from '@/lib/utils'

const LABELS: Record<Expression, string> = {
  happy: 'Boo the ghost, waving happily',
  shocked: 'Boo the ghost, looking shocked',
  angry: 'Boo the ghost, looking grumpy',
  laughing: 'Boo the ghost, laughing',
  crying: 'Boo the ghost, crying',
}

export function Boo({
  expression = 'happy',
  className,
  float = false,
  priority = false,
  decorative = false,
}: {
  expression?: Expression
  className?: string
  float?: boolean
  priority?: boolean
  decorative?: boolean
}) {
  return (
    <div className={cn('relative aspect-square overflow-hidden', float && 'animate-float', className)}>
      <Image
        src={`/boo/${expression}.png`}
        alt={decorative ? '' : LABELS[expression]}
        fill
        priority={priority}
        sizes="(max-width: 768px) 60vw, 420px"
        className="boo-blend scale-110 object-cover"
      />
    </div>
  )
}
