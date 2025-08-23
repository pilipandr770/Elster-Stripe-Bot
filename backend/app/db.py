"""Database setup (SQLAlchemy 2.0)"""
from __future__ import annotations
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

def init_engine():
    url = os.getenv("DATABASE_URL", "sqlite:///local.db")
    connect_args = {}
    if url.startswith("sqlite"):  # enable SQLite for local dev if Postgres not up
        connect_args["check_same_thread"] = False
    engine = create_engine(url, echo=False, connect_args=connect_args)
    return engine

def create_session_factory(engine):
    return sessionmaker(bind=engine, expire_on_commit=False, autoflush=False)
