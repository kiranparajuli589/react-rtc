export function isMobile(): boolean {
  const userAgent = typeof window !== "undefined" ? navigator.userAgent : "";
  const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
  return mobileRegex.test(userAgent);
}

export function isIOS(): boolean {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

export const BrowserDictionary = {
  Opera: "Opera",
  OPR: "Opera",
  Edge: "Edge",
  Chrome: "Chrome",
  Safari: "Safari",
  Firefox: "Firefox",
  MSIE: "IE",
  Unknown: "Unknown",
} as const;

export type BrowserName = (typeof BrowserDictionary)[keyof typeof BrowserDictionary];

export function getBrowserName(): BrowserName {
  if ((navigator.userAgent.indexOf("Opera") || navigator.userAgent.indexOf("OPR")) !== -1) {
    return BrowserDictionary.Opera;
  } else if (navigator.userAgent.indexOf("Edg") !== -1) {
    return BrowserDictionary.Edge;
  } else if (navigator.userAgent.indexOf("Chrome") !== -1) {
    return BrowserDictionary.Chrome;
  } else if (navigator.userAgent.indexOf("Safari") !== -1) {
    return BrowserDictionary.Safari;
  } else if (navigator.userAgent.indexOf("Firefox") !== -1) {
    return BrowserDictionary.Firefox;
  } else if (navigator.userAgent.indexOf("MSIE") !== -1 || "documentMode" in document) {
    return BrowserDictionary.MSIE;
  } else {
    return BrowserDictionary.Unknown;
  }
}
