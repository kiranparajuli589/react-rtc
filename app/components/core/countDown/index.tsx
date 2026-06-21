"use client";

import { useEffect } from "react";

import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";

type CountdownTimerProps = {
  count: number;
  onCancelStart: () => void;
  className?: string;
};

/** Inline overlay countdown — fits inside the preview card (not a portal dialog). */
const CountdownTimer = ({ count, onCancelStart, className = "" }: CountdownTimerProps) => {
  const t = useTranslations("countdown");

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onCancelStart();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onCancelStart]);

  if (count <= 0) {
    return null;
  }

  return (
    <div
      className={`countdown countdown--overlay ${className}`}
      role="alertdialog"
      aria-live="assertive"
      aria-atomic="true"
      aria-label={t("startsInAria", { count })}
    >
      <div className="countdown__backdrop" aria-hidden="true" />
      <div className="countdown__panel">
        <p className="countdown__sr-only">{t("title")}</p>
        <p className="countdown__sr-only">{t("description")}</p>

        <div className="countdown__digits" aria-hidden="true">
          {[3, 2, 1].map((number) => (
            <span key={number} className={`countdown__digit ${count === number ? "fade-in" : "fade-out"}`}>
              {count === number ? number : ""}
            </span>
          ))}
        </div>

        <p className="countdown__message">{t("startsIn", { count })}</p>
        <Button type="button" variant="outline" size="sm" className="countdown__cancel" onClick={onCancelStart}>
          {t("cancel")}
        </Button>
      </div>
    </div>
  );
};

export default CountdownTimer;
