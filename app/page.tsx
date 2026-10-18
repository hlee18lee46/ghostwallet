import { ArchetypeShowcase } from '@/components/home/archetype-showcase'
import { Hero } from '@/components/home/hero'
import { HowItWorks } from '@/components/home/how-it-works'

export default function HomePage() {
  return (
    <>
      <Hero />
      <HowItWorks />
      <ArchetypeShowcase />
    </>
  )
}
