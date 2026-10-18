import Link from 'next/link'
import { cn } from '@/lib/utils'

export function TabLinks({ label, tabs, active }: { label: string; tabs: { href: string; label: string; id: string }[]; active: string }) {
  return (
    <nav aria-label={label} className="flex w-fit flex-wrap gap-1 rounded-2xl border bg-card p-1">
      {tabs.map((t) => (
        <Link
          key={t.id}
          href={t.href}
          scroll={false}
          aria-current={t.id === active ? 'page' : undefined}
          className={cn(
            'rounded-xl px-4 py-2 text-sm font-semibold transition-colors',
            t.id === active ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground',
          )}
        >
          {t.label}
        </Link>
      ))}
    </nav>
  )
}
