"""Run the complete deterministic CSV generation pipeline."""

import subprocess
import sys
from pathlib import Path

from generation import seed_argument

ROOT = Path(__file__).resolve().parents[1]
GENERATORS = (
    "generate_etf_universe.py",
    "generate_price_history.py",
    "generate_valuation_snapshots.py",
    "generate_metrics_snapshot.py",
)


def main() -> None:
    args = seed_argument(__doc__ or "Generate all source data.")
    for script in GENERATORS:
        subprocess.run([sys.executable, str(ROOT / "scripts" / script), "--seed", str(args.seed), "--end-date", args.end_date.isoformat()], check=True)


if __name__ == "__main__":
    main()
