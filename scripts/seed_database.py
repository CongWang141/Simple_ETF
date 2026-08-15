"""Recreate the local SQLite database from version-controlled CSV fixtures."""

from __future__ import annotations

import csv
import sqlite3
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCE_DIR = ROOT / "data" / "source"
DATABASE_PATH = ROOT / "data" / "simple_etf.sqlite"

SCHEMA = """
PRAGMA foreign_keys = ON;
CREATE TABLE etfs (id INTEGER PRIMARY KEY, symbol TEXT NOT NULL UNIQUE, name TEXT NOT NULL, tracking_index TEXT NOT NULL, market TEXT NOT NULL, issuer TEXT NOT NULL, asset_class TEXT NOT NULL, region TEXT NOT NULL, currency TEXT NOT NULL, domicile TEXT NOT NULL, inception_date TEXT NOT NULL, ter REAL NOT NULL, fund_size_million_usd REAL NOT NULL, distribution_policy TEXT NOT NULL, replication_method TEXT NOT NULL, benchmark_name TEXT NOT NULL);
CREATE TABLE etf_metrics (etf_id INTEGER NOT NULL REFERENCES etfs(id) ON DELETE CASCADE, as_of_date TEXT NOT NULL, pe_ratio REAL NOT NULL, pb_ratio REAL NOT NULL, return_1m_pct REAL NOT NULL, return_3m_pct REAL NOT NULL, return_6m_pct REAL NOT NULL, return_ytd_pct REAL NOT NULL, return_1y_pct REAL NOT NULL, return_3y_pct REAL NOT NULL, return_5y_pct REAL NOT NULL, return_since_inception_pct REAL NOT NULL, PRIMARY KEY (etf_id, as_of_date));
CREATE TABLE price_history (etf_id INTEGER NOT NULL REFERENCES etfs(id) ON DELETE CASCADE, date TEXT NOT NULL, close_price REAL NOT NULL, currency TEXT NOT NULL, PRIMARY KEY (etf_id, date));
CREATE TABLE return_history (etf_id INTEGER NOT NULL REFERENCES etfs(id) ON DELETE CASCADE, date TEXT NOT NULL, monthly_price_return_pct REAL NOT NULL, monthly_total_return_pct REAL NOT NULL, total_return_index REAL NOT NULL, cumulative_total_return_pct REAL NOT NULL, PRIMARY KEY (etf_id, date));
CREATE INDEX idx_etfs_filters ON etfs (market, region, issuer, currency);
CREATE INDEX idx_price_history_date ON price_history (etf_id, date);
CREATE INDEX idx_return_history_date ON return_history (etf_id, date);
"""


def read_csv(filename: str) -> list[dict[str, str]]:
    with (SOURCE_DIR / filename).open(newline="", encoding="utf-8") as input_file:
        return list(csv.DictReader(input_file))


def main() -> None:
    etf_rows, price_rows, return_rows = (read_csv(name) for name in ("etfs.csv", "price_history.csv", "return_history.csv"))
    DATABASE_PATH.unlink(missing_ok=True)
    connection = sqlite3.connect(DATABASE_PATH)
    try:
        connection.executescript(SCHEMA)
        with connection:
            etf_ids: dict[str, int] = {}
            for row in etf_rows:
                cursor = connection.execute(
                    "INSERT INTO etfs (symbol, name, tracking_index, market, issuer, asset_class, region, currency, domicile, inception_date, ter, fund_size_million_usd, distribution_policy, replication_method, benchmark_name) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                    (row["symbol"], row["name"], row["tracking_index"], row["market"], row["issuer"], row["asset_class"], row["region"], row["currency"], row["domicile"], row["inception_date"], float(row["ter"]), float(row["fund_size_million_usd"]), row["distribution_policy"], row["replication_method"], row["benchmark_name"]),
                )
                etf_ids[row["symbol"]] = cursor.lastrowid
                connection.execute(
                    "INSERT INTO etf_metrics (etf_id, as_of_date, pe_ratio, pb_ratio, return_1m_pct, return_3m_pct, return_6m_pct, return_ytd_pct, return_1y_pct, return_3y_pct, return_5y_pct, return_since_inception_pct) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                    (cursor.lastrowid, row["metrics_as_of_date"], float(row["pe_ratio"]), float(row["pb_ratio"]), float(row["return_1m_pct"]), float(row["return_3m_pct"]), float(row["return_6m_pct"]), float(row["return_ytd_pct"]), float(row["return_1y_pct"]), float(row["return_3y_pct"]), float(row["return_5y_pct"]), float(row["return_since_inception_pct"])),
                )
            connection.executemany("INSERT INTO price_history (etf_id, date, close_price, currency) VALUES (?, ?, ?, ?)", [(etf_ids[row["symbol"]], row["date"], float(row["close_price"]), row["currency"]) for row in price_rows])
            connection.executemany("INSERT INTO return_history (etf_id, date, monthly_price_return_pct, monthly_total_return_pct, total_return_index, cumulative_total_return_pct) VALUES (?, ?, ?, ?, ?, ?)", [(etf_ids[row["symbol"]], row["date"], float(row["monthly_price_return_pct"]), float(row["monthly_total_return_pct"]), float(row["total_return_index"]), float(row["cumulative_total_return_pct"])) for row in return_rows])
    finally:
        connection.close()
    print(f"Seeded {DATABASE_PATH} with {len(etf_rows)} ETFs, {len(price_rows)} prices, and {len(return_rows)} returns.")


if __name__ == "__main__":
    main()
