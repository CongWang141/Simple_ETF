"""Perform lightweight integrity checks on the generated local SQLite database."""

import sqlite3
from pathlib import Path

DATABASE_PATH = Path(__file__).resolve().parents[1] / "data" / "simple_etf.sqlite"


def count(connection: sqlite3.Connection, table: str) -> int:
    return connection.execute(f"SELECT COUNT(*) FROM {table}").fetchone()[0]


def main() -> None:
    connection = sqlite3.connect(DATABASE_PATH)
    try:
        assert count(connection, "etfs") == 17
        assert count(connection, "etf_metrics") == 17
        assert count(connection, "price_history") == 1037
        assert count(connection, "return_history") == 1037
        assert connection.execute("PRAGMA foreign_key_check").fetchall() == []
    finally:
        connection.close()
    print("Database verification passed.")


if __name__ == "__main__":
    main()
