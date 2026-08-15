import Link from "next/link";
import { HistoricalReturnChart } from "@/components/charts/HistoricalReturnChart";
import { formatFundSize, formatPercent, formatTer } from "@/lib/formatters";
import type { EtfSummary, HistoricalObservation } from "@/lib/types";

const returnMetrics = [
  ["1M", "return1mPct"], ["3M", "return3mPct"], ["6M", "return6mPct"], ["YTD", "returnYtdPct"],
  ["1Y", "return1yPct"], ["3Y", "return3yPct"], ["5Y", "return5yPct"], ["Since inception", "returnSinceInceptionPct"],
] as const;

export function EtfDetail({ etf, observations }: { etf: EtfSummary; observations: HistoricalObservation[] }) {
  return (
    <main className="page-shell detail-page" id="main-content">
      <Link className="back-link" href="/">← Back to screener</Link>
      <header className="detail-hero">
        <div>
          <p className="eyebrow">{etf.symbol} · {etf.market}</p>
          <h1>{etf.name}</h1>
          <p className="detail-index">Tracks the {etf.trackingIndex}</p>
        </div>
        <div className="as-of-card">
          <span>Data as of</span>
          <strong>{etf.asOfDate}</strong>
          <small>Illustrative local fixture</small>
        </div>
      </header>

      <section className="metric-grid" aria-label="ETF highlights">
        <div><span>TER</span><strong>{formatTer(etf.ter)}</strong></div>
        <div><span>Fund size</span><strong>{formatFundSize(etf.fundSizeMillionUsd)}</strong></div>
        <div><span>P/E</span><strong>{etf.peRatio.toFixed(1)}×</strong></div>
        <div><span>P/B</span><strong>{etf.pbRatio.toFixed(1)}×</strong></div>
      </section>

      <section className="detail-layout">
        <HistoricalReturnChart observations={observations} />
        <aside className="facts-card">
          <p className="section-label">Fund facts</p>
          <dl>
            <div><dt>Benchmark</dt><dd>{etf.benchmarkName}</dd></div>
            <div><dt>Issuer</dt><dd>{etf.issuer}</dd></div>
            <div><dt>Asset class</dt><dd>{etf.assetClass}</dd></div>
            <div><dt>Region</dt><dd>{etf.region}</dd></div>
            <div><dt>Currency</dt><dd>{etf.currency}</dd></div>
            <div><dt>Distribution</dt><dd>{etf.distributionPolicy}</dd></div>
            <div><dt>Replication</dt><dd>{etf.replicationMethod}</dd></div>
            <div><dt>Inception</dt><dd>{etf.inceptionDate}</dd></div>
          </dl>
        </aside>
      </section>

      <section className="performance-card">
        <div className="performance-heading">
          <div><p className="section-label">Performance snapshot</p><h2>Historical total return</h2></div>
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
