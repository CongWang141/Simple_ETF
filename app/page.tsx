import { EtfScreener } from "@/components/screener/EtfScreener";
import Link from "next/link";
import { listEtfs } from "@/lib/etfs";

export default function HomePage() {
  const etfs = listEtfs();

  return (
    <main className="page-shell">
      <p className="eyebrow">Local-only ETF screener</p>
      <h1>Find an ETF that fits your view.</h1>
      <p className="intro">
        Explore a small, illustrative ETF universe by region, issuer, currency, distribution policy, and fee.
      </p>
      <p className="data-note">All prices, returns, valuations, and fund facts are synthetic local fixtures as of 31 Dec 2025.</p>
      <Link className="compare-link" href="/compare">Compare ETFs →</Link>
      <EtfScreener etfs={etfs} />
    </main>
  );
}
