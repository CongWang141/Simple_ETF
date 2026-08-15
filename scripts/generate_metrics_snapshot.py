"""Generate a compact latest return snapshot from the canonical price files."""

import csv
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "data" / "source"


def read_csv(path: Path) -> list[dict[str, str]]:
    with path.open(newline="", encoding="utf-8") as input_file:
        return list(csv.DictReader(input_file))


def percent(end: float, start: float) -> str:
    return f"{(end / start - 1) * 100:.2f}"


def main() -> None:
    etfs = {row["symbol"]: row for row in read_csv(SOURCE / "etfs.csv")}
    prices = [row for path in sorted((SOURCE / "prices").glob("*.csv")) for row in read_csv(path)]
    by_symbol: dict[str, list[dict[str, str]]] = {}
    for row in prices: by_symbol.setdefault(row["symbol"], []).append(row)
    rows = []
    for symbol, series in by_symbol.items():
        series.sort(key=lambda row: row["date"])
        total_return_index = 100.0
        values = {series[0]["date"]: total_return_index}
        previous_price = float(series[0]["close_price"])
        previous_date = date.fromisoformat(series[0]["date"])
        for observation in series[1:]:
            observation_date = date.fromisoformat(observation["date"])
            price_return = float(observation["close_price"]) / previous_price - 1
            total_return = price_return + float(etfs[symbol]["assumed_annual_distribution_yield"]) * ((observation_date - previous_date).days / 365.25)
            total_return_index *= 1 + total_return
            values[observation["date"]] = total_return_index
            previous_price, previous_date = float(observation["close_price"]), observation_date
        end_date, end_price = series[-1]["date"], total_return_index
        bases = {"return_1m_pct": "2025-11-30", "return_3m_pct": "2025-09-30", "return_6m_pct": "2025-06-30", "return_ytd_pct": "2024-12-31", "return_1y_pct": "2024-12-31", "return_3y_pct": "2022-12-31", "return_5y_pct": "2020-12-31"}
        row = {"symbol": symbol, "as_of_date": end_date, **{name: percent(end_price, values[start]) for name, start in bases.items()}}
        years = (date.fromisoformat(end_date) - date.fromisoformat(etfs[symbol]["inception_date"])).days / 365.25
        row["return_since_inception_pct"] = f"{((1 + float(row['return_5y_pct']) / 100) ** (years / 5) - 1) * 100:.2f}"
        rows.append(row)
    fields = ["symbol", "as_of_date", "return_1m_pct", "return_3m_pct", "return_6m_pct", "return_ytd_pct", "return_1y_pct", "return_3y_pct", "return_5y_pct", "return_since_inception_pct"]
    output = SOURCE / "metrics" / f"{rows[0]['as_of_date']}.csv"
    with output.open("w", newline="", encoding="utf-8") as output_file:
        writer = csv.DictWriter(output_file, fieldnames=fields)
        writer.writeheader(); writer.writerows(sorted(rows, key=lambda row: row["symbol"]))
    print(f"Generated {output}.")


if __name__ == "__main__":
    main()
