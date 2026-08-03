export function formatBRL(val: number | string): string {
  const numberVal = Number(val);
  if (isNaN(numberVal)) return 'R$ 0,00';
  
  return new Intl.NumberFormat('pt-BR', { 
    style: 'currency', 
    currency: 'BRL' 
  }).format(numberVal);
}

export function formatUSD(val: number | string): string {
  const numberVal = Number(val);
  if (isNaN(numberVal)) return 'US$ 0.00';
  
  return new Intl.NumberFormat('en-US', { 
    style: 'currency', 
    currency: 'USD' 
  }).format(numberVal);
}

export function slugify(text: string): string {
  if (!text) return '';
  return text
    .toString()
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-');
}