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
