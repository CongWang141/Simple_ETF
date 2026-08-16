import { EtfComparison } from "@/components/compare/EtfComparison";
import { getHistoricalObservations, getHistoricalValuations, listEtfs } from "@/lib/etfs";

export default async function ComparePage({ searchParams }: { searchParams: Promise<{ symbols?: string }> }) {
  const etfs = listEtfs();
  const { symbols } = await searchParams;
  const allowedSymbols = new Set(etfs.map((etf) => etf.symbol));
  const initialSelectedSymbols = symbols?.split(",").filter((symbol, index, values) => allowedSymbols.has(symbol) && values.indexOf(symbol) === index).slice(0, 8) ?? [];
  const selectedSymbols = initialSelectedSymbols.length ? initialSelectedSymbols : ["USST01", "USST02"];
  const histories = Object.fromEntries(selectedSymbols.map((symbol) => [symbol, getHistoricalObservations(symbol)]));
  const valuationHistories = Object.fromEntries(selectedSymbols.map((symbol) => [symbol, getHistoricalValuations(symbol)]));
  return <EtfComparison etfs={etfs} histories={histories} initialSelectedSymbols={initialSelectedSymbols} valuationHistories={valuationHistories} />;
}
