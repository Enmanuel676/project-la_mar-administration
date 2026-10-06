import { CURRENCIES } from '../../lib/api'

const numberFmt = new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 })

export default function Money({ article }) {
  const currency = CURRENCIES[article.currency] ? article.currency : 'USD'
  return (
    <>
      ${numberFmt.format(article.price || 0)}{' '}
      <span className="currency-tag">{currency}</span>
    </>
  )
}
