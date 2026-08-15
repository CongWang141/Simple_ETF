"""Generate a larger, fictional ETF master file for the local screener."""

import csv
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "data" / "source" / "etfs.csv"

COUNTRIES = [
    ("China", "Asia", "CNY", "China", ["CSI 300", "CSI 500", "CSI 1000", "SSE 50", "ChiNext"]),
    ("Japan", "Asia", "JPY", "Japan", ["Nikkei 225", "TOPIX"]),
    ("Korea", "Asia", "KRW", "South Korea", ["KOSPI 200"]),
    ("France", "Europe", "EUR", "France", ["STOXX Europe 600"]),
    ("Germany", "Europe", "EUR", "Germany", ["DAX", "STOXX Europe 600"]),
    ("Italy", "Europe", "EUR", "Italy", ["STOXX Europe 600"]),
    ("UK", "Europe", "GBP", "United Kingdom", ["STOXX Europe 600"]),
    ("US", "America", "USD", "United States", ["S&P 500", "Nasdaq 100", "Dow Jones", "Russell 2000"]),
    ("Canada", "America", "CAD", "Canada", ["MSCI World", "FTSE All-World"]),
]
INDUSTRIES = ["Energy", "Materials", "Industrials", "Consumer Discretionary", "Consumer Staples", "Health Care", "Financials", "Information Technology", "Communication Services", "Utilities"]
STRATEGIES = ["Passive index tracking", "Growth", "Blue chip", "Momentum", "Dividends", "Quality", "Big cap", "Small cap"]
FIELDS = ["symbol", "name", "tracking_index", "market", "country", "issuer", "asset_class", "region", "industry", "strategy", "currency", "domicile", "inception_date", "ter", "fund_size_million_usd", "distribution_policy", "replication_method", "benchmark_name", "assumed_annual_distribution_yield"]


def inception(position: int) -> str:
    return date(2010 + position % 10, 1 + (position * 3) % 12, 1 + (position * 7) % 27).isoformat()


def main() -> None:
    rows: list[dict[str, str]] = []
    position = 0
    stock_position = 0
    for country, region, currency, domicile, indexes in COUNTRIES:
        code = country.upper().replace(" ", "")[:3]
        for number in range(1, 7):
            industry = INDUSTRIES[stock_position % len(INDUSTRIES)]
            strategy = STRATEGIES[stock_position % len(STRATEGIES)]
            tracking_index = indexes[(number - 1) % len(indexes)]
            rows.append({
                "symbol": f"{code}ST{number:02}", "name": f"{country} {industry} {strategy} ETF", "tracking_index": tracking_index,
                "market": country, "country": country, "issuer": f"{country} Local Index Funds", "asset_class": "Stock", "region": region,
                "industry": industry, "strategy": strategy, "currency": currency, "domicile": domicile, "inception_date": inception(position),
                "ter": f"{0.10 + (position % 7) * 0.04:.2f}", "fund_size_million_usd": str(450 + position * 47),
                "distribution_policy": "Accumulative" if position % 2 == 0 else "Distributive", "replication_method": "Physical",
                "benchmark_name": f"{tracking_index} Index", "assumed_annual_distribution_yield": f"{0.010 + (position % 5) * 0.004:.4f}",
            })
            position += 1
            stock_position += 1
        for asset_class, tracking_index, suffix in (("Bond", "Government Bond", "Government Bond"), ("Commodity", "Broad Commodity", "Broad Commodity")):
            rows.append({
                "symbol": f"{code}{'BD' if asset_class == 'Bond' else 'CM'}01", "name": f"{country} {suffix} ETF", "tracking_index": tracking_index,
                "market": country, "country": country, "issuer": f"{country} Local Index Funds", "asset_class": asset_class, "region": region,
                "industry": "", "strategy": "", "currency": currency, "domicile": domicile, "inception_date": inception(position),
                "ter": f"{0.15 + (position % 6) * 0.04:.2f}", "fund_size_million_usd": str(300 + position * 31),
                "distribution_policy": "Accumulative" if position % 2 == 0 else "Distributive", "replication_method": "Physical",
                "benchmark_name": f"{country} {suffix} Index", "assumed_annual_distribution_yield": "0.0180" if asset_class == "Bond" else "0.0000",
            })
            position += 1
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    with OUTPUT.open("w", newline="", encoding="utf-8") as output_file:
        writer = csv.DictWriter(output_file, fieldnames=FIELDS)
        writer.writeheader()
        writer.writerows(rows)
    print(f"Generated {len(rows)} fictional ETFs.")


if __name__ == "__main__":
    main()
