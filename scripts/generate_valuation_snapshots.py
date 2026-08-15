"""Generate illustrative quarterly index P/E and P/B snapshots for the toy data."""

import csv
import math
import random
from datetime import date
from pathlib import Path

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
    rows: list[list[str]] = []
    for index, (base_pe, base_pb) in VALUATION_ANCHORS.items():
        generator = random.Random(f"simple-etf-valuations-v2-{index}")
        quarters = [(2009, 12)] + [(year, month) for year in range(2010, 2026) for month in (3, 6, 9, 12)]
        for position, (year, month) in enumerate(quarters):
            cycle = math.sin(position * 0.42) * 0.075 + math.cos(position * 0.16) * 0.035
            pe = base_pe * (1 + cycle + generator.uniform(-0.035, 0.035))
            pb = base_pb * (1 + cycle * 0.7 + generator.uniform(-0.03, 0.03))
            rows.append([index, quarter_end(year, month).isoformat(), f"{max(4, pe):.2f}", f"{max(0.35, pb):.2f}"])
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    with OUTPUT.open("w", newline="", encoding="utf-8") as output_file:
        writer = csv.writer(output_file)
        writer.writerow(["tracking_index", "report_date", "pe_ratio", "pb_ratio"])
        writer.writerows(rows)
    print(f"Generated {len(rows)} quarterly valuation snapshots.")


if __name__ == "__main__":
    main()
