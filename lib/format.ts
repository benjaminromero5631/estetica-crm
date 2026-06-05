export const formatCLP = (n: number) =>
  '$' + Math.round(n).toLocaleString('es-CL')

export const formatTrend = (current: number, previous: number) => {
  if (!previous) return null
  const pct = ((current - previous) / previous * 100).toFixed(1)
  return { value: pct, up: Number(pct) > 0 }
}
