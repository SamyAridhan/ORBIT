"""Placeholder constants for the ORBIT MAS backend.

Every value here is a PLACEHOLDER (00_MASTER_CONTEXT.md "Placeholder values — not
finalized"): set at build time, tuned during development, never presented as
settled. Keep them here, not as magic numbers in the logic.
"""

from datetime import timedelta

#: How long an app signal counts before it is dropped as stale, if nothing
#: updates it. 01 Stop Agent "When a signal stops counting": 30 minutes is the
#: starting value. PLACEHOLDER.
SIGNAL_EXPIRY: timedelta = timedelta(minutes=30)

#: Strange-count rule, first layer (01 Stop Agent "Strange counts"): a count is
#: flagged when it is MORE THAN this many times `expected`... PLACEHOLDER.
STRANGE_COUNT_MULTIPLIER: int = 3

#: ...AND at least this many people. Without a floor the multiplier is noise at
#: small numbers ("expected 1, counted 4" is not strange). PLACEHOLDER.
STRANGE_COUNT_MINIMUM: int = 10
