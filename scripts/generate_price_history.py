"""Generate deterministic toy daily ETF prices, partitioned into yearly CSVs."""

import csv
import math
import random
from datetime import date, timedelta
from pathlib import Path

from generation import seed_argument

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "data" / "source"
OUTPUT = SOURCE / "prices"

# Annual return, annual volatility, starting price, currency. ETFs sharing an
# index use the same market profile but receive a small deterministic variation.
PROFILES = {
    "CSI 300": (0.025, 0.21, 4.20, "CNY"), "CSI 500": (0.015, 0.24, 5.60, "CNY"),
    "CSI 1000": (0.020, 0.27, 2.85, "CNY"), "SSE 50": (0.030, 0.19, 3.75, "CNY"),
    "ChiNext": (0.045, 0.30, 6.40, "CNY"), "S&P 500": (0.091, 0.16, 100.00, "USD"),
    "Nasdaq 100": (0.117, 0.22, 120.00, "USD"), "Dow Jones": (0.064, 0.14, 85.00, "USD"),
    "Russell 2000": (0.053, 0.22, 75.00, "USD"), "MSCI World": (0.063, 0.15, 95.00, "USD"),
    "MSCI EM": (0.029, 0.20, 52.00, "USD"), "FTSE All-World": (0.058, 0.15, 105.00, "USD"),
    "Nikkei 225": (0.069, 0.18, 1800.00, "JPY"), "TOPIX": (0.060, 0.16, 1450.00, "JPY"),
    "KOSPI 200": (0.037, 0.21, 14500.00, "KRW"), "STOXX Europe 600": (0.046, 0.16, 80.00, "EUR"),
    "DAX": (0.058, 0.19, 135.00, "EUR"),
    "Government Bond": (0.031, 0.07, 100.00, "USD"),
    "Broad Commodity": (0.042, 0.25, 100.00, "USD"),
}
END_DATE = date(2025, 12, 31)


def read_etfs() -> list[dict[str, str]]:
    with (SOURCE / "etfs.csv").open(newline="", encoding="utf-8") as input_file:
        return list(csv.DictReader(input_file))


def business_days(start: date, end: date):
    current = start
    while current.weekday() >= 5:
        current += timedelta(days=1)
    while current <= end:
        if current.weekday() < 5:
            yield current
        current += timedelta(days=1)


def market_cycle(day: date) -> float:
    day_number = (day - date(2010, 1, 1)).days
    value = 0.00022 * math.sin(day_number * 0.071) + 0.00012 * math.cos(day_number * 0.023)
    if day.year == 2022:
        value -= 0.00045
    elif day.year == 2023:
        value += 0.00030
    elif day.year == 2024:
        value += 0.00016
    elif day.year == 2025 and day.month in (3, 4):
        value -= 0.00025
    return value


def main() -> None:
    args = seed_argument(__doc__ or "Generate price history.")
    by_year: dict[int, list[list[str]]] = {}
    for etf in read_etfs():
        annual_return, volatility, base_price, _ = PROFILES[etf["tracking_index"]]
        currency = etf["trading_currency"]
        generator = random.Random(f"simple-etf-daily-v3-{args.seed}-{etf['symbol']}")
        price = base_price * (0.82 + generator.random() * 0.36)
        start = date.fromisoformat(etf["inception_date"])
        for current in business_days(start, END_DATE):
            daily_rate = annual_return / 252 + market_cycle(current) + generator.gauss(0, volatility / math.sqrt(252))
            price *= 1 + max(-0.095, min(0.095, daily_rate))
            by_year.setdefault(current.year, []).append([etf["symbol"], current.isoformat(), f"{price:.4f}", currency])

    OUTPUT.mkdir(parents=True, exist_ok=True)
    for path in OUTPUT.glob("20*.csv"):
        path.unlink()
    for year, rows in sorted(by_year.items()):
        with (OUTPUT / f"{year}.csv").open("w", newline="", encoding="utf-8") as output_file:
            writer = csv.writer(output_file)
            writer.writerow(["symbol", "date", "close_price", "currency"])
            writer.writerows(sorted(rows, key=lambda row: (row[0], row[1])))
    print(f"Generated daily price partitions for {len(read_etfs())} ETFs ({min(by_year)}–{max(by_year)}).")


if __name__ == "__main__":
    main()
