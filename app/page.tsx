import { EtfScreener } from "@/components/screener/EtfScreener";
import { listEtfs } from "@/lib/etfs";

export default function HomePage() {
  const etfs = listEtfs();

  return (
    <main className="page-shell" id="main-content">
      <p className="eyebrow">Local-only ETF screener</p>
      <h1>Find an ETF that fits your view.</h1>
      <p className="intro">
        Explore an illustrative ETF universe by asset class, region, country, industry, strategy, and distribution policy.
      </p>
      <EtfScreener etfs={etfs} />
    </main>
  );
}
