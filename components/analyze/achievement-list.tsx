import { Award } from 'lucide-react'
import type { Achievement } from '@/lib/types'

export function AchievementList({ achievements }: { achievements: Achievement[] }) {
  return (
    <section aria-labelledby="ach-heading" className="card-3d flex flex-col gap-4 rounded-3xl border bg-card p-6 md:p-8">
      <h2 id="ach-heading" className="text-2xl font-semibold">
        Achievements unlocked
      </h2>
      {achievements.length === 0 ? (
        <p className="leading-relaxed text-muted-foreground">
          None yet. Boo respects the restraint. Or the lack of ambition.
        </p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {achievements.map((a) => (
            <li key={a.id} className="flex items-start gap-3 rounded-2xl bg-muted/50 p-4">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-success text-success-foreground">
                <Award className="size-5" />
              </span>
              <div className="flex flex-col">
                <span className="font-semibold">{a.title}</span>
                <span className="text-sm text-muted-foreground">{a.description}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
