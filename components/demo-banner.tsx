import { Info } from 'lucide-react'

export function DemoBanner({ children }: { children: React.ReactNode }) {
  return (
    <p className="flex items-start gap-2 rounded-2xl border border-dashed border-warning/50 bg-warning/10 p-4 text-sm leading-relaxed">
      <Info className="mt-0.5 size-4 shrink-0 text-warning" />
      <span>{children}</span>
    </p>
  )
}
