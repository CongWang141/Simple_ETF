import Link from "next/link";
import { HistoricalReturnChart } from "@/components/charts/HistoricalReturnChart";
import { formatFundSize, formatPercent, formatTer } from "@/lib/formatters";
import type { EtfSummary, HistoricalObservation, HistoricalValuationObservation } from "@/lib/types";

const returnMetrics = [
  ["1M", "return1mPct"], ["3M", "return3mPct"], ["6M", "return6mPct"], ["YTD", "returnYtdPct"],
  ["1Y", "return1yPct"], ["3Y", "return3yPct"], ["5Y", "return5yPct"], ["Since inception", "returnSinceInceptionPct"],
] as const;

export function EtfDetail({ etf, observations, valuations }: { etf: EtfSummary; observations: HistoricalObservation[]; valuations: HistoricalValuationObservation[] }) {
  const latestPrice = observations.at(-1);
  return (
    <main className="page-shell detail-page" id="main-content">
      <Link className="back-link" href="/">← Back to screener</Link>
      <header className="detail-hero">
        <div>
          <p className="eyebrow">{etf.symbol} · {etf.market}</p>
          <h1>{etf.name}</h1>
          <p className="detail-index">Tracks the {etf.trackingIndex}</p>
        </div>
      </header>

      <section className="metric-grid overview-grid" aria-label="ETF highlights">
        <div><span>Issuer</span><strong>{etf.issuer}</strong></div>
        <div><span>Fund size</span><strong>{formatFundSize(etf.fundSizeMillionUsd)}</strong></div>
        <div><span>Price</span><strong>{latestPrice ? `${latestPrice.closePrice.toFixed(2)} ${latestPrice.currency}` : "—"}</strong></div>
        <div><span>P/E</span><strong>{etf.peRatio === null ? "—" : `${etf.peRatio.toFixed(1)}×`}</strong></div>
        <div><span>TER</span><strong>{formatTer(etf.ter)}</strong></div>
      </section>

      <HistoricalReturnChart observations={observations} valuations={valuations} />

      <section className="facts-card key-data-card" aria-labelledby="key-data-heading">
        <div className="section-heading"><p className="section-label">Key Data</p><h2 id="key-data-heading">ETF profile</h2></div>
        <dl>
          <div><dt>Benchmark</dt><dd>{etf.benchmarkName}</dd></div>
          <div><dt>Asset class</dt><dd>{etf.assetClass}</dd></div>
          <div><dt>Region</dt><dd>{etf.region}</dd></div>
          <div><dt>Country</dt><dd>{etf.country}</dd></div>
          <div><dt>Industry</dt><dd>{etf.industry ?? "—"}</dd></div>
          <div><dt>Strategy</dt><dd>{etf.strategy ?? "—"}</dd></div>
          <div><dt>P/B</dt><dd>{etf.pbRatio === null ? "—" : `${etf.pbRatio.toFixed(1)}×`}</dd></div>
          <div><dt>Currency</dt><dd>{etf.currency}</dd></div>
          <div><dt>Distribution</dt><dd>{etf.distributionPolicy}</dd></div>
          <div><dt>Inception</dt><dd>{etf.inceptionDate}</dd></div>
        </dl>
      </section>

      <section className="performance-card">
        <div className="performance-heading">
          <div><p className="section-label">Performance snapshot</p><h2>Total return</h2></div>
          <span>As of {etf.asOfDate}</span>
        </div>
        <div className="performance-grid">
          {returnMetrics.map(([label, key]) => {
            const value = etf[key];
            return <div key={key}><span>{label}</span><strong className={value >= 0 ? "positive" : "negative"}>{formatPercent(value)}</strong></div>;
          })}
        </div>
      </section>
    </main>
  );
}
