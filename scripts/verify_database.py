"""Perform lightweight integrity checks on the generated local SQLite database."""

import sqlite3
from pathlib import Path

DATABASE_PATH = Path(__file__).resolve().parents[1] / "data" / "simple_etf.sqlite"


def count(connection: sqlite3.Connection, table: str) -> int:
    return connection.execute(f"SELECT COUNT(*) FROM {table}").fetchone()[0]


def main() -> None:
    connection = sqlite3.connect(DATABASE_PATH)
    try:
        etf_count = count(connection, "etfs")
        assert etf_count >= 30
        assert count(connection, "etf_metrics") == etf_count
        assert count(connection, "price_history") > etf_count * 2_000
        assert count(connection, "return_history") == count(connection, "price_history")
        stock_price_count = connection.execute("SELECT COUNT(*) FROM price_history p JOIN etfs e ON e.id = p.etf_id WHERE e.asset_class = 'Stock'").fetchone()[0]
        assert count(connection, "valuation_history") == stock_price_count
        for column in ("asset_class", "region", "country", "industry", "strategy", "distribution_policy"):
            underrepresented = connection.execute(
                f"SELECT {column} FROM etfs WHERE {column} IS NOT NULL GROUP BY {column} HAVING COUNT(*) < 5"
            ).fetchall()
            assert underrepresented == [], f"Insufficient filter choices for {column}: {underrepresented}"
        assert connection.execute("SELECT MIN(inception_date) FROM etfs").fetchone()[0] <= "2010-12-31"
        assert connection.execute("PRAGMA foreign_key_check").fetchall() == []
    finally:
        connection.close()
    print("Database verification passed.")


if __name__ == "__main__":
    main()
