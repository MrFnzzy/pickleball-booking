// Change these two numbers to change opening hours.
export const OPEN_HOUR = 6; // 6 AM
export const CLOSE_HOUR = 21; // 9 PM (last slot starts at 8 PM)
export const COURT_COUNT = 1; // bump this up if you add more courts later

export function getTimeSlots() {
  const slots = [];
  for (let h = OPEN_HOUR; h < CLOSE_HOUR; h++) {
    const start = formatHour(h);
    const end = formatHour(h + 1);
    slots.push(`${start} - ${end}`);
  }
  return slots;
}

function formatHour(h) {
  const period = h >= 12 ? 'PM' : 'AM';
  let hour12 = h % 12;
  if (hour12 === 0) hour12 = 12;
  return `${hour12}:00 ${period}`;
}

export function todayISO() {
  const d = new Date();
  const offset = d.getTimezoneOffset();
  const local = new Date(d.getTime() - offset * 60 * 1000);
  return local.toISOString().slice(0, 10);
}
