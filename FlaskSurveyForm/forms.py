"""
Form definitions for the training form application.

This module defines the form classes used for data validation and rendering.
"""

from datetime import date
import re
import json

from flask_wtf import FlaskForm
from flask_wtf.file import FileField, FileAllowed, FileRequired
from wtforms import (
    StringField,
    SelectField,
    RadioField,
    DecimalField,
    IntegerField,
    DateField,
    SubmitField,
    SearchField,
    TextAreaField,
    HiddenField,
    FloatField,
)
from wtforms.validators import DataRequired, NumberRange, Optional, ValidationError

# Training types
TRAINING_TYPES = ["Internal Training", "External Training"]

# Sort options
SORT_OPTIONS = [
    ("submission_date", "Submission Date"),
    ("start_date", "Start Date"),
    ("end_date", "End Date"),
    ("cost", "Cost"),
]

# Allowed file extensions for file upload
ALLOWED_EXTENSIONS = {
    "pdf",
    "doc",
    "docx",
    "xls",
    "xlsx",
    "jpg",
    "jpeg",
    "png",
    "csv",
    "txt",
}


class TrainingForm(FlaskForm):
    """Form for training submissions"""

    # Training Type - Initial Selection
    training_type = RadioField(
        "Training Type",
        choices=[
            ("Internal Training", "Internal Training"),
            ("External Training", "External Training"),
        ],
        validators=[DataRequired()],
    )

    # Trainer/Supplier Information
    trainer_name = StringField(
        "Trainer Name",
        validators=[Optional()],
        description="For internal training, select from employee list",
    )
    supplier_name = StringField(
        "Supplier/Name",
        validators=[Optional()],
        description="For external training, enter supplier name",
    )

    # Location
    location_type = RadioField(
        "Location",
        choices=[("Onsite", "Onsite"), ("Offsite", "Offsite")],
        validators=[DataRequired()],
    )
    location_details = StringField(
        "Location Details",
        validators=[Optional()],
        description="Required for offsite training",
    )

    # Date Information
    start_date = DateField(
        "Start Date", validators=[DataRequired()], format="%Y-%m-%d", default=date.today
    )
    end_date = DateField(
        "End Date", validators=[DataRequired()], format="%Y-%m-%d", default=date.today
    )

    # Department (hidden, auto-filled)
    department = HiddenField("Department", default="Engineering")

    # Trainer Days
    trainer_days = FloatField(
        "Trainer Days", validators=[Optional(), NumberRange(min=0)]
    )

    # Trainees Data
    trainees_data = HiddenField("Trainees Data")
    # New expense fields
    travel_cost = FloatField(
        "Travel Expenses (€)", validators=[Optional(), NumberRange(min=0)]
    )
    food_cost = FloatField(
        "Food & Accommodation (€)", validators=[Optional(), NumberRange(min=0)]
    )
    materials_cost = FloatField(
        "Materials (€)", validators=[Optional(), NumberRange(min=0)]
    )
    other_cost = FloatField(
        "Other Expenses (€)", validators=[Optional(), NumberRange(min=0)]
    )
    concur_claim = StringField("Concur Claim Number")

    # Updated attendee field
    attendee_emails = TextAreaField(
        "Attendee Emails (comma/space separated)", validators=[Optional()]
    )

    # Attachment fields
    attachments = FileField(
        "Attachments",
        validators=[
            FileAllowed(
                list(ALLOWED_EXTENSIONS),
                "Allowed file types: pdf, doc, docx, xls, xlsx, jpg, png, txt",
            )
        ],
        render_kw={"multiple": True},
    )
    attachment_descriptions = TextAreaField("Attachment Descriptions (one per line)")

    # Submit Button
    submit = SubmitField("Submit Training Form")

    def validate_end_date(self, field):
        """Validate that end date is not before start date"""
        if field.data < self.start_date.data:
            raise ValidationError("End date cannot be earlier than start date.")

    def validate_location_details(self, field):
        """Validate that location details are provided when location type is Offsite"""
        if self.location_type.data == "Offsite" and not field.data:
            raise ValidationError("Location details are required for offsite training.")

    def validate_trainer_name(self, field):
        """Validate that trainer name is provided for Internal Training"""
        if self.training_type.data == "Internal Training" and not field.data:
            raise ValidationError("Trainer name is required for internal training.")

    def validate_supplier_name(self, field):
        """Validate that supplier name is provided for External Training"""
        if self.training_type.data == "External Training" and not field.data:
            raise ValidationError("Supplier name is required for external training.")

    def validate_concur_claim(self, field):
        """Validate that Concur Claim Number is provided when expenses are entered"""
        has_expenses = (
            (self.travel_cost.data and self.travel_cost.data > 0)
            or (self.food_cost.data and self.food_cost.data > 0)
            or (self.materials_cost.data and self.materials_cost.data > 0)
            or (self.other_cost.data and self.other_cost.data > 0)
        )

        if has_expenses and not field.data:
            raise ValidationError(
                "Concur Claim Number is required when expenses are entered."
            )

    def process_emails(self):
        """Process and clean the attendee emails"""
        if not self.attendee_emails.data:
            return []
        emails = re.split(r"[,\s]+", self.attendee_emails.data)
        return [email.strip() for email in emails if email.strip()]

    def prepare_form_data(self):
        """Prepare form data for database insertion"""
        data = {
            "training_type": self.training_type.data,
            "trainer_name": (
                self.trainer_name.data
                if self.training_type.data == "Internal Training"
                else None
            ),
            "supplier_name": (
                self.supplier_name.data
                if self.training_type.data == "External Training"
                else None
            ),
            "location_type": self.location_type.data,
            "location_details": (
                self.location_details.data
                if self.location_type.data == "Offsite"
                else None
            ),
            "start_date": self.start_date.data.strftime("%Y-%m-%d"),
            "end_date": self.end_date.data.strftime("%Y-%m-%d"),
            "trainer_days": (
                float(self.trainer_days.data) if self.trainer_days.data else None
            ),
            "travel_cost": (
                float(self.travel_cost.data) if self.travel_cost.data else 0.0
            ),
            "food_cost": float(self.food_cost.data) if self.food_cost.data else 0.0,
            "materials_cost": (
                float(self.materials_cost.data) if self.materials_cost.data else 0.0
            ),
            "other_cost": float(self.other_cost.data) if self.other_cost.data else 0.0,
            "concur_claim": self.concur_claim.data,
        }

        # Handle trainees data
        if self.trainees_data.data:
            try:
                # If trainees_data is already JSON, use it directly
                trainees = json.loads(self.trainees_data.data)
                if isinstance(trainees, list):
                    # Ensure all trainees have the required fields
                    processed_trainees = []
                    for trainee in trainees:
                        if isinstance(trainee, dict):
                            # Ensure required fields exist
                            processed_trainee = {
                                "email": trainee.get("email", ""),
                                "name": trainee.get(
                                    "name", trainee.get("email", "").split("@")[0]
                                ),
                                "department": trainee.get("department", "Engineering"),
                            }
                            processed_trainees.append(processed_trainee)
                        elif isinstance(trainee, str):
                            # Convert string email to trainee object
                            processed_trainees.append(
                                {
                                    "email": trainee,
                                    "name": trainee.split("@")[0],
                                    "department": "Engineering",
                                }
                            )

                    data["trainees_data"] = json.dumps(processed_trainees)
                else:
                    data["trainees_data"] = "[]"
            except json.JSONDecodeError:
                # If not valid JSON, try to process as emails
                emails = self.process_emails()
                # Convert emails to trainee objects
                trainees = [
                    {
                        "email": email,
                        "name": email.split("@")[0],
                        "department": "Engineering",
                    }
                    for email in emails
                ]
                data["trainees_data"] = json.dumps(trainees)
        else:
            # If no trainees data, use empty array
            data["trainees_data"] = "[]"

        return data


class InvoiceForm(FlaskForm):
    """Form for adding invoices"""

    invoice_number = StringField("Invoice Number", validators=[Optional()])
    cost = DecimalField(
        "Cost (€)", validators=[DataRequired(), NumberRange(min=0)], places=2
    )
    description = TextAreaField("Description", validators=[Optional()])
    attachment = FileField(
        "Invoice Attachment",
        validators=[
            Optional(),
            FileAllowed(list(ALLOWED_EXTENSIONS), "Only document files are allowed."),
        ],
    )
    submit = SubmitField("Add Invoice")


class SearchForm(FlaskForm):
    """Form for searching and filtering training submissions"""

    search = StringField("Search", validators=[Optional()])

    date_from = DateField("From Date", validators=[Optional()], format="%Y-%m-%d")

    date_to = DateField("To Date", validators=[Optional()], format="%Y-%m-%d")

    training_type = SelectField(
        "Training Type",
        choices=[("", "All Types")] + [(type, type) for type in TRAINING_TYPES],
        validators=[Optional()],
    )

    sort_by = SelectField("Sort By", choices=SORT_OPTIONS, default="submission_date")

    sort_order = SelectField(
        "Order",
        choices=[("DESC", "Newest First"), ("ASC", "Oldest First")],
        default="DESC",
    )

    submit = SubmitField("Search")

    def validate_date_to(self, field):
        """Validate that to_date is not before from_date"""
        if field.data and self.date_from.data and field.data < self.date_from.data:
            raise ValidationError("To Date cannot be earlier than From Date.")
