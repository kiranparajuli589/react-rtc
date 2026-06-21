"use client";

import { Circle } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import type { RecordingType } from "@/constants/recordingTypes";
import { RecordingMenuOptions } from "@/constants/recording";
import { useRecording } from "@/contexts/recordingContext";
import { BackButton, RecorderActionButton } from "@/features/recorderMenu/buttonItems";
import RecordingActions from "@/features/recorderMenu/recordingActions";
import RecorderModePanel from "@/features/recorderMenu/recorderModePanel";
import { LanguageToggle } from "@/components/language-toggle";
import { ThemeToggle } from "@/components/theme-toggle";
import { useRouter } from "@/i18n/navigation";
import { isMobile } from "@/helpers/browserHelper";
import type { DevicesList, RecorderSettings, RecordingMenuOption } from "@/types/recording";

export default function RecorderMenu() {
  const tMenu = useTranslations("menu");
  const tOptions = useTranslations("recordingOptions");
  const tCommon = useTranslations("common");
  const tPermissions = useTranslations("permissions");
  const { recordingData } = useRecording();
  const [selectedRecordingOption, setSelectedRecordingOption] = useState<RecordingType | null>(() => recordingData?.type ?? null);
  const [selectedAudioDevice, setSelectedAudioDevice] = useState<string | null>(null);
  const [selectedVideoDevice, setSelectedVideoDevice] = useState<string | null>(null);
  const [devicesList, setDevicesList] = useState<DevicesList>({ audioDevices: [], videoDevices: [] });

  const [muteAudio] = useState(false);
  const [isMicDisabled, setIsMicDisabled] = useState(false);
  const [isCameraDisabled, setIsCameraDisabled] = useState(false);
  const [recorderSettings, setRecorderSettings] = useState<RecorderSettings>({
    countDown: true,
    mirror: true,
  });
  const [isRequestingPermissions, setIsRequestingPermissions] = useState(false);

  const getMenuOption = ({ option, disabled = false }: { option: RecordingMenuOption; disabled?: boolean }) => {
    const OptionIcon = disabled ? option.disabledIcon : option.icon;
    const title = tOptions(`${option.messageKey}.title`);
    const subtitle = tOptions(`${option.messageKey}.subtitle`);

    return (
      <button
        className={"recorder_menu__options__item"}
        disabled={disabled}
        onClick={() => {
          setSelectedRecordingOption(option.type);
        }}
        title={subtitle}
        aria-label={tOptions("recordAria", { title, subtitle })}
        aria-describedby={`option-desc-${option.type}`}
      >
        <div className="recorder_menu__options__item__image">
          <OptionIcon size={64} strokeWidth={1.5} aria-hidden="true" />
        </div>

        <div className="recorder_menu__options__item__info">
          <p className={"recorder_menu__options__item__title"}>{title}</p>
          <p id={`option-desc-${option.type}`} className="sr-only">
            {subtitle}
          </p>
        </div>
      </button>
    );
  };

  const router = useRouter();

  useEffect(() => {
    if (!selectedRecordingOption) {
      document.title = tMenu("documentTitle");
    }
  }, [selectedRecordingOption, tMenu]);

  return (
    <>
      <div className={"recorder_menu"} id="recorder-main">
          {!selectedRecordingOption ? (
            <>
              <div className="recorder_menu__toolbar max-w-[780px] mx-auto">
                <BackButton onClick={() => router.back()} />

                <div className="recorder_menu__toolbar__actions">
                  <LanguageToggle />
                  <ThemeToggle />
                  <div className="hide-on-mobile">
                    <RecorderActionButton
                      icon={Circle}
                      label={tCommon("record")}
                      disabled
                      className="start_recording_button"
                      onClick={() => {}}
                    />
                  </div>
                </div>
              </div>

              <div className={"recorder_menu__container"}>
                <h1>{tMenu("title")}</h1>

                <p className={"recorder_menu__container__subtitle"}>{tMenu("subtitle")}</p>
                <div className="recorder_menu__options">
                  {getMenuOption({
                    option: RecordingMenuOptions.Camera,
                    disabled: isCameraDisabled,
                  })}
                  {getMenuOption({
                    option: RecordingMenuOptions.Audio,
                    disabled: isMicDisabled,
                  })}
                  {!isMobile() &&
                    getMenuOption({
                      option: RecordingMenuOptions.Screen,
                    })}
                  {!isMobile() &&
                    getMenuOption({
                      option: RecordingMenuOptions.ScreenVideo,
                      disabled: isCameraDisabled || isMobile(),
                    })}
                </div>
                <p className="recorder_menu__privacy mt-8 mb-4 text-center text-xs text-muted-foreground">
                  {tMenu("privacy")}
                </p>
                {isMobile() && (
                  <p className="recorder_menu__desktop-only mb-4 text-center text-xs text-muted-foreground">
                    {tMenu("desktopOnlyScreen")}
                  </p>
                )}
              </div>

              <div className={`recorder_menu__enumerating ${isRequestingPermissions ? "show" : "hide"}`}>
                <div className={"recorder_menu__enumerating__container"}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={"/images/svg/perms_allow.svg"} alt={tPermissions("requestingAlt")} />

                  <br />
                  <div className="infobox">
                    <p className={"title"}>
                      {tPermissions.rich("clickAllow", {
                        allow: (chunks) => <span>{chunks}</span>,
                      })}
                    </p>
                    <p className={"subtitle"}>{tPermissions("enumerating")}</p>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <RecorderModePanel
              type={selectedRecordingOption}
              selectedAudioDevice={selectedAudioDevice}
              selectedVideoDevice={selectedVideoDevice}
              muteAudio={muteAudio}
              isMicDisabled={isMicDisabled}
              setSelectedRecordingOption={setSelectedRecordingOption}
              recorderSettings={recorderSettings}
              devicesList={devicesList}
            />
          )}

          <RecordingActions
            disabled={selectedRecordingOption}
            selectedAudioDevice={selectedAudioDevice}
            selectedVideoDevice={selectedVideoDevice}
            setSelectedAudioDevice={setSelectedAudioDevice}
            setSelectedVideoDevice={setSelectedVideoDevice}
            setIsMicDisabled={setIsMicDisabled}
            setIsCameraDisabled={setIsCameraDisabled}
            setRecorderSettings={setRecorderSettings}
            setIsRequestingPermissions={setIsRequestingPermissions}
            selectedRecordingOption={selectedRecordingOption}
            setDevicesList={setDevicesList}
          />
      </div>
    </>
  );
}
