"""Run with: python3 tests/lib/database.test.py (after seeding the database)."""

import sqlite3
from pathlib import Path

database_path = Path(__file__).resolve().parents[2] / "data" / "simple_etf.sqlite"
connection = sqlite3.connect(database_path)
try:
    etf = connection.execute("SELECT symbol, tracking_index, ter FROM etfs WHERE symbol = 'USP500'").fetchone()
    assert etf == ("USP500", "S&P 500", 0.10)
    history_count = connection.execute("SELECT COUNT(*) FROM return_history r JOIN etfs e ON e.id = r.etf_id WHERE e.symbol = 'USP500'").fetchone()[0]
    assert history_count == 61
finally:
    connection.close()
print("Database query test passed.")
