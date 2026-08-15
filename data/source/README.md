# Local ETF fixtures

`etfs.csv` contains 17 fictional, illustrative ETFs. Each is designed to track
one of the requested indices at a high level. Names, issuers, identifiers,
fees, fund sizes, inception dates, and all performance figures are toy data;
they do not describe a real fund, market price, or investment result.

`price_history.csv` contains five years of synthetic month-end closing prices
(January 2021 through December 2025) for each ETF, in its local trading
currency, plus a 2020-12-31 baseline used to calculate the five-year return.

`return_history.csv` contains the corresponding monthly price return, monthly
total return (including an illustrative reinvested dividend assumption), a
total-return index starting at 100, and cumulative total return. Use this file
for normalized-performance charts.

Both files are generated deterministically by
`scripts/generate_price_history.py` using illustrative return, volatility, and
dividend-yield assumptions—never a market-data feed.

`etfs.csv` also includes illustrative P/E and P/B snapshots and return summary
columns. Rerun `scripts/refresh_etf_summary.py` after regenerating return
history to refresh its 1M, 3M, 6M, YTD, 1Y, 3Y, and 5Y total returns. The
since-inception figure is a separate long-run toy estimate because the local
history begins in December 2020.

These CSV files are the version-controlled source of truth. Phase 1 will add
the accompanying metrics fixture, then seed the local SQLite database from
them.
