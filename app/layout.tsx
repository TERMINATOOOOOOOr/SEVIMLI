import type { Metadata, Viewport } from 'next'
import { Inter, Playfair_Display } from 'next/font/google'
import './globals.css'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import CartDrawer from '@/components/CartDrawer'
import PromoBar from '@/components/PromoBar'
import { LangProvider } from '@/components/LangProvider'
import AssistantFab from '@/components/assistant/AssistantFab'
import PwaRegister from '@/components/pwa/PwaRegister'
import MobileTabBar from '@/components/pwa/MobileTabBar'
import InstallPrompt from '@/components/pwa/InstallPrompt'
import { getLang } from '@/lib/lang-server'
import { isSupabaseConfigured } from '@/lib/utils'
import DemoBanner from '@/components/DemoBanner'
import { SITE_URL } from '@/lib/site'

const inter = Inter({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-inter',
  display: 'swap',
})

const playfair = Playfair_Display({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-playfair',
  weight: ['500', '600', '700', '800'],
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'SEVIMLI — экосистема для женщин Узбекистана',
    template: '%s · SEVIMLI',
  },
  description:
    'Маркетплейс и сообщество для женщин Узбекистана: проверенные магазины косметики и одежды, салоны с онлайн-записью, честные отзывы и карта лояльности. Спроси у своих — купи проверенное.',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    title: 'SEVIMLI',
    statusBarStyle: 'default',
  },
  icons: {
    icon: [{ url: '/icon-192.png', sizes: '192x192', type: 'image/png' }],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  openGraph: {
    title: 'SEVIMLI',
    description: 'Маркетплейс для женщин: проверенные магазины + живое сообщество. Спроси у своих — купи проверенное.',
    type: 'website',
  },
}

export const viewport: Viewport = {
  themeColor: '#c4507a',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const lang = await getLang()
  // Пока база не подключена (или включён флаг) — витрина честно помечена как демо.
  const demo = process.env.NEXT_PUBLIC_DEMO_MODE === '1' || !isSupabaseConfigured()
  return (
    <html lang={lang} className={`${inter.variable} ${playfair.variable}`}>
      <body className="flex min-h-screen flex-col bg-white antialiased">
        <LangProvider lang={lang}>
          {demo && <DemoBanner />}
          <PromoBar />
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
          {/* Отступ под мобильный таб-бар, чтобы он не перекрывал футер */}
          <div className="h-14 md:hidden" />
          <CartDrawer />
          <AssistantFab />
          <MobileTabBar />
          <InstallPrompt />
          <PwaRegister />
        </LangProvider>
      </body>
    </html>
  )
}
