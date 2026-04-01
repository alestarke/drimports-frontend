import { describe, it, expect } from 'vitest';
import { filterProducts } from './searchEngine';

describe('Filtro de Busca à Prova de Falhas', () => {
  const mockProducts = [
    { id: 1, name: 'iPhone 13 Pro' },
    { id: 2, name: 'Televisão 4K Samsung' },
    { id: 3, name: 'Maçã Fuji 1kg' }
  ];

  it('Deve ignorar maiúsculas/minúsculas e acentuação', () => {
    // Buscando com letras minúsculas e sem acento
    const result1 = filterProducts(mockProducts, 'televisao');
    expect(result1).toHaveLength(1);
    expect(result1[0].name).toBe('Televisão 4K Samsung');

    // Buscando maçã
    const result2 = filterProducts(mockProducts, 'maca');
    expect(result2).toHaveLength(1);
    expect(result2[0].name).toBe('Maçã Fuji 1kg');

    // Buscando com acento um termo que ja está em português
    const result3 = filterProducts(mockProducts, 'IPHONE');
    expect(result3).toHaveLength(1);
    expect(result3[0].name).toBe('iPhone 13 Pro');
  });

  it('Deve retornar todos os produtos se a pesquisa for vazia', () => {
    const result = filterProducts(mockProducts, '');
    expect(result).toHaveLength(3);
  });

  it('Deve retornar array vazio caso não ache nada', () => {
    const result = filterProducts(mockProducts, 'geladeira');
    expect(result).toHaveLength(0);
  });
});
