"""Regenerate twice and prove same-seed CSV and logical SQLite reproducibility."""

import argparse
import hashlib
import sqlite3
import subprocess
import sys
from datetime import date
from pathlib import Path

from generation import last_working_day_before, parse_iso_date

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "data" / "source"
DATABASE = ROOT / "data" / "simple_etf.sqlite"


def digest_source() -> str:
    digest = hashlib.sha256()
    for path in sorted(path for path in SOURCE.rglob("*") if path.is_file() and path.name != ".DS_Store"):
        digest.update(path.relative_to(SOURCE).as_posix().encode())
        digest.update(b"\0")
        digest.update(path.read_bytes())
    return digest.hexdigest()


def digest_database() -> str:
    digest = hashlib.sha256()
    connection = sqlite3.connect(DATABASE)
    try:
        for statement in connection.iterdump():
            digest.update(statement.encode())
            digest.update(b"\n")
    finally:
        connection.close()
    return digest.hexdigest()


def build(seed: int, end_date: date) -> tuple[str, str]:
    subprocess.run([sys.executable, "scripts/generate_data.py", "--seed", str(seed), "--end-date", end_date.isoformat()], cwd=ROOT, check=True)
    subprocess.run([sys.executable, "scripts/seed_database.py"], cwd=ROOT, check=True)
    subprocess.run([sys.executable, "scripts/verify_database.py"], cwd=ROOT, check=True)
    return digest_source(), digest_database()


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--seed", type=int, default=42)
    parser.add_argument("--end-date", type=parse_iso_date)
    args = parser.parse_args()
    end_date = args.end_date or last_working_day_before(date.today())
    first = build(args.seed, end_date)
    second = build(args.seed, end_date)
    if first != second:
        raise AssertionError(f"Reproducibility failed: first={first}, second={second}")
    print(f"Reproducibility passed for seed {args.seed} and end date {end_date}: CSV {first[0]}, SQLite {first[1]}")


if __name__ == "__main__":
    main()
