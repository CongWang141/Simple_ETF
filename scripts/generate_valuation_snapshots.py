"""Generate illustrative quarterly index P/E and P/B snapshots for the toy data."""

import csv
import math
import random
from datetime import date
from pathlib import Path

from generation import seed_argument

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "data" / "source" / "fundamentals" / "index_valuation_snapshots.csv"

# These are illustrative valuation anchors, not provider data.
VALUATION_ANCHORS = {
    "CSI 300": (13.0, 1.45), "CSI 500": (21.0, 1.90), "CSI 1000": (27.0, 2.45),
    "SSE 50": (11.5, 1.28), "ChiNext": (36.0, 4.10), "S&P 500": (20.5, 3.65),
    "Nasdaq 100": (28.0, 5.10), "Dow Jones": (18.5, 3.05), "Russell 2000": (25.0, 2.25),
    "MSCI World": (19.0, 2.80), "MSCI EM": (14.5, 1.65), "FTSE All-World": (18.5, 2.65),
    "Nikkei 225": (17.5, 1.80), "TOPIX": (15.5, 1.52), "KOSPI 200": (12.0, 1.10),
    "STOXX Europe 600": (15.5, 1.85), "DAX": (14.0, 1.72),
}


def quarter_end(year: int, month: int) -> date:
    days = {3: 31, 6: 30, 9: 30, 12: 31}
    return date(year, month, days[month])


def main() -> None:
    args = seed_argument(__doc__ or "Generate valuation fundamentals.")
    rows: list[list[str]] = []
    quarters = [(2009, 12)] + [(year, month) for year in range(2010, args.end_date.year + 1) for month in (3, 6, 9, 12) if quarter_end(year, month) <= args.end_date]
    for index, (base_pe, base_pb) in VALUATION_ANCHORS.items():
        generator = random.Random(f"simple-etf-valuations-v3-{args.seed}-{index}")
        for position, (year, month) in enumerate(quarters):
            cycle = math.sin(position * 0.42) * 0.075 + math.cos(position * 0.16) * 0.035
            market_value = 1_000_000_000 * (1 + position * 0.012) * (1 + cycle)
            pe_target = max(4, base_pe * (1 + generator.uniform(-0.035, 0.035)))
            pb_target = max(0.35, base_pb * (1 + generator.uniform(-0.03, 0.03)))
            earnings = market_value / pe_target
            book_value = market_value / pb_target
            pe = market_value / earnings
            pb = market_value / book_value
            rows.append([index, quarter_end(year, month).isoformat(), f"{market_value:.2f}", f"{earnings:.2f}", f"{book_value:.2f}", f"{pe:.6f}", f"{pb:.6f}"])
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    with OUTPUT.open("w", newline="", encoding="utf-8") as output_file:
        writer = csv.writer(output_file)
        writer.writerow(["tracking_index", "report_date", "market_value", "aggregate_earnings", "aggregate_book_value", "pe_ratio", "pb_ratio"])
        writer.writerows(rows)
    print(f"Generated {len(rows)} quarterly valuation snapshots.")


if __name__ == "__main__":
    main()
