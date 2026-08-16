"""Shared command-line and deterministic-generation helpers."""

import argparse

DEFAULT_SEED = 42


def seed_argument(description: str) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=description)
    parser.add_argument("--seed", type=int, default=DEFAULT_SEED, help=f"deterministic seed (default: {DEFAULT_SEED})")
    return parser.parse_args()
