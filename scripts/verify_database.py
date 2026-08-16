"""Validate formulas, constraints, and the generated local SQLite database."""

import math
import sqlite3
from bisect import bisect_right
from collections import defaultdict
from datetime import date
from pathlib import Path

DATABASE_PATH = Path(__file__).resolve().parents[1] / "data" / "simple_etf.sqlite"
EXPECTED_INDEXES = {"idx_etfs_filters"}
COUNTRY_REGIONS = {"China": "Asia", "Japan": "Asia", "Korea": "Asia", "France": "Europe", "Germany": "Europe", "Italy": "Europe", "UK": "Europe", "US": "America", "Canada": "America"}


def scalar(connection: sqlite3.Connection, sql: str):
    return connection.execute(sql).fetchone()[0]


def require(condition: bool, message: str) -> None:
    if not condition:
        raise AssertionError(message)


def main() -> None:
    connection = sqlite3.connect(DATABASE_PATH)
    connection.row_factory = sqlite3.Row
    try:
        etf_count = scalar(connection, "SELECT COUNT(*) FROM etfs")
        price_count = scalar(connection, "SELECT COUNT(*) FROM price_history")
        require(etf_count >= 30, "ETF universe is unexpectedly small")
        require(scalar(connection, "SELECT COUNT(*) FROM etf_metrics") == etf_count, "Each ETF needs one latest metric row")
        require(price_count > etf_count * 2_000, "Price history is unexpectedly short")
        require(scalar(connection, "SELECT COUNT(*) FROM return_history") == price_count, "Every price needs a return row")
        require(connection.execute("PRAGMA foreign_key_check").fetchall() == [], "Foreign-key violations found")
        require(scalar(connection, "SELECT COUNT(*) FROM (SELECT symbol FROM etfs GROUP BY symbol HAVING COUNT(*) > 1)") == 0, "Duplicate ticker")
        require(scalar(connection, "SELECT COUNT(*) FROM (SELECT isin FROM etfs GROUP BY isin HAVING COUNT(*) > 1)") == 0, "Duplicate ISIN")
        require(scalar(connection, "SELECT COUNT(*) FROM etfs WHERE symbol='' OR isin='' OR name='' OR asset_class NOT IN ('Stock','Bond','Commodity')") == 0, "Invalid required metadata")
        require(scalar(connection, "SELECT COUNT(*) FROM etfs WHERE ter<0 OR fund_size_million_usd<0 OR inception_date>'2025-12-31'") == 0, "Invalid fund facts")
        require(scalar(connection, "SELECT COUNT(*) FROM price_history WHERE close_price<=0 OR date>'2025-12-31'") == 0, "Invalid prices or future dates")
        for row in connection.execute("SELECT country,region,asset_class,industry,strategy FROM etfs"):
            require(COUNTRY_REGIONS.get(row["country"]) == row["region"], "Invalid country/region combination")
            expected_classification = row["asset_class"] == "Stock"
            require(bool(row["industry"]) == expected_classification and bool(row["strategy"]) == expected_classification, "Invalid asset-class classification fields")

        stock_prices = scalar(connection, "SELECT COUNT(*) FROM price_history p JOIN etfs e ON e.id=p.etf_id WHERE e.asset_class='Stock'")
        require(scalar(connection, "SELECT COUNT(*) FROM valuation_history") == stock_prices, "Stock valuation history must cover every stock price")
        require(scalar(connection, "SELECT COUNT(*) FROM etf_metrics m JOIN etfs e ON e.id=m.etf_id WHERE e.asset_class='Stock' AND (m.pe_ratio IS NULL OR m.pb_ratio IS NULL)") == 0, "Stock valuation is missing")
        require(scalar(connection, "SELECT COUNT(*) FROM etf_metrics m JOIN etfs e ON e.id=m.etf_id WHERE e.asset_class<>'Stock' AND (m.pe_ratio IS NOT NULL OR m.pb_ratio IS NOT NULL)") == 0, "Non-stock valuation must be null")

        for row in connection.execute("SELECT * FROM valuation_snapshots"):
            values = [row["market_value"], row["aggregate_earnings"], row["aggregate_book_value"], row["pe_ratio"], row["pb_ratio"]]
            require(all(math.isfinite(value) for value in values), "Non-finite valuation value")
            require(row["aggregate_earnings"] > 1e-9 and row["aggregate_book_value"] > 1e-9, "Invalid valuation denominator")
            require(math.isclose(row["pe_ratio"], row["market_value"] / row["aggregate_earnings"], rel_tol=1e-6), "P/E formula mismatch")
            require(math.isclose(row["pb_ratio"], row["market_value"] / row["aggregate_book_value"], rel_tol=1e-6), "P/B formula mismatch")

        require(scalar(connection, "SELECT COUNT(*) FROM price_history p JOIN etfs e ON e.id=p.etf_id WHERE p.date<e.inception_date") == 0, "Price precedes inception")
        require(scalar(connection, "SELECT COUNT(*) FROM (SELECT etf_id,date FROM price_history GROUP BY etf_id,date HAVING COUNT(*)>1)") == 0, "Duplicate price date")
        require(scalar(connection, "SELECT COUNT(*) FROM return_history WHERE total_return_index<=0") == 0, "Invalid total-return index")
        previous_by_etf: dict[int, tuple[float, date, float]] = {}
        for row in connection.execute("SELECT p.etf_id,p.date,p.close_price,p.currency,e.trading_currency,e.assumed_annual_distribution_yield,r.daily_price_return_pct,r.daily_total_return_pct,r.total_return_index,r.cumulative_total_return_pct FROM price_history p JOIN etfs e ON e.id=p.etf_id JOIN return_history r ON r.etf_id=p.etf_id AND r.date=p.date ORDER BY p.etf_id,p.date"):
            values = [row["close_price"], row["daily_price_return_pct"], row["daily_total_return_pct"], row["total_return_index"], row["cumulative_total_return_pct"]]
            require(all(math.isfinite(value) for value in values), "Non-finite price/return value")
            require(row["currency"] == row["trading_currency"], "Price currency mismatch")
            current_date = date.fromisoformat(row["date"])
            require(current_date.weekday() < 5, "Weekend price observation")
            previous = previous_by_etf.get(row["etf_id"])
            if previous is None:
                expected_price_return = expected_total_return = 0.0
                expected_index = 100.0
            else:
                previous_price, previous_date, previous_index = previous
                expected_price_return = row["close_price"] / previous_price - 1
                expected_total_return = expected_price_return + row["assumed_annual_distribution_yield"] * ((current_date - previous_date).days / 365.25)
                expected_index = previous_index * (1 + expected_total_return)
            require(math.isclose(row["daily_price_return_pct"], expected_price_return * 100, rel_tol=1e-10, abs_tol=1e-10), "Daily price-return mismatch")
            require(math.isclose(row["daily_total_return_pct"], expected_total_return * 100, rel_tol=1e-10, abs_tol=1e-10), "Daily total-return mismatch")
            require(math.isclose(row["total_return_index"], expected_index, rel_tol=1e-10), "Total-return index mismatch")
            require(math.isclose(row["cumulative_total_return_pct"], row["total_return_index"] - 100, rel_tol=1e-10, abs_tol=1e-10), "Cumulative return mismatch")
            previous_by_etf[row["etf_id"]] = (row["close_price"], current_date, row["total_return_index"])

        prices: dict[int, list[tuple[str, float]]] = defaultdict(list)
        for row in connection.execute("SELECT etf_id,date,close_price FROM price_history ORDER BY etf_id,date"):
            prices[row["etf_id"]].append((row["date"], row["close_price"]))
        snapshots: dict[str, list[sqlite3.Row]] = defaultdict(list)
        for row in connection.execute("SELECT * FROM valuation_snapshots ORDER BY tracking_index,report_date"):
            snapshots[row["tracking_index"]].append(row)
        price_dates = {etf_id: [item[0] for item in values] for etf_id, values in prices.items()}
        snapshot_dates = {tracking_index: [item["report_date"] for item in values] for tracking_index, values in snapshots.items()}
        for row in connection.execute("SELECT v.etf_id,v.date,v.pe_ratio,v.pb_ratio,e.tracking_index FROM valuation_history v JOIN etfs e ON e.id=v.etf_id ORDER BY v.etf_id,v.date"):
            index_snapshots = snapshots[row["tracking_index"]]
            snapshot_position = bisect_right(snapshot_dates[row["tracking_index"]], row["date"]) - 1
            require(snapshot_position >= 0, "Valuation has no applicable fundamental report")
            snapshot = index_snapshots[snapshot_position]
            etf_prices = prices[row["etf_id"]]
            etf_price_dates = price_dates[row["etf_id"]]
            reference_position = max(0, bisect_right(etf_price_dates, snapshot["report_date"]) - 1)
            current_position = bisect_right(etf_price_dates, row["date"]) - 1
            reference_price = etf_prices[reference_position][1]
            current_price = etf_prices[current_position][1]
            expected_pe = current_price / (reference_price * snapshot["aggregate_earnings"] / snapshot["market_value"])
            expected_pb = current_price / (reference_price * snapshot["aggregate_book_value"] / snapshot["market_value"])
            require(math.isclose(row["pe_ratio"], expected_pe, rel_tol=1e-10), "Daily P/E mismatch")
            require(math.isclose(row["pb_ratio"], expected_pb, rel_tol=1e-10), "Daily P/B mismatch")

        indexes = set()
        for table in ("etfs", "price_history", "return_history", "valuation_history"):
            indexes.update(row[1] for row in connection.execute(f"PRAGMA index_list('{table}')"))
        require(EXPECTED_INDEXES <= indexes, f"Missing required indexes: {EXPECTED_INDEXES - indexes}")
    finally:
        connection.close()
    print("Database and financial-data validation passed.")


if __name__ == "__main__":
    main()
