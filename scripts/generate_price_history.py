"""Generate illustrative monthly total-return-index history for the toy ETFs.

This uses no market data. Values are deterministic synthetic fixtures meant for
chart development only; rerun from the repository root when they need renewal.
"""

from __future__ import annotations

import calendar
import csv
import math
import random
from datetime import date
from pathlib import Path


PRICE_OUTPUT_PATH = Path("data/source/price_history.csv")
RETURN_OUTPUT_PATH = Path("data/source/return_history.csv")
MONTHS = [(year, month) for year in range(2021, 2026) for month in range(1, 13)]

# Expected annual price return, volatility, starting price, currency, and
# dividend yield are illustrative assumptions, not facts.
ETF_PROFILES = {
    "CHN300": (0.025, 0.21, 4.20, "CNY", 0.020), "CHN500": (0.015, 0.24, 5.60, "CNY", 0.016),
    "CHN1000": (0.020, 0.27, 2.85, "CNY", 0.012), "SSE50": (0.030, 0.19, 3.75, "CNY", 0.028),
    "CHINEXT": (0.045, 0.30, 6.40, "CNY", 0.008), "USP500": (0.091, 0.16, 100.00, "USD", 0.014),
    "USN100": (0.117, 0.22, 120.00, "USD", 0.008), "USDJIA": (0.064, 0.14, 85.00, "USD", 0.019),
    "USR2000": (0.053, 0.22, 75.00, "USD", 0.013), "WORLD": (0.063, 0.15, 95.00, "USD", 0.017),
    "EMERGE": (0.029, 0.20, 52.00, "USD", 0.021), "ALLWORLD": (0.058, 0.15, 105.00, "USD", 0.018),
    "JPN225": (0.069, 0.18, 1800.00, "JPY", 0.016), "JPTOPIX": (0.060, 0.16, 1450.00, "JPY", 0.020),
    "KOR200": (0.037, 0.21, 14500.00, "KRW", 0.018), "EU600": (0.046, 0.16, 80.00, "EUR", 0.028),
    "GERDAX": (0.058, 0.19, 135.00, "EUR", 0.025),
}


def month_end(year: int, month: int) -> str:
    return date(year, month, calendar.monthrange(year, month)[1]).isoformat()


def shared_market_return(month_number: int) -> float:
    """A stylised market cycle, including a 2022-style drawdown."""
    year, month = MONTHS[month_number]
    cycle = 0.006 * math.sin(month_number * 0.73) + 0.003 * math.cos(month_number * 0.29)
    if year == 2022:
        cycle -= 0.012
    elif year == 2023:
        cycle += 0.008
    elif year == 2024:
        cycle += 0.004
    if year == 2025 and month in (3, 4):
        cycle -= 0.007
    return cycle


def main() -> None:
    PRICE_OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    with (
        PRICE_OUTPUT_PATH.open("w", newline="", encoding="utf-8") as price_file,
        RETURN_OUTPUT_PATH.open("w", newline="", encoding="utf-8") as return_file,
    ):
        price_writer = csv.writer(price_file)
        return_writer = csv.writer(return_file)
        price_writer.writerow(["symbol", "date", "close_price", "currency"])
        return_writer.writerow([
            "symbol", "date", "monthly_price_return_pct", "monthly_total_return_pct",
            "total_return_index", "cumulative_total_return_pct",
        ])
        for symbol, (annual_return, annual_volatility, starting_price, currency, dividend_yield) in ETF_PROFILES.items():
            generator = random.Random(f"simple-etf-v1-{symbol}")
            close_price = starting_price
            total_return_index = 100.0
            price_writer.writerow([symbol, "2020-12-31", f"{close_price:.4f}", currency])
            return_writer.writerow([symbol, "2020-12-31", "0.0000", "0.0000", "100.0000", "0.0000"])
            for month_number, (year, month) in enumerate(MONTHS):
                price_return = (
                    annual_return / 12
                    + shared_market_return(month_number)
                    + generator.gauss(0, annual_volatility / math.sqrt(12))
                )
                price_return = max(-0.12, min(0.12, price_return))
                total_return = price_return + dividend_yield / 12
                close_price *= 1 + price_return
                total_return_index *= 1 + total_return
                observation_date = month_end(year, month)
                price_writer.writerow([symbol, observation_date, f"{close_price:.4f}", currency])
                return_writer.writerow([
                    symbol, observation_date, f"{price_return * 100:.4f}",
                    f"{total_return * 100:.4f}", f"{total_return_index:.4f}",
                    f"{(total_return_index - 100):.4f}",
                ])


if __name__ == "__main__":
    main()
