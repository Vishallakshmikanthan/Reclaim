"""Preflight check CLI script for RECLAIM."""
import sys
from ..repositories.factory import repository_context
from ..services.application import Services

def run_preflight() -> int:
    print("=" * 60)
    print("RECLAIM -- SYSTEM PREFLIGHT & DEMO READINESS CHECK")
    print("=" * 60)
    
    try:
        with repository_context() as repo:
            svc = Services(repo)
            res = svc.preflight_check()
            
            print(f"Overall Status: [{res.status}]")
            print(f"Provider Mode:  {res.provider_mode}")
            print(f"AI Mode:        {res.ai_mode}")
            print("-" * 60)
            print("Component Checks:")
            for c in res.checks:
                status_icon = "OK" if c.status == "READY" else "WARN" if c.status == "WARNING" else "FAIL"
                print(f"  [{status_icon:4}] {c.name:32}: {c.status} - {c.details}")
            print("-" * 60)
            print(f"Summary: {res.summary}")
            print("=" * 60)
            return 0 if res.status == "READY" else 1
    except Exception as e:
        print(f"CRITICAL PREFLIGHT FAILURE: {e}")
        print("=" * 60)
        return 1

if __name__ == "__main__":
    sys.exit(run_preflight())
