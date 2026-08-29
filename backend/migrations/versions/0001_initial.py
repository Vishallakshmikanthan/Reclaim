"""initial persistent reclaim schema

Revision ID: 0001_initial
Revises:
Create Date: 2026-08-29
"""
from alembic import op
revision="0001_initial"
down_revision=None
branch_labels=None
depends_on=None
def upgrade():
    # Explicit, immutable initial DDL; application startup never calls create_all().
    op.execute("""
    CREATE TABLE merchants (id varchar(64) PRIMARY KEY,business_name varchar(200) NOT NULL,industry varchar(100),currency varchar(3) NOT NULL,timezone varchar(64) NOT NULL,default_language varchar(32) NOT NULL,created_at timestamptz NOT NULL,updated_at timestamptz NOT NULL);
    CREATE TABLE policies (id varchar(36) PRIMARY KEY,merchant_id varchar(64) NOT NULL REFERENCES merchants(id) ON DELETE RESTRICT,version varchar(32) NOT NULL,active boolean NOT NULL,configuration jsonb NOT NULL,created_at timestamptz NOT NULL,created_by varchar(100) NOT NULL,CONSTRAINT uq_policy_merchant_version UNIQUE(merchant_id,version));
    CREATE TABLE payments (id varchar(64) PRIMARY KEY,merchant_id varchar(64) NOT NULL REFERENCES merchants(id) ON DELETE RESTRICT,external_reference varchar(128) NOT NULL,amount_minor integer NOT NULL,currency varchar(3) NOT NULL,status varchar(32) NOT NULL,payment_method varchar(64) NOT NULL,failure_type varchar(64) NOT NULL,created_at timestamptz NOT NULL,updated_at timestamptz NOT NULL,CONSTRAINT uq_payment_merchant_reference UNIQUE(merchant_id,external_reference));
    CREATE TABLE cases (id varchar(64) PRIMARY KEY,merchant_id varchar(64) NOT NULL REFERENCES merchants(id) ON DELETE RESTRICT,payment_id varchar(64) NOT NULL UNIQUE REFERENCES payments(id) ON DELETE RESTRICT,status varchar(32) NOT NULL,priority varchar(16) NOT NULL,failure_type varchar(64) NOT NULL,recovery_probability double precision NOT NULL,expected_recovery_minor integer NOT NULL,payload jsonb NOT NULL,retry_count integer NOT NULL,contact_count integer NOT NULL,recovered_amount_minor integer NOT NULL,created_at timestamptz NOT NULL,updated_at timestamptz NOT NULL,resolved_at timestamptz);
    CREATE TABLE recovery_actions (id varchar(64) PRIMARY KEY,case_id varchar(64) NOT NULL REFERENCES cases(id) ON DELETE RESTRICT,merchant_id varchar(64) NOT NULL REFERENCES merchants(id) ON DELETE RESTRICT,action_type varchar(64) NOT NULL,status varchar(32) NOT NULL,idempotency_key varchar(255) NOT NULL,policy_version varchar(32) NOT NULL,amount_minor integer NOT NULL,verification_status varchar(32) NOT NULL,transaction_id varchar(128),failure_code varchar(64),failure_reason text,created_at timestamptz NOT NULL,started_at timestamptz,completed_at timestamptz,CONSTRAINT uq_action_merchant_key UNIQUE(merchant_id,idempotency_key));
    CREATE TABLE campaigns (id varchar(64) PRIMARY KEY,merchant_id varchar(64) NOT NULL REFERENCES merchants(id) ON DELETE RESTRICT,name varchar(200) NOT NULL,type varchar(64) NOT NULL,status varchar(32) NOT NULL,configuration jsonb NOT NULL,created_at timestamptz NOT NULL,updated_at timestamptz NOT NULL,started_at timestamptz,completed_at timestamptz,paused_at timestamptz);
    CREATE TABLE campaign_cases (campaign_id varchar(64) REFERENCES campaigns(id) ON DELETE RESTRICT,case_id varchar(64) REFERENCES cases(id) ON DELETE RESTRICT,status varchar(32) NOT NULL,created_at timestamptz NOT NULL,PRIMARY KEY(campaign_id,case_id));
    CREATE TABLE communications (id varchar(64) PRIMARY KEY,merchant_id varchar(64) NOT NULL REFERENCES merchants(id) ON DELETE RESTRICT,case_id varchar(64) NOT NULL REFERENCES cases(id) ON DELETE RESTRICT,campaign_id varchar(64) REFERENCES campaigns(id) ON DELETE RESTRICT,channel varchar(32) NOT NULL,language varchar(32) NOT NULL,status varchar(32) NOT NULL,contact_number varchar(32),message text NOT NULL,created_at timestamptz NOT NULL,sent_at timestamptz,failed_at timestamptz,failure_reason text);
    CREATE TABLE audit_events (id varchar(64) PRIMARY KEY,merchant_id varchar(64) NOT NULL REFERENCES merchants(id) ON DELETE RESTRICT,event_type varchar(64) NOT NULL,case_id varchar(64) REFERENCES cases(id) ON DELETE RESTRICT,campaign_id varchar(64) REFERENCES campaigns(id) ON DELETE RESTRICT,recovery_action_id varchar(64) REFERENCES recovery_actions(id) ON DELETE RESTRICT,policy_version varchar(32),actor varchar(100) NOT NULL,timestamp timestamptz NOT NULL,metadata jsonb NOT NULL);
    CREATE TABLE evaluation_runs (id varchar(64) PRIMARY KEY,merchant_id varchar(64) NOT NULL REFERENCES merchants(id) ON DELETE RESTRICT,status varchar(32) NOT NULL,metrics jsonb NOT NULL,created_at timestamptz NOT NULL);
    CREATE TABLE failure_events (id varchar(36) PRIMARY KEY,merchant_id varchar(64) NOT NULL REFERENCES merchants(id) ON DELETE RESTRICT,service varchar(64) NOT NULL,scenario varchar(64) NOT NULL,created_at timestamptz NOT NULL);
    CREATE INDEX ix_case_merchant_status ON cases(merchant_id,status); CREATE INDEX ix_case_merchant_failure ON cases(merchant_id,failure_type); CREATE INDEX ix_case_merchant_created ON cases(merchant_id,created_at); CREATE INDEX ix_action_case ON recovery_actions(case_id); CREATE INDEX ix_campaign_merchant_status ON campaigns(merchant_id,status); CREATE INDEX ix_communication_case ON communications(case_id); CREATE INDEX ix_audit_case_timestamp ON audit_events(case_id,timestamp); CREATE INDEX ix_audit_merchant_timestamp ON audit_events(merchant_id,timestamp);
    """)
def downgrade():
    op.execute("DROP TABLE failure_events,audit_events,communications,campaign_cases,campaigns,recovery_actions,cases,payments,policies,evaluation_runs,merchants CASCADE")
