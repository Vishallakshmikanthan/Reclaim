"""add razorpay provider fields and webhook events

Revision ID: 0002_razorpay_provider
Revises: 0001_initial
Create Date: 2026-08-29
"""
from alembic import op

revision = "0002_razorpay_provider"
down_revision = "0001_initial"
branch_labels = None
depends_on = None

def upgrade():
    op.execute("""
    ALTER TABLE recovery_actions ADD COLUMN IF NOT EXISTS provider varchar(32) NOT NULL DEFAULT 'simulated';
    ALTER TABLE recovery_actions ADD COLUMN IF NOT EXISTS provider_order_id varchar(128);
    ALTER TABLE recovery_actions ADD COLUMN IF NOT EXISTS provider_payment_id varchar(128);
    ALTER TABLE recovery_actions ADD COLUMN IF NOT EXISTS provider_status varchar(64);
    ALTER TABLE recovery_actions ADD COLUMN IF NOT EXISTS provider_reference varchar(255);
    CREATE INDEX IF NOT EXISTS ix_action_provider_order ON recovery_actions(merchant_id, provider_order_id);
    CREATE INDEX IF NOT EXISTS ix_action_provider_payment ON recovery_actions(merchant_id, provider_payment_id);
    CREATE TABLE IF NOT EXISTS webhook_events (
        id varchar(64) PRIMARY KEY,
        merchant_id varchar(64) NOT NULL REFERENCES merchants(id) ON DELETE RESTRICT,
        provider varchar(32) NOT NULL,
        event_id varchar(128) NOT NULL,
        event_type varchar(64) NOT NULL,
        payload jsonb NOT NULL,
        processed boolean NOT NULL DEFAULT true,
        created_at timestamptz NOT NULL,
        CONSTRAINT uq_webhook_merchant_event UNIQUE(merchant_id, event_id)
    );
    CREATE INDEX IF NOT EXISTS ix_webhook_merchant_event ON webhook_events(merchant_id, event_id);
    """)

def downgrade():
    op.execute("""
    DROP TABLE IF EXISTS webhook_events CASCADE;
    DROP INDEX IF EXISTS ix_action_provider_payment;
    DROP INDEX IF EXISTS ix_action_provider_order;
    ALTER TABLE recovery_actions DROP COLUMN IF EXISTS provider_reference;
    ALTER TABLE recovery_actions DROP COLUMN IF EXISTS provider_status;
    ALTER TABLE recovery_actions DROP COLUMN IF EXISTS provider_payment_id;
    ALTER TABLE recovery_actions DROP COLUMN IF EXISTS provider_order_id;
    ALTER TABLE recovery_actions DROP COLUMN IF EXISTS provider;
    """)
