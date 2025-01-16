# KlarifAI_Integrated
## Pre-requirements:
- Python 3.10.0 
- Node version: v20.18.0 
- Make sure you have PostgreSQL installed.

### To run the backend:
1. Navigate inside the folder > `backend`
2. Run the following command:
   - `python -m venv env_name` to create a virtual environment
   - `env_name\Scripts\activate` to start the virtual environment
   - `pip install -r requirements.txt` to install the dependencies
   - `python manage.py makemigrations`
   - `python manage.py migrate`
   - `python manage.py runserver` to start the Django server

### To run the frontend:
1. Navigate inside the folder > `frontend`
2. Run the following command:
   - `npm install`
   - `npm run dev` to start the Vite server

Also, you need to create two databases in pgAdmin before setting up the project.
