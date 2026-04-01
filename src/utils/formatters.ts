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