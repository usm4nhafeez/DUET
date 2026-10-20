export const fmtMoney = (n: number): string => {
  const v = Math.abs(n);
  const hasCents = Math.round(v * 100) % 100 !== 0;
  return 'Rs ' + v.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: hasCents ? 2 : 0,
  });
};

export const fmtNum = (n: number): string => {
  const v = Math.abs(n);
  const hasCents = Math.round(v * 100) % 100 !== 0;
  return v.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: hasCents ? 2 : 0,
  });
};

export const WEEKDAYS_SHORT = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
export const WEEKDAYS_LONG = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
export const MONTHS_SHORT = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

export const pad2 = (n: number) => String(n).padStart(2, '0');

/** "FRI · 21 FEB 2026" */
export const fmtDateChip = (d: Date): string =>
  `${WEEKDAYS_SHORT[d.getDay()]} · ${pad2(d.getDate())} ${MONTHS_SHORT[d.getMonth()]} ${d.getFullYear()}`;

/** "21:47:08" */
export const fmtTime = (d: Date): string =>
  `${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`;

/** "21:47" */
export const fmtTimeShort = (iso: string): string => {
  const d = new Date(iso);
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
};

/** "Friday — 21 Feb" for history group headers */
export const fmtDayHeader = (iso: string): string => {
  const d = new Date(iso);
  return `${WEEKDAYS_LONG[d.getDay()]} — ${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}`;
};

/** "today" / "yesterday" / "21 feb" */
export const fmtRelativeDay = (iso: string): string => {
  const d = new Date(iso);
  const today = new Date();
  const start = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diff = Math.round((start(today) - start(d)) / 86400000);
  if (diff === 0) return 'today';
  if (diff === 1) return 'yesterday';
  return `${d.getDate()} ${MONTHS_SHORT[d.getMonth()].toLowerCase()}`;
};

export const dayKey = (iso: string): string => {
  const d = new Date(iso);
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
};

/** value for a datetime-local input */
export const toLocalInputValue = (d: Date): string =>
  `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}T${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
