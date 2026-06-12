export interface OperationInfoForBusinessHours {
  dayOfWeek: string;
  openTime?: string;
  closeTime?: string;
  isClosed?: boolean;
}

interface BusinessStatus {
  isOpen: boolean;
  secondsUntilClose: number | null;
  closeTime?: string;
}

const DAY_SECONDS = 24 * 60 * 60;
const DAYS = [
  "SUNDAY",
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
];

function toSeconds(time?: string): number | null {
  if (!time) return null;

  const [hourText, minuteText = "0"] = time.split(":");
  const hour = Number(hourText);
  const minute = Number(minuteText);

  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return null;

  return hour * 3600 + minute * 60;
}

function getSecondsUntilTodayClose(
  info: OperationInfoForBusinessHours | undefined,
  currentSeconds: number,
): number | null {
  if (!info || info.isClosed) return null;

  const open = toSeconds(info.openTime);
  const close = toSeconds(info.closeTime);

  if (open == null || close == null) return null;
  if (open === close) return DAY_SECONDS;

  if (close > open) {
    return currentSeconds >= open && currentSeconds <= close
      ? close - currentSeconds
      : null;
  }

  return currentSeconds >= open ? DAY_SECONDS - currentSeconds + close : null;
}

function getSecondsUntilCarryoverClose(
  info: OperationInfoForBusinessHours | undefined,
  currentSeconds: number,
): number | null {
  if (!info || info.isClosed) return null;

  const open = toSeconds(info.openTime);
  const close = toSeconds(info.closeTime);

  if (open == null || close == null || open === close) return null;

  return close < open && currentSeconds <= close ? close - currentSeconds : null;
}

export function getBusinessStatus(
  operationInfoDtos: OperationInfoForBusinessHours[] | undefined,
  now = new Date(),
): BusinessStatus {
  const operations = operationInfoDtos ?? [];
  if (!operations.length) {
    return { isOpen: false, secondsUntilClose: null };
  }

  const currentDayIndex = now.getDay();
  const currentSeconds = now.getHours() * 3600 + now.getMinutes() * 60;
  const today = operations.find(
    (operation) => operation.dayOfWeek === DAYS[currentDayIndex],
  );
  const todaySecondsUntilClose = getSecondsUntilTodayClose(
    today,
    currentSeconds,
  );

  if (todaySecondsUntilClose != null) {
    return {
      isOpen: true,
      secondsUntilClose: todaySecondsUntilClose,
      closeTime: today?.closeTime,
    };
  }

  const previousDayIndex = (currentDayIndex + 6) % 7;
  const previousDay = operations.find(
    (operation) => operation.dayOfWeek === DAYS[previousDayIndex],
  );
  const carryoverSecondsUntilClose = getSecondsUntilCarryoverClose(
    previousDay,
    currentSeconds,
  );

  if (carryoverSecondsUntilClose != null) {
    return {
      isOpen: true,
      secondsUntilClose: carryoverSecondsUntilClose,
      closeTime: previousDay?.closeTime,
    };
  }

  return { isOpen: false, secondsUntilClose: null };
}
