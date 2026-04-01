export const generateSlug = (text: string): string => {
  if (!text) return '';
  return text
    .toLowerCase()
    .normalize('NFD') // Remove accents
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '-') // Replace spaces with dashes
    .replace(/[^\w-]+/g, '') // Remove all non-word characters
    .replace(/--+/g, '-') // Replace multiple dashes with a single one
    .replace(/^-+/, '') // Trim dashes from start
    .replace(/-+$/, ''); // Trim dashes from end
};
