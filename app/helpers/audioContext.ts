/** Resolves the (possibly vendor-prefixed) AudioContext constructor. Browser-only. */
export const getAudioContextClass = (): typeof AudioContext =>
  window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
