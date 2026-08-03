export function filterProducts<T extends { name: string }>(productsList: T[], searchTerm: string): T[] {
  if (!searchTerm) {
    return productsList;
  }

  // Helper to remove accents/diacritics
  const normalizeText = (text: string) => 
    text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

  const normalizedSearch = normalizeText(searchTerm);

  return productsList.filter((product) =>
    normalizeText(product.name).includes(normalizedSearch)
  );
}

export function sortProducts<T extends { name: string; stock_quantity?: number }>(productsList: T[]): T[] {
  return [...productsList].sort((a, b) => {
    const hasStockA = (a.stock_quantity ?? 0) > 0 ? 1 : 0;
    const hasStockB = (b.stock_quantity ?? 0) > 0 ? 1 : 0;

    if (hasStockA !== hasStockB) {
      return hasStockB - hasStockA;
    }

    return (a.name || '').localeCompare(b.name || '', 'pt-BR', { sensitivity: 'base' });
  });
}