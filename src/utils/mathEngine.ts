export interface MathEngineParams {
    quantity: number | string;
    costPriceUsd: number | string;
    exchangeRate: number | string;
    extraFeesBrl: number | string;
}

export interface MathEngineResult {
    totalUsd: number;
    finalTotalBrl: number;
    finalUnitBrl: number;
}

export function calculateImportCosts({
    quantity,
    costPriceUsd,
    exchangeRate,
    extraFeesBrl
}: MathEngineParams): MathEngineResult {
    const qtd = Number(quantity) || 0;
    const priceUsd = Number(costPriceUsd) || 0;
    const rate = Number(exchangeRate) || 0;
    const fees = Number(extraFeesBrl) || 0;

    const totalUsd = priceUsd * qtd;
    const baseBrl = totalUsd * rate;
    const finalTotalBrl = baseBrl + fees;
    const finalUnitBrl = qtd > 0 ? finalTotalBrl / qtd : 0;

    return { totalUsd, finalTotalBrl, finalUnitBrl };
}
