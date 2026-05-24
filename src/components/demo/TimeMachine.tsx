import { useMemo } from "react";

const TIMEZONES = [
  "UTC",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Europe/Madrid",
  "Europe/Athens",
  "Europe/Moscow",
  "America/New_York",
  "America/Chicago",
  "America/Los_Angeles",
  "America/Sao_Paulo",
  "Asia/Dubai",
  "Asia/Kolkata",
  "Asia/Shanghai",
  "Asia/Tokyo",
  "Australia/Sydney",
];

export type TimeMachineValue = {
  date: string; // yyyy-mm-dd
  time: string; // HH:MM
  timezone: string;
};

export function defaultTimeMachine(): TimeMachineValue {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return {
    date: `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`,
    time: `${pad(now.getHours())}:${pad(now.getMinutes())}`,
    timezone:
      (typeof Intl !== "undefined" && Intl.DateTimeFormat().resolvedOptions().timeZone) ||
      "UTC",
  };
}

export function buildIsoTimestamp(v: TimeMachineValue): string {
  // Treat the inputs as wall-clock time in the selected IANA timezone, then
  // resolve to a real UTC ISO via the timezone's current offset.
  const [y, m, d] = v.date.split("-").map(Number);
  const [hh, mm] = v.time.split(":").map(Number);
  if (!y || !m || !d) return new Date().toISOString();
  // Approximate: compute offset from a reference Date in that TZ.
  try {
    const ref = new Date(Date.UTC(y, m - 1, d, hh ?? 0, mm ?? 0));
    const tzString = ref.toLocaleString("en-US", { timeZone: v.timezone, hour12: false });
    const tzDate = new Date(tzString);
    const offsetMs = ref.getTime() - tzDate.getTime();
    return new Date(ref.getTime() + offsetMs).toISOString();
  } catch {
    return new Date(Date.UTC(y, m - 1, d, hh ?? 0, mm ?? 0)).toISOString();
  }
}

export function TimeMachine({
  value,
  onChange,
}: {
  value: TimeMachineValue;
  onChange: (v: TimeMachineValue) => void;
}) {
  const preview = useMemo(() => buildIsoTimestamp(value), [value]);

  return (
    <div className="grid grid-cols-3 gap-2">
      <label className="flex flex-col gap-1 text-xs text-slate-400">
        Date
        <input
          type="date"
          value={value.date}
          onChange={(e) => onChange({ ...value, date: e.target.value })}
          className="bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-slate-100 text-sm"
        />
      </label>
      <label className="flex flex-col gap-1 text-xs text-slate-400">
        Time
        <input
          type="time"
          value={value.time}
          onChange={(e) => onChange({ ...value, time: e.target.value })}
          className="bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-slate-100 text-sm"
        />
      </label>
      <label className="flex flex-col gap-1 text-xs text-slate-400">
        Timezone
        <select
          value={value.timezone}
          onChange={(e) => onChange({ ...value, timezone: e.target.value })}
          className="bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-slate-100 text-sm"
        >
          {TIMEZONES.includes(value.timezone) ? null : (
            <option value={value.timezone}>{value.timezone} (system)</option>
          )}
          {TIMEZONES.map((tz) => (
            <option key={tz} value={tz}>
              {tz}
            </option>
          ))}
        </select>
      </label>
      <div className="col-span-3 text-[10px] text-slate-500 font-mono break-all">
        ISO → {preview}
      </div>
    </div>
  );
}
