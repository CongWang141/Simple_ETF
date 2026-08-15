import { EtfComparison } from "@/components/compare/EtfComparison";
import { getHistoricalObservations, listEtfs } from "@/lib/etfs";

export default function ComparePage() {
  const etfs = listEtfs();
  const histories = Object.fromEntries(etfs.map((etf) => [etf.symbol, getHistoricalObservations(etf.symbol)]));
  return <EtfComparison etfs={etfs} histories={histories} />;
}
