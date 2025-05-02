[![Playwright Tests](https://github.com/harryob2/FlaskSurveyForm/actions/workflows/playWrite.yml/badge.svg?)](https://github.com/harryob2/FlaskSurveyForm/actions/workflows/playWrite.yml)

# Limerick Training Form System

A web application for managing training form submissions, built with Flask and modern frontend technologies.

## Prerequisites

- Python 3.8 or higher
- Node.js and npm (for Playwright tests)
- uv (Python package installer)

## Setup Instructions

### 1. Install uv

First, install uv using the official installation method:

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

### 2. Create and Activate Virtual Environment

```bash
# Create a new virtual environment using uv
uv venv

# Activate the virtual environment
source .venv/bin/activate  # On Linux/macOS
# OR
.venv\Scripts\activate  # On Windows
```

### 3. Install Dependencies

```bash
# Install Python dependencies using uv
uv pip install -r requirements.txt

# Install Node.js dependencies for testing
npm install
```

### 4. Configure the Application

1. Create a copy of the example configuration file:

```bash
cp config.example.py config.py
```

2. Update `config.py` with your settings:

- Set `SECRET_KEY`
- Configure LDAP settings if using LDAP authentication
- Set up database connection details

### 5. Initialize the Database

```bash
python setup_db.py
```

## Running the Application

1. Start the Flask application:

```bash
python main.py
```

2. Access the application at: http://localhost:5000

## Running Tests

The application uses Playwright for end-to-end testing. To run the tests:

### 1. Install Playwright Dependencies

```bash
# Install Playwright browsers
npx playwright install
```

### 2. Run Tests

```bash
# Start the Flask application in a separate terminal
python app.py

# Run the tests
npx playwright test
```

To run tests with a visible browser (for debugging):

```bash
npx playwright test --headed
```

To simulate the GitHub Actions environment, you can run the tests with the following command:
```bash
CI=1 npx playwright test
```

To run a specific test file:

```bash
npx playwright test tests/test_home_page.spec.ts
```

## Project Structure

```
.
├── app.py              # Main application file
├── auth.py            # Authentication logic
├── config.py          # Configuration settings
├── forms.py           # Form definitions
├── models.py          # Database models
├── requirements.txt   # Python dependencies
├── setup_db.py        # Database setup script
├── static/            # Static files (CSS, JS, images)
├── templates/         # HTML templates
├── tests/            # Test files
└── uploads/          # Upload directory for attachments
```

## Features

- User authentication with LDAP
- Training form submission
- File attachments
- Admin approval system
- Export to Claim 5 Form
- Search and filter submissions
- Responsive design

## Development Guidelines

1. Always activate the virtual environment before working on the project
2. Run tests before submitting changes
3. Update requirements.txt when adding new dependencies:

```bash
uv pip freeze > requirements.txt
```

## Troubleshooting

### Common Issues

1. **Database Connection Error**

   - Ensure the database file exists
   - Check permissions on the database file
   - Verify database configuration in config.py

2. **Test Failures**

   - Make sure the Flask application is running
   - Verify that all dependencies are installed
   - Check if the test database is properly initialized

3. **LDAP Authentication Issues**
   - Verify LDAP configuration in config.py
   - Ensure network connectivity to LDAP server
   - Check user permissions

### Getting Help

For issues or questions:

1. Check the error logs
2. Review the documentation
3. Contact the system administrator

## License

This project is proprietary and confidential.

## Contributing

1. Create a new branch for your feature
2. Write tests for new functionality
3. Submit a pull request
4. Ensure all tests pass before merging
