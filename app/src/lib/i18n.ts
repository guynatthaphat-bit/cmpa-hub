import { getRequestConfig } from 'next-intl/server'
import { cookies } from 'next/headers'

export const SUPPORTED_LOCALES = ['th-TH', 'en-US'] as const
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number]
export const DEFAULT_LOCALE: SupportedLocale = 'th-TH'

export default getRequestConfig(async () => {
  const cookieStore = cookies()
  const cookieLocale = cookieStore.get('NEXT_LOCALE')?.value
  const locale: SupportedLocale =
    cookieLocale && SUPPORTED_LOCALES.includes(cookieLocale as SupportedLocale)
      ? (cookieLocale as SupportedLocale)
      : DEFAULT_LOCALE

  const fileName = locale === 'th-TH' ? 'th' : 'en'
  const messages = (await import(`@/messages/${fileName}.json`)).default

  return {
    locale,
    messages,
    timeZone: 'Asia/Bangkok',
    now: new Date(),
  }
})
