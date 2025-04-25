"""Rename trainer_hours and trainee_hours to trainer_hours and trainee_hours"""

from alembic import op


def upgrade():
    op.alter_column("training", "trainer_hours", new_column_name="trainer_hours")
    op.alter_column("training", "trainee_hours", new_column_name="trainee_hours")


def downgrade():
    op.alter_column("training", "trainer_hours", new_column_name="trainer_hours")
    op.alter_column("training", "trainee_hours", new_column_name="trainee_hours")
