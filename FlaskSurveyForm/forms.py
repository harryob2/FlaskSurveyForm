"""
Form definitions for the training form application.

This module defines the form classes used for data validation and rendering.
"""

from datetime import date
import re
import json

from flask_wtf import FlaskForm
from flask_wtf.file import FileField, FileAllowed
from wtforms import (
    StringField,
    SelectField,
    RadioField,
    DecimalField,
    DateField,
    SubmitField,
    TextAreaField,
    HiddenField,
    FloatField,
    MultipleFileField,
    PasswordField,
    IntegerField,
)
from wtforms.validators import (
    DataRequired,
    NumberRange,
    Optional,
    ValidationError,
    Email,
)

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


def RequiredIf(condition_field, condition_value):
    """Custom validator that makes a field required if another field has a specific value"""
    message = f"This field is required when {condition_field} is {condition_value}"

    def _validate(form, field):
        try:
            other_field = getattr(form, condition_field)
        except AttributeError:
            raise ValidationError(
                f"No field named '{condition_field}' in form for RequiredIf validator."
            )

        # Check if the condition field has the specified value
        if other_field.data == condition_value:
            # If condition met, behave like DataRequired
            if not field.data:
                raise ValidationError(message)
            # Handle string data that might just be whitespace
            if isinstance(field.data, str) and not field.data.strip():
                raise ValidationError(message)
            # Handle numeric data that might be zero if zero isn't allowed implicitly
            # (Adjust if 0 is valid for Decimal/Float) - NumberRange usually handles this
            # if isinstance(field.data, (int, float, Decimal)) and field.data == 0:
            #     raise ValidationError(message) # Uncomment if 0 is not allowed

    return _validate


class TrainingForm(FlaskForm):
    """Form for training submissions"""

    # Always Required
    training_type = RadioField(
        "Training Type",
        choices=[
            ("Internal Training", "Internal Training"),
            ("External Training", "External Training"),
        ],
        validators=[DataRequired()],
    )
    location_type = RadioField(
        "Location",
        choices=[("Onsite", "Onsite"), ("Offsite", "Offsite"), ("Virtual", "Virtual")],
        validators=[
            DataRequired("Please select a location type.")
        ],  # Custom message example
    )
    start_date = DateField(
        "Start Date", validators=[DataRequired()], format="%Y-%m-%d", default=date.today
    )
    end_date = DateField(
        "End Date", validators=[DataRequired()], format="%Y-%m-%d", default=date.today
    )
    training_description = TextAreaField(
        "Training Description", validators=[DataRequired()]
    )
    trainee_hours = FloatField(
        "Trainee Hours",
        validators=[
            DataRequired(),
            NumberRange(min=1.0, message="Trainee hours must be positive."),
        ],
    )  # Changed to FloatField with min 1.0

    # Conditionally Required
    trainer_name = StringField(
        "Trainer Name",
        validators=[RequiredIf("training_type", "Internal Training")],
        description="For internal training, select from employee list",
    )
    supplier_name = StringField(
        "Supplier Name",
        validators=[RequiredIf("training_type", "External Training")],
        description="For external training, enter supplier name",
    )
    location_details = StringField(
        "Location Details",
        validators=[RequiredIf("location_type", "Offsite")],
        description="Required for offsite training",
    )
    trainer_hours = FloatField(
        "Trainer Hours",
        validators=[
            RequiredIf("training_type", "Internal Training"),
            Optional(),
            NumberRange(min=1.0, message="Trainer hours must be positive if entered."),
        ],
        default=None,
    )

    # Optional or complex validation
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
    # Use custom validators for these complex conditions
    other_expense_description = TextAreaField(
        "Other Expense Description",
        validators=[Optional()],
        description="Required when other expenses are entered",
    )
    concur_claim = StringField("Concur Claim Number", validators=[Optional()])

    # Hidden fields
    department = HiddenField("Department", default="Engineering")
    trainees_data = HiddenField("Trainees Data")  # Add validation if needed

    # Attachment fields
    attachments = MultipleFileField(
        "Attachments",
        validators=[RequiredIf("location_type", "Virtual")],
        description="Required for virtual training",
    )  # Example: Make optional
    attachment_descriptions = TextAreaField(
        "Attachment Descriptions (one per line)", validators=[Optional()]
    )

    # Updated trainee field
    trainee_emails = TextAreaField(
        "Trainee Emails (comma/space separated)", validators=[Optional()]
    )

    # Submit Button
    submit = SubmitField("Submit Training Form")

    # --- Custom Validation Methods ---
    # Keep these for logic more complex than RequiredIf handles directly

    def validate_end_date(self, field):
        """Validate that end date is not before start date"""
        if self.start_date.data and field.data and field.data < self.start_date.data:
            raise ValidationError("End date cannot be earlier than start date.")

    # Keep concur and other expense validation here as they depend on multiple fields/values > 0
    def validate_concur_claim(self, field):
        """Validate that Concur Claim Number is provided when expenses > 0 are entered"""
        has_expenses = (
            (self.travel_cost.data and self.travel_cost.data > 0)
            or (self.food_cost.data and self.food_cost.data > 0)
            or (self.materials_cost.data and self.materials_cost.data > 0)
            or (self.other_cost.data and self.other_cost.data > 0)
        )
        if has_expenses and (not field.data or not field.data.strip()):
            raise ValidationError(
                "Concur Claim Number is required when expenses are entered."
            )

    def validate_other_expense_description(self, field):
        """Validate that other expense description is provided when other expenses > 0"""
        if (
            self.other_cost.data
            and self.other_cost.data > 0
            and (not field.data or not field.data.strip())
        ):
            raise ValidationError(
                "Description is required when other expenses are entered."
            )

    def validate_attachments(self, field):
        """Validate that at least one attachment is provided if location is Virtual."""
        # This validation runs on the server side after submission.
        if self.location_type.data == "Virtual":
            # Check if any *new* files were uploaded in this submission
            has_new_attachments = field.data and any(f.filename for f in field.data)
            if not has_new_attachments:
                raise ValidationError(
                    "At least one attachment (e.g., certificate) is required for Virtual training."
                )

    def validate_trainees_data(self, field):
        """Validate that at least one trainee has been added."""
        if not field.data or field.data.strip() == "[]":
            raise ValidationError("At least one trainee must be added.")

    def process_emails(self):
        """Process and clean the trainee emails"""
        if not self.trainee_emails.data:
            return []
        emails = re.split(r"[,\s]+", self.trainee_emails.data)
        return [email.strip() for email in emails if email.strip()]

    def prepare_form_data(self):
        """Prepare form data for database insertion"""
        is_internal = self.training_type.data == "Internal Training"
        data = {
            "training_type": self.training_type.data,
            "trainer_name": (self.trainer_name.data if is_internal else None),
            "supplier_name": (self.supplier_name.data if not is_internal else None),
            "location_type": self.location_type.data,
            "location_details": (
                self.location_details.data
                if self.location_type.data == "Offsite"
                else None
            ),
            "start_date": self.start_date.data.strftime("%Y-%m-%d"),
            "end_date": self.end_date.data.strftime("%Y-%m-%d"),
            "trainer_hours": (
                float(str(self.trainer_hours.data))
                if is_internal and self.trainer_hours.data
                else None
            ),
            "training_description": self.training_description.data or "",
            "trainees_data": self.trainees_data.data or "[]",
            "travel_cost": (
                float(self.travel_cost.data) if self.travel_cost.data else 0.0
            ),
            "food_cost": float(self.food_cost.data) if self.food_cost.data else 0.0,
            "materials_cost": (
                float(self.materials_cost.data) if self.materials_cost.data else 0.0
            ),
            "other_cost": float(self.other_cost.data) if self.other_cost.data else 0.0,
            "other_expense_description": (
                self.other_expense_description.data
                if self.other_cost.data and self.other_cost.data > 0
                else None
            ),
            "concur_claim": self.concur_claim.data,
            "trainee_hours": (
                float(str(self.trainee_hours.data)) if self.trainee_hours.data else 0.0
            ),
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


class LoginForm(FlaskForm):
    """Form for user login"""

    username = StringField("Username (Email)", validators=[DataRequired(), Email()])
    password = PasswordField("Password", validators=[DataRequired()])
    submit = SubmitField("Login")
