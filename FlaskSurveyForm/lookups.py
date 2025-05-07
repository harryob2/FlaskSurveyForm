import csv
import os
import logging
from models import TrainingCatalog # Import the new model
from sqlalchemy.orm import Session
from sqlalchemy import create_engine # Required for session creation if not using app context

# Assuming DATABASE_URL is defined as it is in your models.py or app.py
# If running lookups.py standalone for testing, you might need to define it or pass engine/session
DATABASE_URL = "sqlite:///training_forms.db" # Or get from a config
engine = create_engine(DATABASE_URL)

# Configure logging if not already configured by the main app
logger = logging.getLogger(__name__)
if not logger.hasHandlers():
    logging.basicConfig(level=logging.INFO)

# Cache for employee data to avoid reading CSV on every call
_employee_cache = None
_training_catalog_cache = None # Cache for training catalog data

def get_lookup_data(entity_type: str):
    """
    Fetches lookup data for a given entity type.
    Supports 'employees' and 'trainings'.
    """
    global _employee_cache, _training_catalog_cache

    if entity_type == "employees":
        if _employee_cache is not None:
            logger.debug("Returning cached employee data.")
            return _employee_cache

        employees = []
        # Path to the CSV, assuming it's in 'attached_assets' relative to the project root
        # This path might need adjustment if the script's CWD is different when run by Flask
        csv_path = os.path.join(os.path.dirname(__file__), "..", "attached_assets", "EmployeeListFirstLastDept.csv") # Adjusted path

        if not os.path.exists(csv_path):
            # Fallback if running from a different context (e.g. tests or main app.py CWD)
            alt_csv_path = os.path.join("attached_assets", "EmployeeListFirstLastDept.csv")
            if os.path.exists(alt_csv_path):
                csv_path = alt_csv_path
            else:
                logger.error(f"Employee list CSV not found at {csv_path} or {alt_csv_path}")
                return []

        logger.info(f"Loading employee data from {csv_path}")
        try:
            with open(csv_path, "r", encoding="utf-8-sig") as csvfile: # Use utf-8-sig for potential BOM
                reader = csv.DictReader(csvfile)
                for row in reader:
                    first_name = row.get("FirstName", "").strip()
                    last_name = row.get("LastName", "").strip()
                    email = row.get("UserPrincipalName", "").strip()
                    department = row.get("Department", "").strip()

                    if first_name and last_name and email:
                        display_name = f"{first_name} {last_name}"
                        employees.append(
                            {
                                "displayName": display_name,
                                "email": email,
                                "name": display_name, # 'name' is often used, keeping it for compatibility
                                "department": department,
                                "firstName": first_name,
                                "lastName": last_name,
                            }
                        )
            _employee_cache = employees
            logger.info(f"Loaded and cached {len(employees)} employees.")
            return employees
        except Exception as e:
            logger.error(f"Error loading employee data from {csv_path}: {str(e)}")
            return []

    elif entity_type == "trainings":
        if _training_catalog_cache is not None:
            logger.debug("Returning cached training catalog data.")
            return _training_catalog_cache
        
        trainings = []
        try:
            # Use a context manager for the session if possible, or ensure it's closed.
            # If this runs outside Flask app context, direct session creation is needed.
            with Session(engine) as session:
                catalog_items = session.query(TrainingCatalog).all()
                for item in catalog_items:
                    trainings.append({
                        "id": item.id,
                        "name": item.training_name, # Key for primary display in autocomplete
                        "area": item.area,         # Key for subtitle/secondary info
                        # Add other fields if needed by frontend, but keep it minimal for lookup
                        "ida_class": item.ida_class,
                    })
            _training_catalog_cache = trainings
            logger.info(f"Loaded and cached {len(trainings)} training catalog items.")
            return trainings
        except Exception as e:
            logger.error(f"Error loading training catalog data: {str(e)}")
            return []
    
    logger.warning(f"Unknown entity type for lookup: {entity_type}")
    return []

if __name__ == '__main__':
    # For testing the module directly
    print("Testing get_lookup_data('employees'):")
    employee_data = get_lookup_data('employees')
    if employee_data:
        print(f"Found {len(employee_data)} employees. First 3:")
        for emp in employee_data[:3]:
            print(emp)
    else:
        print("No employee data found.")

    print("\nTesting get_lookup_data('trainings'):")
    training_data = get_lookup_data('trainings')
    if training_data:
        print(f"Found {len(training_data)} training items. First 3:")
        for tr in training_data[:3]:
            print(tr)
    else:
        print("No training data found.")

    print("\nTesting get_lookup_data('unknown_type'):")
    unknown_data = get_lookup_data('unknown_type')
    print(unknown_data) 