"""Recreate SQLite from partitioned prices and sparse valuation inputs."""

from __future__ import annotations

import csv
import sqlite3
from collections import defaultdict
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "data" / "source"
DATABASE = ROOT / "data" / "simple_etf.sqlite"

SCHEMA = """
PRAGMA foreign_keys = ON;
CREATE TABLE etfs (id INTEGER PRIMARY KEY, symbol TEXT NOT NULL UNIQUE, name TEXT NOT NULL, tracking_index TEXT NOT NULL, market TEXT NOT NULL, issuer TEXT NOT NULL, asset_class TEXT NOT NULL, region TEXT NOT NULL, currency TEXT NOT NULL, domicile TEXT NOT NULL, inception_date TEXT NOT NULL, ter REAL NOT NULL, fund_size_million_usd REAL NOT NULL, distribution_policy TEXT NOT NULL, replication_method TEXT NOT NULL, benchmark_name TEXT NOT NULL, assumed_annual_distribution_yield REAL NOT NULL);
CREATE TABLE etf_metrics (etf_id INTEGER NOT NULL REFERENCES etfs(id), as_of_date TEXT NOT NULL, pe_ratio REAL NOT NULL, pb_ratio REAL NOT NULL, return_1m_pct REAL NOT NULL, return_3m_pct REAL NOT NULL, return_6m_pct REAL NOT NULL, return_ytd_pct REAL NOT NULL, return_1y_pct REAL NOT NULL, return_3y_pct REAL NOT NULL, return_5y_pct REAL NOT NULL, return_since_inception_pct REAL NOT NULL, PRIMARY KEY (etf_id, as_of_date));
CREATE TABLE price_history (etf_id INTEGER NOT NULL REFERENCES etfs(id), date TEXT NOT NULL, close_price REAL NOT NULL, currency TEXT NOT NULL, PRIMARY KEY (etf_id, date));
CREATE TABLE return_history (etf_id INTEGER NOT NULL REFERENCES etfs(id), date TEXT NOT NULL, monthly_price_return_pct REAL NOT NULL, monthly_total_return_pct REAL NOT NULL, total_return_index REAL NOT NULL, cumulative_total_return_pct REAL NOT NULL, PRIMARY KEY (etf_id, date));
CREATE TABLE valuation_history (etf_id INTEGER NOT NULL REFERENCES etfs(id), date TEXT NOT NULL, pe_ratio REAL NOT NULL, pb_ratio REAL NOT NULL, PRIMARY KEY (etf_id, date));
CREATE INDEX idx_etfs_filters ON etfs (market, region, issuer, currency);
CREATE INDEX idx_price_history_date ON price_history (etf_id, date);
CREATE INDEX idx_return_history_date ON return_history (etf_id, date);
CREATE INDEX idx_valuation_history_date ON valuation_history (etf_id, date);
"""


def read_csv(path: Path) -> list[dict[str, str]]:
    with path.open(newline="", encoding="utf-8") as input_file:
        return list(csv.DictReader(input_file))


def latest_metrics() -> list[dict[str, str]]:
    return read_csv(sorted((SOURCE / "metrics").glob("*.csv"))[-1])


def all_prices() -> list[dict[str, str]]:
    return [row for path in sorted((SOURCE / "prices").glob("*.csv")) for row in read_csv(path)]


def main() -> None:
    etfs = read_csv(SOURCE / "etfs.csv")
    metrics = {row["symbol"]: row for row in latest_metrics()}
    prices = all_prices()
    baselines = {row["tracking_index"]: row for row in read_csv(SOURCE / "fundamentals" / "index_valuation_baselines.csv")}
    events: dict[str, list[dict[str, str]]] = defaultdict(list)
    for row in read_csv(SOURCE / "fundamentals" / "index_valuation_events.csv"):
        events[row["tracking_index"]].append(row)
    for value in events.values():
        value.sort(key=lambda row: row["effective_date"])

    DATABASE.unlink(missing_ok=True)
    connection = sqlite3.connect(DATABASE)
    try:
        connection.executescript(SCHEMA)
        with connection:
            etf_ids: dict[str, int] = {}
            etf_by_symbol = {row["symbol"]: row for row in etfs}
            for row in etfs:
                cursor = connection.execute(
                    "INSERT INTO etfs (symbol, name, tracking_index, market, issuer, asset_class, region, currency, domicile, inception_date, ter, fund_size_million_usd, distribution_policy, replication_method, benchmark_name, assumed_annual_distribution_yield) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                    tuple(row[field] if field not in {"ter", "fund_size_million_usd", "assumed_annual_distribution_yield"} else float(row[field]) for field in ["symbol", "name", "tracking_index", "market", "issuer", "asset_class", "region", "currency", "domicile", "inception_date", "ter", "fund_size_million_usd", "distribution_policy", "replication_method", "benchmark_name", "assumed_annual_distribution_yield"]),
                )
                etf_ids[row["symbol"]] = cursor.lastrowid

            grouped_prices: dict[str, list[dict[str, str]]] = defaultdict(list)
            for row in prices:
                grouped_prices[row["symbol"]].append(row)
            valuation_at_date: dict[tuple[str, str], tuple[float, float]] = {}
            return_rows = []
            valuation_rows = []
            for symbol, series in grouped_prices.items():
                series.sort(key=lambda row: row["date"])
                etf = etf_by_symbol[symbol]
                base = baselines[etf["tracking_index"]]
                event_series = events[etf["tracking_index"]]
                base_price = float(series[0]["close_price"])
                previous_price = base_price
                previous_date = date.fromisoformat(series[0]["date"])
                total_return_index = 100.0
                event_position = 0
                active_event = event_series[0]
                for row in series:
                    row_date = date.fromisoformat(row["date"])
                    while event_position + 1 < len(event_series) and event_series[event_position + 1]["effective_date"] <= row["date"]:
                        event_position += 1
                        active_event = event_series[event_position]
                    close_price = float(row["close_price"])
                    if row is series[0]:
                        price_return = total_return = 0.0
                    else:
                        price_return = close_price / previous_price - 1
                        total_return = price_return + float(etf["assumed_annual_distribution_yield"]) * ((row_date - previous_date).days / 365.25)
                        total_return_index *= 1 + total_return
                    return_rows.append((etf_ids[symbol], row["date"], price_return * 100, total_return * 100, total_return_index, total_return_index - 100))
                    pe_ratio = float(base["base_pe_ratio"]) * (close_price / base_price) / (float(active_event["earnings_index"]) / 100)
                    pb_ratio = float(base["base_pb_ratio"]) * (close_price / base_price) / (float(active_event["book_value_index"]) / 100)
                    valuation_rows.append((etf_ids[symbol], row["date"], pe_ratio, pb_ratio))
                    valuation_at_date[(symbol, row["date"])] = (pe_ratio, pb_ratio)
                    previous_price, previous_date = close_price, row_date

            connection.executemany("INSERT INTO price_history (etf_id, date, close_price, currency) VALUES (?, ?, ?, ?)", [(etf_ids[row["symbol"]], row["date"], float(row["close_price"]), row["currency"]) for row in prices])
            connection.executemany("INSERT INTO return_history (etf_id, date, monthly_price_return_pct, monthly_total_return_pct, total_return_index, cumulative_total_return_pct) VALUES (?, ?, ?, ?, ?, ?)", return_rows)
            connection.executemany("INSERT INTO valuation_history (etf_id, date, pe_ratio, pb_ratio) VALUES (?, ?, ?, ?)", valuation_rows)
            for symbol, row in metrics.items():
                pe_ratio, pb_ratio = valuation_at_date[(symbol, row["as_of_date"])]
                connection.execute("INSERT INTO etf_metrics (etf_id, as_of_date, pe_ratio, pb_ratio, return_1m_pct, return_3m_pct, return_6m_pct, return_ytd_pct, return_1y_pct, return_3y_pct, return_5y_pct, return_since_inception_pct) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", (etf_ids[symbol], row["as_of_date"], pe_ratio, pb_ratio, *[float(row[field]) for field in ["return_1m_pct", "return_3m_pct", "return_6m_pct", "return_ytd_pct", "return_1y_pct", "return_3y_pct", "return_5y_pct", "return_since_inception_pct"]]))
    finally:
        connection.close()
    print(f"Seeded {DATABASE} with {len(etfs)} ETFs, {len(prices)} prices, and {len(valuation_rows)} valuation observations.")


if __name__ == "__main__":
    main()
