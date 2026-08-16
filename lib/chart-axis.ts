export type NumericAxis = { domain: [number, number]; ticks: number[]; step: number };

function niceStep(value: number) {
  const exponent = Math.floor(Math.log10(value));
  const fraction = value / (10 ** exponent);
  const multiplier = fraction <= 1 ? 1 : fraction <= 2 ? 2 : fraction <= 5 ? 5 : 10;
  return multiplier * (10 ** exponent);
}

export function getNiceNumericAxis(values: number[], targetTickCount = 6): NumericAxis {
  const finite = values.filter(Number.isFinite);
  if (!finite.length) return { domain: [0, 1], ticks: [0, 0.2, 0.4, 0.6, 0.8, 1], step: 0.2 };
  const minimum = Math.min(...finite);
  const maximum = Math.max(...finite);
  const range = maximum - minimum || Math.max(Math.abs(maximum) * 0.1, 1);
  const step = niceStep(range / Math.max(1, targetTickCount - 1));
  const lower = Math.floor(minimum / step) * step;
  const upper = Math.ceil(maximum / step) * step;
  const ticks: number[] = [];
  for (let tick = lower; tick <= upper + step / 1_000; tick += step) ticks.push(Number(tick.toPrecision(12)));
  return { domain: [lower, upper], ticks, step };
}

type DateInterval = { unit: "day" | "month" | "year"; amount: number };

function intervalForDays(days: number): DateInterval {
  if (days <= 21) return { unit: "day", amount: 2 };
  if (days <= 60) return { unit: "day", amount: 5 };
  if (days <= 150) return { unit: "day", amount: 10 };
  if (days <= 365) return { unit: "month", amount: 1 };
  if (days <= 730) return { unit: "month", amount: 2 };
  if (days <= 1_825) return { unit: "month", amount: 6 };
  if (days <= 3_650) return { unit: "year", amount: 1 };
  return { unit: "year", amount: 2 };
}

function addInterval(current: Date, interval: DateInterval) {
  const next = new Date(current);
  if (interval.unit === "day") next.setUTCDate(next.getUTCDate() + interval.amount);
  if (interval.unit === "month") next.setUTCMonth(next.getUTCMonth() + interval.amount, 1);
  if (interval.unit === "year") next.setUTCFullYear(next.getUTCFullYear() + interval.amount, 0, 1);
  return next;
}

function isoDate(value: Date) {
  return value.toISOString().slice(0, 10);
}

export function getCalendarDateTicks(dates: string[]) {
  if (dates.length < 2) return dates;
  const first = new Date(`${dates[0]}T00:00:00Z`);
  const last = new Date(`${dates.at(-1)}T00:00:00Z`);
  const days = Math.max(1, Math.round((last.getTime() - first.getTime()) / 86_400_000));
  const interval = intervalForDays(days);
  const ticks = [dates[0]];
  let target = addInterval(first, interval);
  let searchStart = 1;
  while (target < last) {
    const targetDate = isoDate(target);
    while (searchStart < dates.length && dates[searchStart] < targetDate) searchStart += 1;
    if (searchStart >= dates.length - 1) break;
    const candidate = dates[searchStart];
    if (candidate !== ticks.at(-1)) ticks.push(candidate);
    target = addInterval(target, interval);
  }
  if (ticks.at(-1) !== dates.at(-1)) ticks.push(dates.at(-1)!);
  return ticks;
}
