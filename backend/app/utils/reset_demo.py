"""CLI script to reset RECLAIM demo state cleanly and deterministically."""
import sys
from ..repositories.factory import repository_context
from ..services.application import Services

def run_reset() -> int:
    print("=" * 60)
    print("RECLAIM -- RESETTING DEMO STATE TO DETERMINISTIC BASELINE")
    print("=" * 60)
    try:
        with repository_context() as repo:
            svc = Services(repo)
            res = svc.reset_demo_state()
            print(f"Status:       {res.status}")
            print(f"Cases Seeded: {res.cases_seeded}")
            print(f"Policy:       {res.policy_version}")
            print(f"Message:      {res.message}")
            print("=" * 60)
            return 0
    except Exception as e:
        print(f"ERROR RESETTING DEMO STATE: {e}")
        print("=" * 60)
        return 1

if __name__ == "__main__":
    sys.exit(run_reset())
