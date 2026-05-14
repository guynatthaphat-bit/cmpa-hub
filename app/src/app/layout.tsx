import type { Metadata, Viewport } from 'next'
import { Inter, Noto_Sans_Thai, Noto_Serif_Thai } from 'next/font/google'
import { NextIntlClientProvider } from 'next-intl'
import { getLocale, getMessages } from 'next-intl/server'
import { Toaster } from 'sonner'
import { ThemeProvider } from '@/components/shared/theme-provider'
import { QueryProvider } from '@/components/shared/query-provider'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

const notoThai = Noto_Sans_Thai({
  subsets: ['thai'],
  display: 'swap',
  weight: ['400', '500', '600', '700'],
  variable: '--font-noto-thai',
})

const notoSerifThai = Noto_Serif_Thai({
  subsets: ['thai'],
  display: 'swap',
  weight: ['500', '700'],
  variable: '--font-noto-serif-thai',
})

export const metadata: Metadata = {
  title: {
    default: 'CMPA Hub',
    template: '%s · CMPA Hub',
  },
  description: 'ระบบจัดการบุคลากรและปฏิบัติการ — สมาคมสร้างเสริมอาชีพคนพิการภาคตะวันออก',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'CMPA Hub',
  },
  icons: {
    icon: '/icons/icon-192.png',
    apple: '/icons/icon-192.png',
  },
  formatDetection: { telephone: false },
  other: {
    'mobile-web-app-capable': 'yes',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f7f5ef' },
    { media: '(prefers-color-scheme: dark)', color: '#111c22' },
  ],
  viewportFit: 'cover',
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale()
  const messages = await getMessages()

  return (
    <html
      lang={locale === 'th-TH' ? 'th' : 'en'}
      suppressHydrationWarning
      className={`${inter.variable} ${notoThai.variable} ${notoSerifThai.variable}`}
    >
      <body className="min-h-dvh bg-background font-sans">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <NextIntlClientProvider locale={locale} messages={messages} timeZone="Asia/Bangkok">
            <QueryProvider>
              {children}
              <Toaster
                position="top-center"
                richColors
                closeButton
                toastOptions={{
                  classNames: {
                    toast: 'font-sans',
                  },
                }}
              />
            </QueryProvider>
          </NextIntlClientProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
