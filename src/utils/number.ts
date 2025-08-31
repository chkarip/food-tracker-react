export const fmt1 = (v?: number) => {
  if (v === undefined || v === null || Number.isNaN(v)) return '0.0';
  const n = Math.max(0, v);
  return n.toFixed(1);
};
