"""Shared command-line and deterministic-generation helpers."""

import argparse
from datetime import date, timedelta

DEFAULT_SEED = 42


def last_working_day_before(today: date) -> date:
    candidate = today - timedelta(days=1)
    while candidate.weekday() >= 5:
        candidate -= timedelta(days=1)
    return candidate


def parse_iso_date(value: str) -> date:
    try:
        return date.fromisoformat(value)
    except ValueError as error:
        raise argparse.ArgumentTypeError("end date must use YYYY-MM-DD") from error


def seed_argument(description: str) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=description)
    parser.add_argument("--seed", type=int, default=DEFAULT_SEED, help=f"deterministic seed (default: {DEFAULT_SEED})")
    parser.add_argument("--end-date", type=parse_iso_date, help="inclusive Monday–Friday generation end date (default: last working day before today)")
    args = parser.parse_args()
    latest_permitted_date = last_working_day_before(date.today())
    args.end_date = args.end_date or latest_permitted_date
    if args.end_date.weekday() >= 5:
        parser.error("--end-date must be a Monday–Friday working day")
    if args.end_date > latest_permitted_date:
        parser.error(f"--end-date cannot be after the last working day before today ({latest_permitted_date.isoformat()})")
    return args
