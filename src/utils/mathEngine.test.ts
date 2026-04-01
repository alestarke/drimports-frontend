import { describe, it, expect } from 'vitest';
import { calculateImportCosts } from './mathEngine';

describe('mathEngine - calculateImportCosts', () => {
  it('should calculate correctly with zero fees', () => {
    const result = calculateImportCosts({
      quantity: 10,
      costPriceUsd: 5,
      exchangeRate: 5.5,
      extraFeesBrl: 0
    });

    expect(result.totalUsd).toBe(50); // 10 * 5
    expect(result.finalTotalBrl).toBe(275); // 50 * 5.5
    expect(result.finalUnitBrl).toBe(27.5); // 275 / 10
  });

  it('should calculate correctly with fees', () => {
    const result = calculateImportCosts({
      quantity: 5,
      costPriceUsd: 10,
      exchangeRate: 5,
      extraFeesBrl: 50
    });

    expect(result.totalUsd).toBe(50); // 5 * 10
    expect(result.finalTotalBrl).toBe(300); // 50 * 5 + 50
    expect(result.finalUnitBrl).toBe(60); // 300 / 5
  });

  it('should handle zero quantity without dividing by zero error', () => {
    const result = calculateImportCosts({
      quantity: 0,
      costPriceUsd: 10,
      exchangeRate: 5,
      extraFeesBrl: 50
    });

    expect(result.totalUsd).toBe(0);
    expect(result.finalTotalBrl).toBe(50); // 0 * 5 + 50
    expect(result.finalUnitBrl).toBe(0); // quantity is 0 -> 0
  });

  it('should handle string inputs correctly', () => {
    const result = calculateImportCosts({
      quantity: '2',
      costPriceUsd: '20.5',
      exchangeRate: '5',
      extraFeesBrl: '10'
    });

    expect(result.totalUsd).toBe(41); // 2 * 20.5
    expect(result.finalTotalBrl).toBe(215); // 41 * 5 + 10
    expect(result.finalUnitBrl).toBe(107.5); // 215 / 2
  });

  it('should handle invalid string inputs as zeros', () => {
    const result = calculateImportCosts({
      quantity: 'invalid',
      costPriceUsd: 'invalid',
      exchangeRate: 'invalid',
      extraFeesBrl: 'invalid'
    });

    expect(result.totalUsd).toBe(0);
    expect(result.finalTotalBrl).toBe(0);
    expect(result.finalUnitBrl).toBe(0);
  });
});
