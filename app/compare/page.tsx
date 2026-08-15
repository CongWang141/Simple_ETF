import { EtfComparison } from "@/components/compare/EtfComparison";
import { getHistoricalObservations, getHistoricalValuations, listEtfs } from "@/lib/etfs";

export default async function ComparePage({ searchParams }: { searchParams: Promise<{ symbols?: string }> }) {
  const etfs = listEtfs();
  const histories = Object.fromEntries(etfs.map((etf) => [etf.symbol, getHistoricalObservations(etf.symbol)]));
  const valuationHistories = Object.fromEntries(etfs.map((etf) => [etf.symbol, getHistoricalValuations(etf.symbol)]));
  const { symbols } = await searchParams;
  const allowedSymbols = new Set(etfs.map((etf) => etf.symbol));
  const initialSelectedSymbols = symbols?.split(",").filter((symbol, index, values) => allowedSymbols.has(symbol) && values.indexOf(symbol) === index).slice(0, 8);
  return <EtfComparison etfs={etfs} histories={histories} initialSelectedSymbols={initialSelectedSymbols} valuationHistories={valuationHistories} />;
}
