import { describe, it, expect } from 'vitest';
import { validateStock } from './validators';

describe('validateStock', () => {
  it('Cenário A: Tentar vender 5 unidades tendo 10 no estoque (Deve passar)', () => {
    expect(validateStock(5, 10)).toBe(true);
  });

  it('Cenário B: Tentar vender 10 unidades tendo 2 (Deve bloquear)', () => {
    expect(validateStock(10, 2)).toBe(false);
  });

  it('Cenário C: Tentar vender 0 ou valores negativos (Deve bloquear)', () => {
    expect(validateStock(0, 5)).toBe(false);
    expect(validateStock(-3, 5)).toBe(false);
  });

  it('Deve passar se vender exatamente o mesmo tanto que tem', () => {
    expect(validateStock(5, 5)).toBe(true);
  });
});
