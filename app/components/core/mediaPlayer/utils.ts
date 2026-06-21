import ConsoleLogger from "@/helpers/consoleLogger";

export const formatTime = (time: number): string => {
  if (time === Infinity) {
    return "--:--";
  }
  if (!isNaN(time)) {
    try {
      time = Math.floor(time);
      if (time < 60) {
        return `00:${time < 10 ? `0${time}` : time}`;
      }
      if (time < 3600) {
        const minutes = Math.floor(time / 60);
        const seconds = time % 60;
        return `${minutes < 10 ? `0${minutes}` : minutes}:${seconds < 10 ? `0${seconds}` : seconds}`;
      }
      const hours = Math.floor(time / 3600);
      const minutes = Math.floor((time % 3600) / 60);
      const seconds = time % 60;
      return `${hours < 10 ? `0${hours}` : hours}:${minutes < 10 ? `0${minutes}` : minutes}:${seconds < 10 ? `0${seconds}` : seconds}`;
    } catch (error) {
      ConsoleLogger.error(error);
      return "--:--";
    }
  }
  return "--:--";
};
