import { setRequestLocale } from "next-intl/server";

import { RecordingProvider } from "@/contexts/recordingContext";
import { Toaster } from "@/components/ui/sonner";
import RecorderErrorBoundary from "@/core/RecorderErrorBoundary";
import RecorderMenu from "@/features/recorderMenu";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function Page({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <RecordingProvider>
      <RecorderErrorBoundary>
        <RecorderMenu />
      </RecorderErrorBoundary>
      <Toaster />
    </RecordingProvider>
  );
}
