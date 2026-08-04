const CURRENCY_SYMBOL = { USD: 'US$', ARS: '$' }

export function fmt(n, currency) {
  if (n == null) return '—'
  const symbol = currency ? (CURRENCY_SYMBOL[currency] ?? currency + ' ') : '$'
  return symbol + Number(n).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
