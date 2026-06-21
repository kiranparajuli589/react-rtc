import { Geist_Mono, Inter } from "next/font/google"
import { hasLocale, NextIntlClientProvider } from "next-intl"
import {
  getMessages,
  getTranslations,
  setRequestLocale,
} from "next-intl/server"
import { notFound } from "next/navigation"

import "../globals.css"
import "@/styles/app.scss"
import { ThemeProvider } from "@/components/theme-provider"
import { TooltipProvider } from "@/components/ui/tooltip"
import { ConfirmDialogProvider } from "@/contexts/confirmDialogContext"
import { routing } from "@/i18n/routing"
import { cn } from "@/lib/utils"

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" })

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

type Props = {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params

  if (!hasLocale(routing.locales, locale)) {
    notFound()
  }

  setRequestLocale(locale)
  const messages = await getMessages()
  const t = await getTranslations({ locale, namespace: "common" })

  return (
    <html
      lang={locale}
      suppressHydrationWarning
      className={cn(
        "antialiased",
        fontMono.variable,
        "font-sans",
        inter.variable
      )}
    >
      <body>
        <NextIntlClientProvider messages={messages}>
          <ThemeProvider>
            <TooltipProvider>
              <ConfirmDialogProvider>
                <a
                  href="#recorder-main"
                  className="sr-only focus:not-sr-only focus:absolute focus:z-[200] focus:m-4 focus:rounded-md focus:bg-background focus:px-4 focus:py-2 focus:ring-2 focus:ring-ring"
                >
                  {t("skipToRecorder")}
                </a>
                {children}
              </ConfirmDialogProvider>
            </TooltipProvider>
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
