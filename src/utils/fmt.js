const CURRENCY_SYMBOL = { USD: 'US$', ARS: '$' }
const DECIMAL_CURRENCIES = new Set(['USD'])

export function fmt(n, currency) {
  if (n == null) return '—'
  const symbol = currency ? (CURRENCY_SYMBOL[currency] ?? currency + ' ') : '$'
  const decimals = DECIMAL_CURRENCIES.has(currency) ? 2 : 0
  return symbol + Number(n).toLocaleString('es-AR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
}
