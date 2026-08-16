"""Generate a compact latest return snapshot from canonical daily price files."""

import csv
from calendar import monthrange
from datetime import date
from pathlib import Path

from generation import seed_argument

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "data" / "source"


def read_csv(path: Path) -> list[dict[str, str]]:
    with path.open(newline="", encoding="utf-8") as input_file:
        return list(csv.DictReader(input_file))


def percent(end: float, start: float) -> str:
    return f"{(end / start - 1) * 100:.2f}"


def value_on_or_before(values: list[tuple[date, float]], target: date) -> float:
    available = [value for current_date, value in values if current_date <= target]
    if not available:
        raise ValueError(f"No return observation on or before {target}.")
    return available[-1]


def shift_months(day: date, months: int) -> date:
    month_index = day.year * 12 + day.month - 1 - months
    year, month_zero_index = divmod(month_index, 12)
    month = month_zero_index + 1
    return date(year, month, min(day.day, monthrange(year, month)[1]))


def main() -> None:
    args = seed_argument(__doc__ or "Generate latest metrics.")
    etfs = {row["symbol"]: row for row in read_csv(SOURCE / "etfs.csv")}
    prices = [row for path in sorted((SOURCE / "prices").glob("*.csv")) for row in read_csv(path)]
    by_symbol: dict[str, list[dict[str, str]]] = {}
    for row in prices:
        by_symbol.setdefault(row["symbol"], []).append(row)

    rows = []
    for symbol, series in by_symbol.items():
        series.sort(key=lambda row: row["date"])
        total_return_index = 100.0
        values = [(date.fromisoformat(series[0]["date"]), total_return_index)]
        previous_price = float(series[0]["close_price"])
        previous_date = values[0][0]
        for observation in series[1:]:
            observation_date = date.fromisoformat(observation["date"])
            price_return = float(observation["close_price"]) / previous_price - 1
            total_return = price_return + float(etfs[symbol]["assumed_annual_distribution_yield"]) * ((observation_date - previous_date).days / 365.25)
            total_return_index *= 1 + total_return
            values.append((observation_date, total_return_index))
            previous_price, previous_date = float(observation["close_price"]), observation_date

        end_date, end_value = values[-1]
        if end_date != args.end_date:
            raise AssertionError(f"Metrics for {symbol} ended at {end_date}, expected {args.end_date}")
        bases = {
            "return_1m_pct": shift_months(end_date, 1), "return_3m_pct": shift_months(end_date, 3),
            "return_6m_pct": shift_months(end_date, 6), "return_ytd_pct": date(end_date.year - 1, 12, 31),
            "return_1y_pct": date(end_date.year - 1, end_date.month, min(end_date.day, monthrange(end_date.year - 1, end_date.month)[1])),
            "return_3y_pct": date(end_date.year - 3, end_date.month, min(end_date.day, monthrange(end_date.year - 3, end_date.month)[1])),
            "return_5y_pct": date(end_date.year - 5, end_date.month, min(end_date.day, monthrange(end_date.year - 5, end_date.month)[1])),
        }
        row = {
            "symbol": symbol,
            "as_of_date": end_date.isoformat(),
            **{name: percent(end_value, value_on_or_before(values, start)) for name, start in bases.items()},
            "return_since_inception_pct": percent(end_value, values[0][1]),
        }
        rows.append(row)

    fields = ["symbol", "as_of_date", "return_1m_pct", "return_3m_pct", "return_6m_pct", "return_ytd_pct", "return_1y_pct", "return_3y_pct", "return_5y_pct", "return_since_inception_pct"]
    metrics_directory = SOURCE / "metrics"
    metrics_directory.mkdir(parents=True, exist_ok=True)
    for path in metrics_directory.glob("*.csv"):
        path.unlink()
    output = metrics_directory / f"{rows[0]['as_of_date']}.csv"
    with output.open("w", newline="", encoding="utf-8") as output_file:
        writer = csv.DictWriter(output_file, fieldnames=fields)
        writer.writeheader()
        writer.writerows(sorted(rows, key=lambda row: row["symbol"]))
    print(f"Generated {output}.")


if __name__ == "__main__":
    main()
