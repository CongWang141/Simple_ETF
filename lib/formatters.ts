export const formatPercent = (value: number) => `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
export const formatTer = (value: number) => `${value.toFixed(2)}%`;
export const formatFundSize = (value: number) => `$${value.toLocaleString()}m`;
