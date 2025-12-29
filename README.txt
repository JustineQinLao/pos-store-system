# POS + Inventory + Ordering System

This is a full-stack application built with Angular (frontend) and Django (backend), containerized with Docker.

## Project Structure

- **Angular Frontend**: Runs on port 4584
- **Django Backend**: Runs on port 8083
- **Virtual Environment**: Located in `env/` (will be removed later)
- **Backend Directory**: Contains Django project and API app

## Running the Application

### Using Docker (Recommended)
```bash
docker compose up --build
```

Access the applications:
- Angular: http://localhost:4584
- Django: http://localhost:8083

### Running Locally

#### Angular
```bash
ng serve
```
Access at: http://localhost:4200

#### Django
```bash
cd backend
source ../env/bin/activate
python manage.py runserver
```
Access at: http://127.0.0.1:8000

## Technologies

- **Frontend**: Angular 19 with CSS
- **Backend**: Django 6.0
- **Containerization**: Docker & Docker Compose
- **Python**: 3.11
- **Node**: 18

## Notes

- The virtual environment (`env/`) is in the Angular root directory and will be removed later
- Django backend is located directly in the Angular project root
- No UI framework has been added at this stage
