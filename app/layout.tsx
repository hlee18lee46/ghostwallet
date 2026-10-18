import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { DM_Sans, Fredoka } from 'next/font/google'
import { Providers } from '@/components/providers/providers'
import { Navbar } from '@/components/navbar'
import { SiteFooter } from '@/components/site-footer'
import './globals.css'

const dmSans = DM_Sans({ subsets: ['latin'], variable: '--font-dm-sans' })
const fredoka = Fredoka({
  subsets: ['latin'],
  variable: '--font-fredoka',
  weight: ['500', '600', '700'],
})

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'),
  title: {
    default: "GhostWallet — Your wallet has a personality. And it's judging you.",
    template: '%s · GhostWallet',
  },
  description:
    'Analyze any public Solana wallet, discover its personality, get roasted by Boo the ghost, and mint your wallet personality as a collectible NFT.',
  generator: 'v0.app',
  openGraph: {
    title: 'GhostWallet',
    description: "Your wallet has a personality. And it's judging you.",
    images: ['/api/og?arch=degen-goblin&score=87&demo=1'],
  },
  twitter: { card: 'summary_large_image' },
  icons: {
    icon: [
      { url: '/icon-light-32x32.png', media: '(prefers-color-scheme: light)' },
      { url: '/icon-dark-32x32.png', media: '(prefers-color-scheme: dark)' },
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  colorScheme: 'dark',
  themeColor: '#0b0b16',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${dmSans.variable} ${fredoka.variable} bg-background`}>
      <body className="min-h-dvh antialiased">
        <Providers>
          <div className="flex min-h-dvh flex-col">
            <Navbar />
            <main className="flex-1">{children}</main>
            <SiteFooter />
          </div>
        </Providers>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
