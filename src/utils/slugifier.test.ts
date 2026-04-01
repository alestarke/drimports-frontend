import { describe, it, expect } from 'vitest';
import { generateSlug } from './slugifier';

describe('generateSlug', () => {
  it('deve converter strings simples para lowercase', () => {
    expect(generateSlug('Produto Simples')).toBe('produto-simples');
  });

  it('deve remover acentos e caracteres especiais com precisão', () => {
    expect(generateSlug('Açúcar, Café & Chá!')).toBe('acucar-cafe-cha');
  });

  it('deve lidar corretamente com espaços múltiplos', () => {
    expect(generateSlug('Isso   tem    muitos espaços')).toBe('isso-tem-muitos-espacos');
  });

  it('deve remover caracteres especiais não-alfanuméricos', () => {
    expect(generateSlug('iPhone 15 Pro Max (256GB) - Azul Titânio')).toBe('iphone-15-pro-max-256gb-azul-titanio');
  });

  it('deve lidar com strings contendo números', () => {
    expect(generateSlug('Motor V8')).toBe('motor-v8');
  });

  it('deve lidar com hifens já existentes sem duplicá-los', () => {
    expect(generateSlug('Cabo Tipo-C para Tipo-C')).toBe('cabo-tipo-c-para-tipo-c');
  });

  it('deve retornar string vazia caso seja passado algo nulo ou indefinido', () => {
    // Simulando chamada onde JS passaria undef, apesar do TS reclamar se testar direto.
    // @ts-ignore
    expect(generateSlug(undefined)).toBe('');
    // @ts-ignore
    expect(generateSlug(null)).toBe('');
    expect(generateSlug('')).toBe('');
  });

  it('deve remover hifens indesejados no início ou final da string', () => {
    expect(generateSlug(' -Mesa de Madeira- ')).toBe('mesa-de-madeira');
  });
});
