"""ORM models (initial subset). Use Alembic later for migrations."""
from __future__ import annotations
from datetime import datetime
from enum import Enum
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship
from sqlalchemy import String, DateTime, ForeignKey, Text, Boolean, Numeric, Table, Column
import uuid

class Base(DeclarativeBase):
    pass

def _uuid() -> str:
    return str(uuid.uuid4())

class ModuleEnum(str, Enum):
    accounting = "accounting"
    partner_check = "partner_check"  # Изменено на snake_case для соответствия схеме БД
    secretary = "secretary"
    marketing = "marketing"
    
class SubmissionFrequency(str, Enum):
    """Enum for submission frequency."""
    quarterly = "quarterly"
    annually = "annually"

class SubmissionStatus(str, Enum):
    """Enum for submission status."""
    submitted = "submitted"
    processing = "processing"
    error = "error"
    accepted = "accepted"

# Many-to-many relationship table for transactions in submissions
submission_transactions = Table(
    'submission_transactions',
    Base.metadata,
    Column('submission_id', String, ForeignKey('submissions.id')),
    Column('transaction_id', String, ForeignKey('transactions.id'))
)

class User(Base):
    __tablename__ = "users"
    id: Mapped[str] = mapped_column(String, primary_key=True, default=_uuid)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    role: Mapped[str] = mapped_column(String(32), default="user")
    subscription_status: Mapped[str] = mapped_column(String(32), default="trial")
    last_login_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    threads: Mapped[list[ConversationThread]] = relationship(back_populates="user")  # type: ignore
    profile: Mapped["UserProfile"] = relationship(back_populates="user", uselist=False, cascade="all, delete-orphan")  # type: ignore
    stripe_account: Mapped["UserStripeAccount"] = relationship(back_populates="user", uselist=False, cascade="all, delete-orphan")  # type: ignore
    elster_account: Mapped["UserElsterAccount"] = relationship(back_populates="user", uselist=False, cascade="all, delete-orphan")  # type: ignore
    transactions: Mapped[list["Transaction"]] = relationship(back_populates="user")  # type: ignore
    submissions: Mapped[list["Submission"]] = relationship(back_populates="user")  # type: ignore

class ConversationThread(Base):
    __tablename__ = "conversation_threads"
    id: Mapped[str] = mapped_column(String, primary_key=True, default=_uuid)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    module: Mapped[str] = mapped_column(String(32))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    user: Mapped[User] = relationship(back_populates="threads")  # type: ignore
    messages: Mapped[list[Message]] = relationship(back_populates="thread", cascade="all, delete-orphan")  # type: ignore

class Message(Base):
    __tablename__ = "messages"
    id: Mapped[str] = mapped_column(String, primary_key=True, default=_uuid)
    thread_id: Mapped[str] = mapped_column(ForeignKey("conversation_threads.id", ondelete="CASCADE"))
    role: Mapped[str] = mapped_column(String(16))  # user / ai
    content: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    thread: Mapped[ConversationThread] = relationship(back_populates="messages")  # type: ignore
    
class UserProfile(Base):
    __tablename__ = "user_profiles"
    id: Mapped[str] = mapped_column(String, primary_key=True, default=_uuid)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), unique=True)
    company_name: Mapped[str] = mapped_column(String(255))
    vat_id: Mapped[str] = mapped_column(String(50))
    address: Mapped[str] = mapped_column(String(255))
    country: Mapped[str] = mapped_column(String(100))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    user: Mapped[User] = relationship(back_populates="profile")  # type: ignore
    
class UserStripeAccount(Base):
    """User Stripe account model."""
    __tablename__ = "user_stripe_accounts"
    
    id: Mapped[str] = mapped_column(String, primary_key=True, default=_uuid)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), unique=True)
    api_key: Mapped[str] = mapped_column(String(255))  # In production, this should be encrypted
    is_connected: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    
    user: Mapped[User] = relationship(back_populates="stripe_account")  # type: ignore

class UserElsterAccount(Base):
    """User ELSTER account model."""
    __tablename__ = "user_elster_accounts"
    
    id: Mapped[str] = mapped_column(String, primary_key=True, default=_uuid)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), unique=True)
    tax_id: Mapped[str] = mapped_column(String(50))
    is_connected: Mapped[bool] = mapped_column(Boolean, default=False)
    frequency: Mapped[str] = mapped_column(String(20), default=SubmissionFrequency.quarterly.value)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    
    # Additional tax form data
    full_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    street_address: Mapped[str | None] = mapped_column(String(255), nullable=True)
    city: Mapped[str | None] = mapped_column(String(100), nullable=True)
    postal_code: Mapped[str | None] = mapped_column(String(20), nullable=True)
    bank_name: Mapped[str | None] = mapped_column(String(100), nullable=True)
    iban: Mapped[str | None] = mapped_column(String(50), nullable=True)
    
    user: Mapped[User] = relationship(back_populates="elster_account")  # type: ignore
    
class Transaction(Base):
    """Transaction model."""
    __tablename__ = "transactions"
    
    id: Mapped[str] = mapped_column(String, primary_key=True, default=_uuid)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    stripe_id: Mapped[str | None] = mapped_column(String(255), nullable=True)  # Original Stripe transaction ID
    date: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    description: Mapped[str] = mapped_column(String(255), nullable=False)
    amount: Mapped[float] = mapped_column(Numeric(precision=10, scale=2), nullable=False)
    currency: Mapped[str] = mapped_column(String(3), default="EUR")
    status: Mapped[str] = mapped_column(String(20), default="succeeded")
    tax_amount: Mapped[float | None] = mapped_column(Numeric(precision=10, scale=2), nullable=True)
    is_expense_claimed: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    
    user: Mapped[User] = relationship(back_populates="transactions")  # type: ignore
    submissions: Mapped[list["Submission"]] = relationship(secondary=submission_transactions, back_populates="transactions")  # type: ignore

class Submission(Base):
    """Tax submission model."""
    __tablename__ = "submissions"
    
    id: Mapped[str] = mapped_column(String, primary_key=True, default=_uuid)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    timestamp: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    period: Mapped[str] = mapped_column(String(20), nullable=False)  # e.g., 'Q2 2024'
    status: Mapped[str] = mapped_column(String(20), default=SubmissionStatus.submitted.value)
    
    user: Mapped[User] = relationship(back_populates="submissions")  # type: ignore
    transactions: Mapped[list[Transaction]] = relationship(secondary=submission_transactions, back_populates="submissions")  # type: ignore
