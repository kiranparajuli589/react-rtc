"use client";

import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";

export default function RecorderErrorFallback() {
  const t = useTranslations("errors");

  return (
    <div className="mx-auto flex min-h-[50vh] max-w-lg flex-col items-center justify-center gap-4 p-8 text-center">
      <h1 className="text-xl font-semibold">{t("boundaryTitle")}</h1>
      <p className="text-sm text-muted-foreground">{t("boundaryDescription")}</p>
      <Button type="button" onClick={() => window.location.reload()}>
        {t("reload")}
      </Button>
    </div>
  );
}
