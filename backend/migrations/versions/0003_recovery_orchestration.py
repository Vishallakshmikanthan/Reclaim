"""add recovery batches and batch items

Revision ID: 0003_recovery_orchestration
Revises: 0002_razorpay_provider
Create Date: 2026-08-29
"""
from alembic import op

revision = "0003_recovery_orchestration"
down_revision = "0002_razorpay_provider"
branch_labels = None
depends_on = None

def upgrade():
    op.execute("""
    CREATE TABLE IF NOT EXISTS recovery_batches (
        id varchar(64) PRIMARY KEY,
        merchant_id varchar(64) NOT NULL REFERENCES merchants(id) ON DELETE RESTRICT,
        status varchar(32) NOT NULL DEFAULT 'PREVIEW',
        idempotency_key varchar(255) NOT NULL,
        selection_criteria jsonb NOT NULL DEFAULT '{}'::jsonb,
        batch_size integer NOT NULL DEFAULT 0,
        total_revenue_at_risk_minor integer NOT NULL DEFAULT 0,
        eligible_revenue_minor integer NOT NULL DEFAULT 0,
        blocked_revenue_minor integer NOT NULL DEFAULT 0,
        attempted_recovery_minor integer NOT NULL DEFAULT 0,
        recovered_revenue_minor integer NOT NULL DEFAULT 0,
        failed_recovery_minor integer NOT NULL DEFAULT 0,
        pending_recovery_minor integer NOT NULL DEFAULT 0,
        cases_selected integer NOT NULL DEFAULT 0,
        cases_eligible integer NOT NULL DEFAULT 0,
        cases_blocked integer NOT NULL DEFAULT 0,
        cases_attempted integer NOT NULL DEFAULT 0,
        cases_recovered integer NOT NULL DEFAULT 0,
        cases_failed integer NOT NULL DEFAULT 0,
        cases_pending integer NOT NULL DEFAULT 0,
        ai_analysis jsonb,
        summary_metadata jsonb,
        created_at timestamptz NOT NULL,
        started_at timestamptz,
        completed_at timestamptz,
        cancelled_at timestamptz,
        CONSTRAINT uq_batch_merchant_key UNIQUE(merchant_id, idempotency_key)
    );
    CREATE INDEX IF NOT EXISTS ix_batch_merchant_status ON recovery_batches(merchant_id, status);
    CREATE INDEX IF NOT EXISTS ix_batch_merchant_created ON recovery_batches(merchant_id, created_at);

    CREATE TABLE IF NOT EXISTS recovery_batch_items (
        id varchar(64) PRIMARY KEY,
        batch_id varchar(64) NOT NULL REFERENCES recovery_batches(id) ON DELETE CASCADE,
        case_id varchar(64) NOT NULL REFERENCES cases(id) ON DELETE RESTRICT,
        merchant_id varchar(64) NOT NULL REFERENCES merchants(id) ON DELETE RESTRICT,
        priority_score integer NOT NULL DEFAULT 0,
        priority_tier varchar(16) NOT NULL DEFAULT 'Medium',
        amount_minor integer NOT NULL DEFAULT 0,
        expected_recovery_minor integer NOT NULL DEFAULT 0,
        policy_allowed boolean NOT NULL DEFAULT true,
        blocked_rules jsonb NOT NULL DEFAULT '[]'::jsonb,
        recommended_intervention varchar(64) NOT NULL DEFAULT 'RETRY_PAYMENT',
        strategy varchar(64) NOT NULL DEFAULT 'retry_payment',
        decision_source varchar(32) NOT NULL DEFAULT 'DETERMINISTIC_FALLBACK',
        status varchar(32) NOT NULL DEFAULT 'PENDING',
        recovery_action_id varchar(64) REFERENCES recovery_actions(id) ON DELETE SET NULL,
        execution_error text,
        created_at timestamptz NOT NULL,
        executed_at timestamptz,
        CONSTRAINT uq_batch_item_batch_case UNIQUE(batch_id, case_id)
    );
    CREATE INDEX IF NOT EXISTS ix_batch_item_case ON recovery_batch_items(case_id);
    CREATE INDEX IF NOT EXISTS ix_batch_item_batch ON recovery_batch_items(batch_id);
    """)

def downgrade():
    op.execute("""
    DROP TABLE IF EXISTS recovery_batch_items CASCADE;
    DROP TABLE IF EXISTS recovery_batches CASCADE;
    """)
