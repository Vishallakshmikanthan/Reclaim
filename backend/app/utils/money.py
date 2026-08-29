"""Money stays in integer minor units (paise); floats are rejected."""
def ensure_minor_units(value: int) -> int:
    if isinstance(value, bool) or not isinstance(value, int) or value < 0:
        raise ValueError("Money must be a non-negative integer amount in minor units.")
    return value
