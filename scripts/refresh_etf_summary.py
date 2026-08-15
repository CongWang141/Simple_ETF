"""Add illustrative valuation and historical-return summaries to etfs.csv."""

from __future__ import annotations

import csv
from datetime import date
from pathlib import Path


ETF_PATH = Path("data/source/etfs.csv")
RETURN_PATH = Path("data/source/return_history.csv")
AS_OF_DATE = "2025-12-31"

# Valuations and long-run return assumptions are illustrative toy inputs.
VALUATIONS = {
    "CHN300": (12.8, 1.4, 0.055), "CHN500": (20.5, 2.0, 0.060), "CHN1000": (28.0, 2.5, 0.065),
    "SSE50": (10.7, 1.2, 0.060), "CHINEXT": (36.5, 4.1, 0.080), "USP500": (24.8, 4.6, 0.100),
    "USN100": (32.7, 7.8, 0.120), "USDJIA": (22.1, 5.2, 0.085), "USR2000": (20.4, 2.1, 0.075),
    "WORLD": (21.5, 3.4, 0.075), "EMERGE": (15.2, 2.0, 0.055), "ALLWORLD": (20.8, 3.2, 0.070),
    "JPN225": (18.9, 1.9, 0.070), "JPTOPIX": (17.2, 1.6, 0.065), "KOR200": (13.4, 1.1, 0.060),
    "EU600": (15.8, 2.0, 0.065), "GERDAX": (16.4, 2.1, 0.070),
}


def percent(value: float) -> str:
    return f"{value * 100:.2f}"


def history_by_symbol() -> dict[str, dict[str, float]]:
    history: dict[str, dict[str, float]] = {}
    with RETURN_PATH.open(newline="", encoding="utf-8") as input_file:
        for row in csv.DictReader(input_file):
            history.setdefault(row["symbol"], {})[row["date"]] = float(row["total_return_index"])
    return history


def return_between(indexes: dict[str, float], start: str, end: str = AS_OF_DATE) -> str:
    return percent(indexes[end] / indexes[start] - 1)


def main() -> None:
    histories = history_by_symbol()
    with ETF_PATH.open(newline="", encoding="utf-8") as input_file:
        rows = list(csv.DictReader(input_file))
        fieldnames = list(rows[0].keys())

    new_columns = [
        "metrics_as_of_date", "pe_ratio", "pb_ratio", "return_1m_pct", "return_3m_pct",
        "return_6m_pct", "return_ytd_pct", "return_1y_pct", "return_3y_pct", "return_5y_pct",
        "return_since_inception_pct",
    ]
    fieldnames = [column for column in fieldnames if column not in new_columns] + new_columns

    as_of = date.fromisoformat(AS_OF_DATE)
    start_dates = {
        "return_1m_pct": "2025-11-30", "return_3m_pct": "2025-09-30", "return_6m_pct": "2025-06-30",
        "return_ytd_pct": "2024-12-31", "return_1y_pct": "2024-12-31", "return_3y_pct": "2022-12-31",
        "return_5y_pct": "2020-12-31",
    }
    for row in rows:
        pe_ratio, pb_ratio, assumed_annual_return = VALUATIONS[row["symbol"]]
        row["metrics_as_of_date"] = AS_OF_DATE
        row["pe_ratio"] = f"{pe_ratio:.1f}"
        row["pb_ratio"] = f"{pb_ratio:.1f}"
        for column, start_date in start_dates.items():
            row[column] = return_between(histories[row["symbol"]], start_date)
        inception = date.fromisoformat(row["inception_date"])
        years_since_inception = (as_of - inception).days / 365.25
        row["return_since_inception_pct"] = percent((1 + assumed_annual_return) ** years_since_inception - 1)

    with ETF_PATH.open("w", newline="", encoding="utf-8") as output_file:
        writer = csv.DictWriter(output_file, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)


if __name__ == "__main__":
    main()
