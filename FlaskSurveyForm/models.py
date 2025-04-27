"""
Database models and functions for the training form application.

This module defines the database schema and functions for interacting with the database.
"""

from sqlalchemy import (
    create_engine,
    Column,
    Integer,
    String,
    Float,
    Date,
    Text,
    Boolean,
    ForeignKey,
    DateTime,
)
from sqlalchemy.orm import declarative_base, sessionmaker, relationship, scoped_session
from sqlalchemy.sql import func
from contextlib import contextmanager
import datetime

DATABASE_URL = "sqlite:///training_forms.db"
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = scoped_session(sessionmaker(bind=engine))
Base = declarative_base()


@contextmanager
def db_session():
    session = SessionLocal()
    try:
        yield session
        session.commit()
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()


class TrainingForm(Base):
    __tablename__ = "training_forms"
    id = Column(Integer, primary_key=True, autoincrement=True)
    training_type = Column(String, nullable=False)
    trainer_name = Column(String)
    supplier_name = Column(String)
    location_type = Column(String, nullable=False)
    location_details = Column(String)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    trainer_hours = Column(Float)
    trainees_data = Column(Text)
    submission_date = Column(DateTime, default=func.now())
    approved = Column(Boolean, default=False)
    concur_claim = Column(String)
    travel_cost = Column(Float, default=0)
    food_cost = Column(Float, default=0)
    materials_cost = Column(Float, default=0)
    other_cost = Column(Float, default=0)
    other_expense_description = Column(Text)
    trainee_hours = Column(Float)
    training_description = Column(Text, nullable=False)
    submitter = Column(String)
    created_at = Column(DateTime, default=func.now())
    attachments = relationship(
        "Attachment", back_populates="training_form", cascade="all, delete-orphan"
    )


class Attachment(Base):
    __tablename__ = "attachments"
    id = Column(Integer, primary_key=True, autoincrement=True)
    training_id = Column(
        Integer, ForeignKey("training_forms.id", ondelete="CASCADE"), nullable=False
    )
    filename = Column(String, nullable=False)
    description = Column(String)
    training_form = relationship("TrainingForm", back_populates="attachments")


class Admin(Base):
    __tablename__ = "admins"
    email = Column(String, primary_key=True)
    first_name = Column(String)
    last_name = Column(String)


def get_admin_by_email(email):
    """Retrieve an admin by their email."""
    with db_session() as session:
        admin = session.query(Admin).filter_by(email=email).first()
        if admin:
            return {
                "email": admin.email,
                "first_name": admin.first_name,
                "last_name": admin.last_name,
            }
        return None


def add_admin(admin_data):
    """Add a new admin to the database."""
    with db_session() as session:
        if session.query(Admin).filter_by(email=admin_data["email"]).first():
            return False  # Admin with this email already exists
        admin = Admin(
            email=admin_data["email"],
            first_name=admin_data["first_name"],
            last_name=admin_data["last_name"],
        )
        session.add(admin)
        return True


def create_tables():
    """Create all database tables if they don't exist and insert default admins."""
    Base.metadata.create_all(bind=engine)
    admin_emails = [
        {"email": "harry@test.com", "first_name": "Harry", "last_name": "Test"},
        {
            "email": "harry.obrien@stryker.com",
            "first_name": "Harry",
            "last_name": "O'Brien",
        },
    ]
    with db_session() as session:
        for adm in admin_emails:
            if not session.query(Admin).filter_by(email=adm["email"]).first():
                session.add(Admin(**adm))


def insert_training_form(form_data):
    """Insert a new training form into the database."""
    from datetime import datetime, date

    def parse_date(val):
        # Accepts date, datetime, or string in 'YYYY-MM-DD' format
        if isinstance(val, date) and not isinstance(val, datetime):
            return val
        if isinstance(val, datetime):
            return val.date()
        if isinstance(val, str):
            try:
                return datetime.strptime(val, "%Y-%m-%d").date()
            except Exception:
                pass
        return None

    with db_session() as session:
        form = TrainingForm(
            training_type=form_data["training_type"],
            trainer_name=form_data.get("trainer_name"),
            supplier_name=form_data.get("supplier_name"),
            location_type=form_data["location_type"],
            location_details=form_data.get("location_details"),
            start_date=parse_date(form_data["start_date"]),
            end_date=parse_date(form_data["end_date"]),
            trainer_hours=form_data.get("trainer_hours"),
            trainees_data=form_data.get("trainees_data"),
            approved=form_data.get("approved", False),
            concur_claim=form_data.get("concur_claim"),
            travel_cost=form_data.get("travel_cost", 0),
            food_cost=form_data.get("food_cost", 0),
            materials_cost=form_data.get("materials_cost", 0),
            other_cost=form_data.get("other_cost", 0),
            other_expense_description=form_data.get("other_expense_description"),
            trainee_hours=form_data.get("trainee_hours"),
            training_description=form_data["training_description"],
            submitter=form_data.get("submitter"),
        )
        session.add(form)
        session.flush()
        return form.id


def update_training_form(form_id, form_data):
    """Update an existing training form in the database."""
    from datetime import datetime, date

    def parse_date(val):
        if isinstance(val, date) and not isinstance(val, datetime):
            return val
        if isinstance(val, datetime):
            return val.date()
        if isinstance(val, str):
            try:
                return datetime.strptime(val, "%Y-%m-%d").date()
            except Exception:
                pass
        return None

    with db_session() as session:
        form = session.query(TrainingForm).filter_by(id=form_id).first()
        if not form:
            return False
        for key, value in form_data.items():
            if hasattr(form, key):
                if key in ("start_date", "end_date"):
                    setattr(form, key, parse_date(value))
                else:
                    setattr(form, key, value)
        return True


def get_training_form(form_id):
    """Get a training form by ID"""
    with db_session() as session:
        form = session.query(TrainingForm).filter_by(id=form_id).first()
        if form:
            return {
                "id": form.id,
                "training_type": form.training_type,
                "trainer_name": form.trainer_name,
                "supplier_name": form.supplier_name,
                "location_type": form.location_type,
                "location_details": form.location_details,
                "start_date": form.start_date.isoformat() if form.start_date else None,
                "end_date": form.end_date.isoformat() if form.end_date else None,
                "trainer_hours": form.trainer_hours,
                "trainees_data": form.trainees_data,
                "submission_date": (
                    form.submission_date.isoformat() if form.submission_date else None
                ),
                "travel_cost": float(form.travel_cost or 0),
                "food_cost": float(form.food_cost or 0),
                "materials_cost": float(form.materials_cost or 0),
                "other_cost": float(form.other_cost or 0),
                "concur_claim": form.concur_claim,
                "other_expense_description": form.other_expense_description,
                "approved": bool(form.approved),
                "trainee_hours": form.trainee_hours or 0.0,
                "training_description": form.training_description,
                "submitter": form.submitter,
            }
        return None


def get_all_training_forms(
    search_term="",
    date_from=None,
    date_to=None,
    training_type=None,
    sort_by="submission_date",
    sort_order="DESC",
    page=1,
):
    """Get all training forms with optional filtering and pagination"""
    with db_session() as session:
        query = session.query(TrainingForm)
        if search_term:
            like_term = f"%{search_term}%"
            query = query.filter(
                (TrainingForm.trainer_name.like(like_term))
                | (TrainingForm.supplier_name.like(like_term))
                | (TrainingForm.location_details.like(like_term))
            )
        if date_from:
            query = query.filter(TrainingForm.start_date >= date_from)
        if date_to:
            query = query.filter(TrainingForm.end_date <= date_to)
        if training_type:
            query = query.filter(TrainingForm.training_type == training_type)
        total_count = query.count()
        if sort_order.upper() == "DESC":
            query = query.order_by(getattr(TrainingForm, sort_by).desc())
        else:
            query = query.order_by(getattr(TrainingForm, sort_by))
        forms = query.offset((page - 1) * 10).limit(10).all()
        result = []
        for form in forms:
            result.append(
                {
                    "id": form.id,
                    "training_type": form.training_type,
                    "trainer_name": form.trainer_name,
                    "supplier_name": form.supplier_name,
                    "location_type": form.location_type,
                    "location_details": form.location_details,
                    "start_date": (
                        form.start_date.isoformat() if form.start_date else None
                    ),
                    "end_date": form.end_date.isoformat() if form.end_date else None,
                    "trainer_hours": form.trainer_hours,
                    "trainees_data": form.trainees_data,
                    "submission_date": (
                        form.submission_date.isoformat()
                        if form.submission_date
                        else None
                    ),
                    "approved": bool(form.approved),
                    "submitter": form.submitter,
                }
            )
        return result, total_count


def get_approved_forms_for_export():
    """Get all approved training forms for export, without pagination."""
    with db_session() as session:
        forms = (
            session.query(TrainingForm)
            .filter_by(approved=True)
            .order_by(TrainingForm.submission_date.desc())
            .all()
        )
        result = []
        for form in forms:
            result.append(
                {
                    "id": form.id,
                    "training_type": form.training_type,
                    "trainer_name": form.trainer_name,
                    "supplier_name": form.supplier_name,
                    "location_type": form.location_type,
                    "location_details": form.location_details,
                    "start_date": (
                        form.start_date.isoformat() if form.start_date else None
                    ),
                    "end_date": form.end_date.isoformat() if form.end_date else None,
                    "trainer_hours": form.trainer_hours,
                    "trainees_data": form.trainees_data,
                    "submission_date": (
                        form.submission_date.isoformat()
                        if form.submission_date
                        else None
                    ),
                    "travel_cost": float(form.travel_cost or 0),
                    "food_cost": float(form.food_cost or 0),
                    "materials_cost": float(form.materials_cost or 0),
                    "other_cost": float(form.other_cost or 0),
                    "concur_claim": form.concur_claim,
                    "other_expense_description": form.other_expense_description,
                    "approved": bool(form.approved),
                    "trainee_hours": form.trainee_hours or 0.0,
                    "training_description": form.training_description,
                    "submitter": form.submitter,
                }
            )
        return result


def get_user_training_forms(
    submitter_email,
    search_term="",
    date_from=None,
    date_to=None,
    training_type=None,
    sort_by="submission_date",
    sort_order="DESC",
    page=1,
):
    """Get all training forms for a specific user with optional filtering and pagination"""
    with db_session() as session:
        query = session.query(TrainingForm).filter_by(submitter=submitter_email)
        if search_term:
            like_term = f"%{search_term}%"
            query = query.filter(
                (TrainingForm.trainer_name.like(like_term))
                | (TrainingForm.supplier_name.like(like_term))
                | (TrainingForm.location_details.like(like_term))
            )
        if date_from:
            query = query.filter(TrainingForm.start_date >= date_from)
        if date_to:
            query = query.filter(TrainingForm.end_date <= date_to)
        if training_type:
            query = query.filter(TrainingForm.training_type == training_type)
        total_count = query.count()
        if sort_order.upper() == "DESC":
            query = query.order_by(getattr(TrainingForm, sort_by).desc())
        else:
            query = query.order_by(getattr(TrainingForm, sort_by))
        forms = query.offset((page - 1) * 10).limit(10).all()
        result = []
        for form in forms:
            result.append(
                {
                    "id": form.id,
                    "training_type": form.training_type,
                    "trainer_name": form.trainer_name,
                    "supplier_name": form.supplier_name,
                    "location_type": form.location_type,
                    "location_details": form.location_details,
                    "start_date": (
                        form.start_date.isoformat() if form.start_date else None
                    ),
                    "end_date": form.end_date.isoformat() if form.end_date else None,
                    "trainer_hours": form.trainer_hours,
                    "trainees_data": form.trainees_data,
                    "submission_date": (
                        form.submission_date.isoformat()
                        if form.submission_date
                        else None
                    ),
                    "approved": bool(form.approved),
                    "submitter": form.submitter,
                }
            )
        return result, total_count
