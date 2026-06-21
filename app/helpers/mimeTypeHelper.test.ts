import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  extensionFromMimeType,
  getMimeDictionary,
  getMostSuitableMimeType,
  resetMimeDictionaryCache,
} from "@/helpers/mimeTypeHelper";

describe("mimeTypeHelper", () => {
  beforeEach(() => {
    resetMimeDictionaryCache();
    vi.stubGlobal("MediaRecorder", {
      isTypeSupported: (type: string) =>
        ["video/webm;codecs=vp8", "audio/webm;codecs=opus", "video/webm", "audio/webm"].includes(type),
    });
  });

  it("derives extensions from mime types", () => {
    expect(extensionFromMimeType("video/webm;codecs=vp8")).toBe("webm");
    expect(extensionFromMimeType("audio/webm;codecs=opus")).toBe("webm");
    expect(extensionFromMimeType(null)).toBe("");
  });

  it("selects preferred mime types", () => {
    const supported = ["video/webm", "video/webm;codecs=vp8"];
    expect(getMostSuitableMimeType(supported, "video")).toBe("video/webm;codecs=vp8");
  });

  it("maps video and audio extensions separately", () => {
    const dict = getMimeDictionary();
    expect(dict.VIDEO.fileExtension).toBe("webm");
    expect(dict.AUDIO.fileExtension).toBe("webm");
    expect(dict.VIDEO.mimeType).toContain("video/");
    expect(dict.AUDIO.mimeType).toContain("audio/");
  });
});
