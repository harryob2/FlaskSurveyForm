import pandas as pd
from sqlalchemy import create_engine, Column, Integer, String, Text, MetaData, Table
from sqlalchemy.orm import sessionmaker
import os

# Database setup
DATABASE_URL = "sqlite:///training_forms.db"
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)
metadata = MetaData()

# Define the new table structure (without using models.py for now)
training_catalog = Table(
    'training_catalog', metadata,
    Column('id', Integer, primary_key=True, autoincrement=True),
    Column('area', String), # New column for the area
    Column('training_name', String),
    Column('qty_staff_attending', String),
    Column('training_desc', String),
    Column('challenge_lvl', String),
    Column('skill_impact', String),
    Column('evaluation_method', String), # Can be text like 'TBC'
    Column('ida_class', String)
)

def import_training_catalog(xlsx_path: str):
    """
    Reads training data from an Excel file, processes it to include 'area',
    creates the 'training_catalog' table if it doesn't exist, and inserts the data.
    """
    print(f"Starting import from: {xlsx_path}")

    # --- 1. Read and Process Excel Data ---
    try:
        # Read specific columns (A=0, C=2 to I=8) starting from header row 9 (0-indexed 8)
        # Force reading 180 rows after the header
        df = pd.read_excel(
            xlsx_path,
            header=8, # 0-indexed header row
            usecols=[0, 2, 3, 4, 5, 6, 7, 8], # Columns A, C, D, E, F, G, H, I
            sheet_name='1_Training Plan', # Explicitly use the correct sheet name
            nrows=180 # Explicitly read 180 rows after the header
        )
        print(f"Read {len(df)} rows initially from sheet '1_Training Plan' (requested 180).")

        # Rename columns for clarity and database mapping (adjust if Excel headers differ)
        # Use a more robust way to find the column index if name varies slightly
        col_map = {
            df.columns[0]: 'raw_area', # Column A
            df.columns[1]: 'training_name', # Column C
            df.columns[2]: 'qty_staff_attending', # Column D
            df.columns[3]: 'training_desc', # Column E
            df.columns[4]: 'challenge_lvl', # Column F
            df.columns[5]: 'skill_impact', # Column G
            df.columns[6]: 'evaluation_method', # Column H
            df.columns[7]: 'ida_class' # Column I
        }
        df.rename(columns=col_map, inplace=True)

        # Keep only rows 10 to 189 (0-indexed 1 to 180 relative to the header)
        # Note: Excel row 10 is index 0 after reading with header=8
        # Excel row 189 is index 179 after reading with header=8
        # No longer need iloc slicing as nrows handled it
        # df = df.iloc[0:180].copy() # Read 180 rows starting from the first data row
        # print(f"Filtered to {len(df)} rows (Excel rows 10-189).")

        # Fill the 'area' based on merged cells logic
        df['area'] = df['raw_area'].ffill()
        print("Filled 'area' based on merged cells.")

        # Drop the temporary raw area column
        df.drop(columns=['raw_area'], inplace=True)

        # TODO: Remove this commented out code. Cursor wrote it. It thought the skill_impact column was credits.
        # The skill_impact column is actually a string, but it was treating it as an int and getting an error.
        # The code below was cursors solution. I changed skill_impact to a string but I will leave this code here for now. 

        # Handle potential NaN/NaT in 'credits' before converting to int
        # Fill NaN with 0 or another placeholder, then convert
        # Make sure the 'credits' column exists before processing
        # if 'credits' in df.columns:
        #     df['credits'] = pd.to_numeric(df['credits'], errors='coerce').fillna(0).astype(int)
        #     print("Processed 'credits' column.")
        # else:
        #     print("Warning: 'credits' column not found in the expected position (Column G). Setting to 0.")
        #     df['credits'] = 0 # Add a default credits column if not found

        # Ensure string columns don't have NaN
        str_cols = ['area', 'training_name', 'qty_staff_attending', 'training_desc', 'challenge_lvl', 'evaluation_method', 'ida_class']
        for col in str_cols:
             df[col] = df[col].fillna('').astype(str)


        # --- 2. Prepare and Insert into Database ---
        # Create the table if it doesn't exist
        metadata.create_all(bind=engine)
        print("Ensured 'training_catalog' table exists.")

        session = SessionLocal()
        try:
            # Optional: Clear existing data if needed (uncomment to enable)
            session.execute(training_catalog.delete())
            print("Cleared existing data from 'training_catalog'.")

            # Convert DataFrame to list of dictionaries for insertion
            data_to_insert = df.to_dict(orient='records')

            # Bulk insert using Core API (more efficient for many rows)
            if data_to_insert:
                session.execute(training_catalog.insert(), data_to_insert)
                session.commit()
                print(f"Successfully inserted {len(data_to_insert)} records.")
            else:
                print("No data to insert.")

        except Exception as e:
            session.rollback()
            print(f"Error during database insertion: {e}")
            raise
        finally:
            session.close()
            print("Database session closed.")

    except FileNotFoundError:
        print(f"Error: Excel file not found at {xlsx_path}")
    except Exception as e:
        print(f"An error occurred: {e}")

if __name__ == "__main__":
    # Assumes the script is run from the project root
    excel_file = os.path.join("attached_assets", "limerick IDA .xlsx")
    if not os.path.exists(excel_file):
         # Try one level up if running from scripts/ dir
         excel_file = os.path.join("..", "attached_assets", "limerick IDA .xlsx")

    if os.path.exists(excel_file):
        import_training_catalog(excel_file)
    else:
         print(f"Error: Could not find the Excel file. Looked in './attached_assets' and '../attached_assets'") 