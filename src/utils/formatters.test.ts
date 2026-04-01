import { describe, it, expect } from 'vitest';
import { formatBRL, formatUSD } from './formatters';

describe('Formatadores de Moeda', () => {
  describe('formatBRL', () => {
    it('Verificar se o número 1500.5 é convertido exatamente', () => {
      // Intl format com pt-BR pode gerar 1 non-breaking space em alguns ambientes.
      // E é importante verificar se tem o R$ e a formatação R$ 1.500,50 ou R$ 1.500,50
      const formatted = formatBRL(1500.5);
      
      // We do a regex check just to be safe across environments (node vs browser spacing)
      expect(formatted.replace(/\s|\u00a0/g, ' ')).toBe('R$ 1.500,50');
    });

    it('Verificar se valores zerados (0) não quebram a função', () => {
      const formatted = formatBRL(0);
      expect(formatted.replace(/\s|\u00a0/g, ' ')).toBe('R$ 0,00');
    });

    it('Deve tratar null / string inválidas e retornar zero', () => {
      const formatted = formatBRL('abc');
      expect(formatted.replace(/\s|\u00a0/g, ' ')).toBe('R$ 0,00');
    });
  });

  describe('formatUSD', () => {
    it('Verificar conversão de número grande em inglês', () => {
      const formatted = formatUSD(1500.5);
      expect(formatted).toBe('$1,500.50');
    });
  });
});
