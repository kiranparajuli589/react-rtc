"use client"

import { Check, Languages } from "lucide-react"
import { useLocale, useTranslations } from "next-intl"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { routing, type AppLocale } from "@/i18n/routing"
import { usePathname, useRouter } from "@/i18n/navigation"
import { cn } from "@/lib/utils"

const localeLabels: Record<AppLocale, string> = {
  en: "English",
  ne: "नेपाली",
  hi: "हिन्दी",
  es: "Español",
  fr: "Français",
  de: "Deutsch",
  zh: "中文",
}

type LanguageToggleProps = {
  className?: string
}

export function LanguageToggle({ className }: LanguageToggleProps) {
  const t = useTranslations("language")
  const locale = useLocale() as AppLocale
  const router = useRouter()
  const pathname = usePathname()
  const activeLocale = localeLabels[locale]

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          className={cn("recorder_menu__toolbar__language-toggle", className)}
          aria-label={t("toggle")}
        >
          <Languages className="mr-2 size-5!" />
          <span>{activeLocale}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {routing.locales.map((nextLocale) => (
          <DropdownMenuItem
            key={nextLocale}
            className={cn(locale === nextLocale && "bg-accent")}
            onClick={() => router.replace(pathname, { locale: nextLocale })}
          >
            <Check
              className={cn(
                "size-4",
                locale === nextLocale ? "opacity-100" : "opacity-0"
              )}
              aria-hidden="true"
            />
            {localeLabels[nextLocale]}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
