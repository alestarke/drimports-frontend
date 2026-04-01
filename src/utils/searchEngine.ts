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