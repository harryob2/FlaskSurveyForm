"""
Main application module for the training form.

This module defines the Flask application and routes.
"""

import os
import csv
import json
import logging
from datetime import datetime
import re
from models import get_db, create_tables

from flask import (
    Flask,
    render_template,
    request,
    redirect,
    send_from_directory,
    url_for,
    flash,
    jsonify,
    abort,
)
from werkzeug.utils import secure_filename

from forms import TrainingForm, SearchForm
from models import (
    insert_training_form,
    update_training_form,
    create_tables,
    get_all_training_forms,
    get_training_form,
)
from utils import prepare_form_data
from setup_db import setup_database

# Configure logging
logging.basicConfig(level=logging.DEBUG)

# Create and configure the Flask application
app = Flask(__name__)

# Load configuration from config.py
app.config.from_pyfile("config.py")

# Set the secret key for CSRF protection
app.secret_key = app.config["SECRET_KEY"]

# Make json module available in templates
app.jinja_env.globals["json"] = json

# Set up the database (create tables only if they do not exist)
setup_database(force_recreate=False)


# Function to get a training form by ID - make available to templates
def get_form_by_id(form_id):
    """Get a form by ID - available in templates"""
    return get_training_form(form_id)


# Make helper functions available to templates
app.jinja_env.globals.update(view_form=get_form_by_id)


# Custom Jinja2 filter to convert JSON strings to Python objects
@app.template_filter("from_json")
def from_json(value):
    """Convert a JSON string to a Python object"""
    try:
        return json.loads(value)
    except:
        return []


# Custom Jinja2 filter to remove a parameter from the query string
@app.template_filter("remove_param")
def remove_param(params, param_name):
    """Remove a parameter from a dict of URL parameters"""
    if isinstance(params, dict):
        new_params = params.copy()
        new_params.pop(param_name, None)
        return new_params
    return params


@app.context_processor
def inject_current_year():
    return {"current_year": datetime.now().year}


@app.route("/")
def index():
    """Display the training form"""
    form = TrainingForm()
    return render_template("index.html", form=form, now=datetime.now())


@app.route("/submit", methods=["GET", "POST"])
def submit_form():
    """Process the form submission"""
    form = TrainingForm()

    # Log all form data received
    logging.debug("=== Form Submission Debug ===")
    logging.debug(f"Form data: {request.form}")
    logging.debug(f"Trainees data: {request.form.get('trainees_data')}")

    # Validate the form data
    if form.validate_on_submit():
        try:

            # Get trainees data from form
            trainees_data = request.form.get("trainees_data")
            if trainees_data:
                form.trainees_data.data = trainees_data
            # Prepare form data using the form's method
            form_data = form.prepare_form_data()
            logging.debug(f"Prepared form data: {form_data}")

            # Insert the form data into the database
            form_id = insert_training_form(form_data)
            logging.debug(f"Form inserted with ID: {form_id}")

            # Process attachments
            if form.attachments.data:
                descriptions = [
                    d.strip() for d in form.attachment_descriptions.data.split("\n")
                ]
                for i, file in enumerate(request.files.getlist("attachments")):
                    if file and file.filename:
                        filename = secure_filename(file.filename)
                        file_path = os.path.join(app.config["UPLOAD_FOLDER"], filename)
                        file.save(file_path)

                        # Get description or use empty string
                        description = descriptions[i] if i < len(descriptions) else ""

                        # Insert attachment
                        conn = get_db()
                        cursor = conn.cursor()
                        cursor.execute(
                            """
                            INSERT INTO attachments (training_id, filename, description)
                            VALUES (?, ?, ?)
                        """,
                            (form_id, filename, description),
                        )
                        conn.commit()
                        conn.close()
            return redirect(url_for("success"))
        except Exception as e:
            logging.error(f"Error processing form submission: {e}")
            flash("An error occurred while submitting the form. Please try again.")
            return redirect(url_for("index"))
    else:
        logging.error(f"Form validation errors: {form.errors}")
        flash("Please correct the errors in the form.")
        return redirect(url_for("index"))

    return render_template("index.html", form=form, now=datetime.now())


@app.route("/uploads/<filename>")
def uploaded_file(filename):
    return send_from_directory(app.config["UPLOAD_FOLDER"], filename)


@app.route("/approve/<int:form_id>")
def approve_training(form_id):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute(
        "UPDATE training_forms SET approved = NOT approved WHERE id = ?", (form_id,)
    )
    conn.commit()
    conn.close()
    return redirect(url_for("view_form", form_id=form_id))


@app.route("/success")
def success():
    """Display success page after form submission"""
    return render_template("success.html", now=datetime.now())


@app.route("/list")
def list_forms():
    """Display a list of all training form submissions"""
    form = SearchForm()

    # Get filter parameters from request
    search_term = request.args.get("search", "")
    date_from = request.args.get("date_from", "")
    date_to = request.args.get("date_to", "")
    training_type = request.args.get("training_type", "")
    sort_by = request.args.get("sort_by", "submission_date")
    sort_order = request.args.get("sort_order", "DESC")
    page = request.args.get("page", 1, type=int)

    # Get forms with filters
    forms, total_count = get_all_training_forms(
        search_term=search_term,
        date_from=date_from,
        date_to=date_to,
        training_type=training_type,
        sort_by=sort_by,
        sort_order=sort_order,
        page=page,
    )

    # Calculate pagination
    total_pages = (total_count + 9) // 10  # Round up division

    return render_template(
        "list.html",
        form=form,
        forms=forms,
        total_count=total_count,
        total_pages=total_pages,
        current_page=page,
        search_term=search_term,
        date_from=date_from,
        date_to=date_to,
        training_type=training_type,
        sort_by=sort_by,
        sort_order=sort_order,
        now=datetime.now(),
    )


@app.route("/view/<int:form_id>")
def view_form(form_id):
    """Display a single training form submission"""
    form_data = get_training_form(form_id)
    print("DEBUG - Form Data Received:", form_data)
    if not form_data:
        flash("Training form not found", "danger")
        return redirect(url_for("list_forms"))

    # Get attachments
    conn = get_db()
    cursor = conn.cursor()

    # Get attachments records
    cursor.execute("SELECT * FROM attachments WHERE training_id = ?", (form_id,))
    attachments = [dict(row) for row in cursor.fetchall()]

    # Close connection
    conn.close()
    # Parse trainees data from JSON if it exists
    trainees = []
    if form_data.get("trainees_data"):
        try:
            trainees = json.loads(form_data["trainees_data"])
            if (
                isinstance(trainees, list)
                and len(trainees) > 0
                and not isinstance(trainees[0], dict)
            ):
                trainees = [{"email": email} for email in trainees]
        except:
            trainees = []
    # Parse comma-separated attendee emails
    attendee_emails = []
    if form_data.get("attendee_emails"):
        attendee_emails = [
            e.strip() for e in form_data["trainees_data"].split(",") if e.strip()
        ]

    print("Attachments from DB:", attachments)
    return render_template(
        "view.html",
        form=form_data,
        trainees=trainees,
        attachments=attachments,
        attendee_emails=attendee_emails,
        now=datetime.now(),
    )


@app.route("/edit/<int:form_id>", methods=["GET", "POST"])
def edit_form(form_id):
    """Edit an existing training form submission"""
    logging.debug(f"Edit form request - Method: {request.method}, Form ID: {form_id}")
    form = TrainingForm()

    if request.method == "GET":
        # Load existing form data
        form_data = get_training_form(form_id)
        if form_data:
            # Basic fields
            form.training_type.data = form_data["training_type"]
            form.trainer_name.data = form_data["trainer_name"]
            form.supplier_name.data = form_data["supplier_name"]
            form.location_type.data = form_data["location_type"]
            form.location_details.data = form_data["location_details"]

            # Date fields
            try:
                form.start_date.data = datetime.strptime(
                    form_data["start_date"], "%Y-%m-%d"
                )
                form.end_date.data = datetime.strptime(
                    form_data["end_date"], "%Y-%m-%d"
                )
            except (ValueError, KeyError) as e:
                logging.error(f"Error parsing dates: {str(e)}")
                flash("Error loading date information")
                return redirect(url_for("list_forms"))

            # Numeric fields
            form.trainer_days.data = form_data["trainer_days"]

            # Expense fields
            form.travel_cost.data = form_data.get("travel_cost", 0)
            form.food_cost.data = form_data.get("food_cost", 0)
            form.materials_cost.data = form_data.get("materials_cost", 0)
            form.other_cost.data = form_data.get("other_cost", 0)
            form.concur_claim.data = form_data.get("concur_claim", "")

            # Load trainees data
            if form_data.get("trainees_data"):
                try:
                    trainees = json.loads(form_data["trainees_data"])
                    if isinstance(trainees, list):
                        # Set the trainees data directly in the hidden field
                        form.trainees_data.data = form_data["trainees_data"]

                        # Also populate the attendee emails field for backward compatibility
                        if trainees and isinstance(trainees[0], dict):
                            # If trainees are objects with email property
                            emails = [t["email"] for t in trainees if "email" in t]
                        else:
                            # If trainees are just email strings
                            emails = trainees
                        form.attendee_emails.data = ", ".join(emails)
                except json.JSONDecodeError as e:
                    logging.error(f"Error parsing trainees data: {e}")
                    form.trainees_data.data = "[]"
            else:
                form.trainees_data.data = "[]"

    if form.validate_on_submit():
        try:
            # Get trainees data from form
            trainees_data = request.form.get("trainees_data")
            if trainees_data:
                form.trainees_data.data = trainees_data

            # Prepare form data using the form's method
            form_data = form.prepare_form_data()

            # Update in database
            update_training_form(form_id, form_data)

            # Handle attachments
            if form.attachments.data:
                descriptions = [
                    d.strip() for d in form.attachment_descriptions.data.split("\n")
                ]

                for i, file in enumerate(request.files.getlist("attachments")):
                    if file and file.filename:
                        filename = secure_filename(file.filename)
                        file_path = os.path.join(app.config["UPLOAD_FOLDER"], filename)
                        file.save(file_path)

                        description = descriptions[i] if i < len(descriptions) else ""

                        conn = get_db()
                        cursor = conn.cursor()
                        cursor.execute(
                            """
                            INSERT INTO attachments (training_id, filename, description)
                            VALUES (?, ?, ?)
                        """,
                            (form_id, filename, description),
                        )
                        conn.commit()
                        conn.close()

            flash("Form updated successfully!", "success")
            return redirect(url_for("view_form", form_id=form_id))

        except Exception as e:
            logging.error(f"Error updating form: {str(e)}")
            flash(
                "An error occurred while updating the form. Please try again.", "danger"
            )

    # Load existing attachments to display in form
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM attachments WHERE training_id = ?", (form_id,))
    existing_attachments = [dict(row) for row in cursor.fetchall()]
    conn.close()

    return render_template(
        "index.html",
        form=form,
        edit_mode=True,
        form_id=form_id,
        existing_attachments=existing_attachments,
    )


@app.route("/api/employees")
def get_employees():
    """API endpoint to get employees from the CSV file"""
    try:
        employees = []
        csv_path = os.path.join("attached_assets", "EmployeeListFirstLastDept.csv")

        if not os.path.exists(csv_path):
            logging.error(f"Employee list CSV not found at {csv_path}")
            return jsonify([])

        logging.info(f"Loading employee data from {csv_path}")

        with open(csv_path, "r", encoding="utf-8") as csvfile:
            reader = csv.DictReader(csvfile)
            for row in reader:
                # Get first name, last name, email, and department
                first_name = row.get("FirstName", "").strip()
                last_name = row.get("LastName", "").strip()
                email = row.get("UserPrincipalName", "").strip()
                department = row.get("Department", "").strip()

                # Create display name from first and last name
                if first_name and last_name and email:
                    display_name = f"{first_name} {last_name}"
                    employees.append(
                        {
                            "displayName": display_name,
                            "email": email,
                            "name": display_name,
                            "department": department,
                            "firstName": first_name,
                            "lastName": last_name,
                        }
                    )

        logging.info(f"Loaded {len(employees)} employees")
        return jsonify(employees)
    except Exception as e:
        logging.error(f"Error loading employee data: {str(e)}")
        return jsonify([])


@app.errorhandler(500)
def internal_error(error):
    """Handle internal server errors"""
    flash("An internal server error occurred. Please try again later.", "danger")
    return render_template("index.html", form=TrainingForm(), now=datetime.now()), 500


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=app.config["DEBUG"])
