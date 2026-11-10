const formatter = new Intl.NumberFormat('fr-TN', { style: 'currency', currency: 'TND', currencyDisplay: 'code' });

export function formatPrice(value: number | null | undefined): string {
  return value === null || value === undefined ? '—' : formatter.format(value);
}

export function formatOfferPrice(value: string): string {
  const price = value.replace(/(?:€|EUR)\s*(\d+(?:[.,]\d+)?)/gi, '$1 TND').replace(/€/g, 'TND').replace(/\bEUR\b/gi, 'TND').replace(/\s+/g, ' ').trim();
  return /^\d+(?:[.,]\d+)?$/.test(price) ? `${price} TND` : price;
}
