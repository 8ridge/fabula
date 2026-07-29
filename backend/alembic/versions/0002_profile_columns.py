"""profile: username, email_verified, avatar_url, token_version; бэкфилл ника

Revision ID: 0002
Revises: 0001
"""
from alembic import op
import sqlalchemy as sa

revision = "0002"
down_revision = "0001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # username: сначала nullable, бэкфиллим, потом not-null + unique.
    op.add_column("users", sa.Column("username", sa.String(20), nullable=True))
    op.add_column("users", sa.Column("email_verified", sa.Boolean(), server_default=sa.true(), nullable=False))
    op.add_column("users", sa.Column("avatar_url", sa.String(500), nullable=True))
    op.add_column("users", sa.Column("token_version", sa.Integer(), server_default="0", nullable=False))

    # Бэкфилл: ник из части email до @, только допустимые символы, обрезка до 20,
    # при коллизии добавляем id. Существующих юзеров мало (тестовые).
    bind = op.get_bind()
    rows = bind.execute(sa.text("SELECT id, email FROM users")).fetchall()
    used = set()
    import re
    for uid, email in rows:
        base = re.sub(r"[^A-Za-z0-9_]", "", (email or "").split("@")[0])[:20] or f"user{uid}"
        if len(base) < 3:
            base = (base + "___")[:3]
        name = base
        if name.lower() in used:
            name = (base[:16] + str(uid))[:20]
        used.add(name.lower())
        bind.execute(sa.text("UPDATE users SET username = :u WHERE id = :i"), {"u": name, "i": uid})

    # batch_alter_table — портируемо: на SQLite делает recreate, на Postgres native ALTER.
    with op.batch_alter_table("users") as batch:
        batch.alter_column("username", existing_type=sa.String(20), nullable=False)
        batch.create_unique_constraint("uq_users_username", ["username"])
        batch.create_index("ix_users_username", ["username"])
        batch.drop_column("name")  # ник = отображаемое имя


def downgrade() -> None:
    with op.batch_alter_table("users") as batch:
        batch.add_column(sa.Column("name", sa.String(80), nullable=False, server_default=""))
        batch.drop_index("ix_users_username")
        batch.drop_constraint("uq_users_username", type_="unique")
        batch.drop_column("username")
    op.drop_column("users", "token_version")
    op.drop_column("users", "avatar_url")
    op.drop_column("users", "email_verified")
