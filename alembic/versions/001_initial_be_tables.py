"""Initial be_ tables

Revision ID: 001_initial_be_tables
Revises:
Create Date: 2026-10-03 12:48:00.000000

"""
from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = '001_initial_be_tables'
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # Create be_ingest_runs table
    op.create_table(
        'be_ingest_runs',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('source', sa.String(), nullable=False),
        sa.Column('city_id', sa.String(), nullable=True),
        sa.Column('started_at', sa.DateTime(), nullable=False),
        sa.Column('finished_at', sa.DateTime(), nullable=True),
        sa.Column('status', sa.String(), nullable=True),
        sa.Column('rows_fetched', sa.Integer(), nullable=True),
        sa.Column('rows_upserted', sa.Integer(), nullable=True),
        sa.Column('error', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_be_ingest_runs_source'), 'be_ingest_runs', ['source'], unique=False)
    op.create_index(op.f('ix_be_ingest_runs_city_id'), 'be_ingest_runs', ['city_id'], unique=False)

    # Create be_raw_cache_index table
    op.create_table(
        'be_raw_cache_index',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('source', sa.String(), nullable=False),
        sa.Column('city_id', sa.String(), nullable=True),
        sa.Column('timestamp', sa.DateTime(), nullable=False),
        sa.Column('file_path', sa.String(), nullable=False),
        sa.Column('record_count', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_be_raw_cache_index_source'), 'be_raw_cache_index', ['source'], unique=False)
    op.create_index(op.f('ix_be_raw_cache_index_timestamp'), 'be_raw_cache_index', ['timestamp'], unique=False)

    # Create be_model_config table
    op.create_table(
        'be_model_config',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('version', sa.String(), nullable=False),
        sa.Column('config_yaml', sa.Text(), nullable=False),
        sa.Column('activated_at', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('version')
    )


def downgrade() -> None:
    op.drop_table('be_model_config')
    op.drop_index(op.f('ix_be_raw_cache_index_timestamp'), table_name='be_raw_cache_index')
    op.drop_index(op.f('ix_be_raw_cache_index_source'), table_name='be_raw_cache_index')
    op.drop_table('be_raw_cache_index')
    op.drop_index(op.f('ix_be_ingest_runs_city_id'), table_name='be_ingest_runs')
    op.drop_index(op.f('ix_be_ingest_runs_source'), table_name='be_ingest_runs')
    op.drop_table('be_ingest_runs')
