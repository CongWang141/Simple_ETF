import { notFound } from "next/navigation";
import { EtfDetail } from "@/components/etf/EtfDetail";
import { getEtfBySymbol, getHistoricalObservations, listEtfs } from "@/lib/etfs";

export function generateStaticParams() {
  return listEtfs().map((etf) => ({ symbol: etf.symbol }));
}

export default async function EtfDetailPage({ params }: { params: Promise<{ symbol: string }> }) {
  const { symbol } = await params;
  const etf = getEtfBySymbol(symbol);
  if (!etf) notFound();
  return <EtfDetail etf={etf} observations={getHistoricalObservations(symbol)} />;
}
