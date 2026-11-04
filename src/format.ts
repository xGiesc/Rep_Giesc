/** 90 → "1:30", 45 → "0:45" */
export const fmtTime = (totalSeconds: number) => {
  const s = Math.max(0, Math.round(totalSeconds));
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, '0')}`;
};

/** 90 → "1 min 30 s", 60 → "1 min", 45 → "45 s", 0 → "nessuno" */
export const fmtRest = (seconds: number) => {
  if (seconds <= 0) return 'nessuno';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m === 0) return `${s} s`;
  return s === 0 ? `${m} min` : `${m} min ${s} s`;
};
