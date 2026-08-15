"""Generate deterministic toy monthly prices, partitioned into yearly CSVs."""

import calendar
import csv
import math
import random
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "data" / "source" / "prices"
MONTHS = [(year, month) for year in range(2021, 2026) for month in range(1, 13)]
PROFILES = {
    "CHN300": (0.025, 0.21, 4.20, "CNY"), "CHN500": (0.015, 0.24, 5.60, "CNY"), "CHN1000": (0.020, 0.27, 2.85, "CNY"), "SSE50": (0.030, 0.19, 3.75, "CNY"), "CHINEXT": (0.045, 0.30, 6.40, "CNY"),
    "USP500": (0.091, 0.16, 100.00, "USD"), "USN100": (0.117, 0.22, 120.00, "USD"), "USDJIA": (0.064, 0.14, 85.00, "USD"), "USR2000": (0.053, 0.22, 75.00, "USD"), "WORLD": (0.063, 0.15, 95.00, "USD"), "EMERGE": (0.029, 0.20, 52.00, "USD"), "ALLWORLD": (0.058, 0.15, 105.00, "USD"),
    "JPN225": (0.069, 0.18, 1800.00, "JPY"), "JPTOPIX": (0.060, 0.16, 1450.00, "JPY"), "KOR200": (0.037, 0.21, 14500.00, "KRW"), "EU600": (0.046, 0.16, 80.00, "EUR"), "GERDAX": (0.058, 0.19, 135.00, "EUR"),
}


def market_cycle(month_number: int) -> float:
    year, month = MONTHS[month_number]
    value = 0.006 * math.sin(month_number * 0.73) + 0.003 * math.cos(month_number * 0.29)
    if year == 2022: value -= 0.012
    if year == 2023: value += 0.008
    if year == 2024: value += 0.004
    if year == 2025 and month in (3, 4): value -= 0.007
    return value


def end_of_month(year: int, month: int) -> str:
    return date(year, month, calendar.monthrange(year, month)[1]).isoformat()


def main() -> None:
    by_year: dict[int, list[list[str]]] = {year: [] for year in range(2020, 2026)}
    for symbol, (annual_return, volatility, starting_price, currency) in PROFILES.items():
        price = starting_price
        by_year[2020].append([symbol, "2020-12-31", f"{price:.4f}", currency])
        generator = random.Random(f"simple-etf-v1-{symbol}")
        for position, (year, month) in enumerate(MONTHS):
            rate = annual_return / 12 + market_cycle(position) + generator.gauss(0, volatility / math.sqrt(12))
            price *= 1 + max(-0.12, min(0.12, rate))
            by_year[year].append([symbol, end_of_month(year, month), f"{price:.4f}", currency])
    OUTPUT.mkdir(parents=True, exist_ok=True)
    for year, rows in by_year.items():
        with (OUTPUT / f"{year}.csv").open("w", newline="", encoding="utf-8") as output_file:
            writer = csv.writer(output_file)
            writer.writerow(["symbol", "date", "close_price", "currency"])
            writer.writerows(rows)
    print("Generated yearly price partitions.")


if __name__ == "__main__":
    main()
