export const validateStock = (requested: number, available: number): boolean => {
  if (requested <= 0) return false;
  if (requested > available) return false;
  return true;
};