# POS Store - Modern Point of Sale System

![Angular](https://img.shields.io/badge/Angular-19-red)
![Django](https://img.shields.io/badge/Django-5.1.4-green)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)
![Python](https://img.shields.io/badge/Python-3.11-blue)
![License](https://img.shields.io/badge/License-MIT-yellow)
![Docker](https://img.shields.io/badge/Docker-Ready-blue)

A comprehensive, modern Point of Sale (POS) system designed for retail businesses, featuring innovative QR code checkout, real-time inventory management, and secure role-based access control. Built with cutting-edge technologies including Angular 19 and Django 5.1.4.

## 📖 Project Overview

This POS system revolutionizes the traditional checkout process by introducing QR code-based transactions while maintaining all essential retail management features. The system is designed to handle everything from small convenience stores to larger retail operations with multiple user roles and comprehensive inventory tracking.

### 🎯 Key Innovations

- **QR Code Checkout**: Customers can generate encrypted QR codes containing their cart data, enabling contactless and efficient checkout
- **Real-time Inventory**: Automatic stock updates with validation to prevent overselling
- **Role-based Security**: Three-tier access control with encrypted JWT authentication
- **Containerized Deployment**: Full Docker support for easy deployment and scaling

## 🚀 Implemented Features

### ✅ Authentication & Authorization System
- **Three-Tier Role System**:
  - **Super Admin**: Complete system control, user verification, and system configuration
  - **Admin**: Product management, inventory control, order history, and reporting
  - **Cashier**: POS operations, transaction processing, and customer service
- **JWT Token Authentication**: Secure token-based authentication with automatic refresh
- **AES Encryption**: Client-side token encryption for enhanced security
- **User Verification Workflow**: New users require Super Admin approval before system access
- **Protected Routes**: Role-based route guards preventing unauthorized access
- **Session Management**: Automatic logout on token expiration with secure cleanup

### ✅ Product & Inventory Management
- **Complete Product Lifecycle**:
  - Create, read, update, and delete products with full validation
  - Product variants (size, color, type) with individual pricing
  - Add-ons and extras with separate pricing structures
  - Category organization with hierarchical support
- **Inventory Intelligence**:
  - Real-time stock tracking with automatic updates
  - Low stock threshold alerts with customizable limits
  - Out-of-stock prevention with validation checks
  - Stock adjustment history and audit trails
- **Advanced Search & Filtering**:
  - Server-side pagination (10 items per page) for optimal performance
  - Multi-criteria filtering (category, price range, stock status)
  - Real-time search with debounced input
  - Active/inactive product management

### ✅ QR Code Checkout System
- **QR Code Innovation**:
  - Customers generate encrypted QR codes containing complete cart data
  - QR codes include product details, quantities, and pricing
  - Encrypted payload prevents tampering and ensures data integrity
  - Cashier scanner validates and processes QR codes instantly
- **Public Shopping Experience**:
  - No customer login required for shopping
  - Product browsing with filtering and search
  - Shopping cart with encrypted localStorage storage
  - Real-time stock validation during cart operations

### ✅ Transaction Management
- **Complete Transaction System**:
  - Detailed transaction logs for cashiers and administrators
  - Transaction search and filtering by date, amount, and status
  - Individual transaction details with complete cart snapshots
  - Automatic inventory deduction upon successful payment
- **Financial Tracking**:
  - Payment amount and change calculation tracking
  - Transaction status management (Pending, Completed, Cancelled, Refunded)
  - Refund processing with automatic inventory restoration
  - Unique transaction number generation

### ✅ Admin Dashboard
- **Management Tools**:
  - Product management with CRUD operations
  - Category management interface
  - Inventory management with stock adjustments
  - Order history with detailed transaction views
- **User Management**:
  - Super Admin can view unverified users
  - Manual user verification system
  - Role-based access control

### ✅ Security Implementation
- **End-to-End Encryption**:
  - AES encryption for sensitive data transmission
  - Configurable encryption settings via Django admin
  - Route-specific encryption exclusions for optimization
  - Client-side cart data encryption in localStorage
- **Authentication Security**:
  - JWT token-based authentication with refresh token rotation
  - Password hashing using Django's built-in security
  - Session timeout and automatic cleanup
  - CSRF protection and XSS prevention

### 🔄 Pending Features
- **Media Management**: Product image upload component
- **Analytics Dashboard**: Sales trends and revenue analytics
- **Responsive Design**: Mobile optimization
- **Export Functionality**: CSV/Excel/PDF reports
- **Notifications**: Low stock alerts system

## 🛠️ Tech Stack

### Frontend
- **Angular 19** - Modern web framework
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **RxJS** - Reactive programming
- **CryptoJS** - Client-side encryption
- **QR Code Generator** - QR code functionality

### Backend
- **Django 5.1.4** - Python web framework
- **Django REST Framework 3.16.x** - RESTful API
- **PostgreSQL** - Production database
- **SQLite** - Development database
- **JWT Authentication** - djangorestframework-simplejwt
- **Cryptography (Fernet)** - Server-side encryption

### DevOps
- **Docker & Docker Compose** - Containerization
- **Nginx** - Reverse proxy (production)
- **Git** - Version control

## 📋 Prerequisites

### System Requirements
- **Docker** 20.10+ and **Docker Compose** 2.0+ (recommended for production)
- **Node.js 18+** and **npm 9+** (for local development)
- **Python 3.11+** with **pip** (for local development)
- **PostgreSQL 13+** (for production database)
- **Git** for version control

### Hardware Requirements
- **Minimum**: 2GB RAM, 2 CPU cores, 10GB storage
- **Recommended**: 4GB RAM, 4 CPU cores, 20GB storage
- **Production**: 8GB RAM, 8 CPU cores, 50GB+ storage

## 🚀 Quick Start with Docker (Recommended)

### Option 1: Production Setup
```bash
# 1. Clone the repository
git clone https://github.com/JustineQinLao/pos-store-system.git
cd pos-store-system

# 2. Configure environment variables
cp backend/.env.example backend/.env
# Edit backend/.env with your production settings

# 3. Start all services
docker compose up -d

# 4. Initialize database (first time only)
docker compose exec django python manage.py migrate
docker compose exec django python manage.py createsuperuser

# 5. Load sample data (optional)
docker compose exec django python manage.py seed_all
```

### Option 2: Development Setup
```bash
# 1. Clone and navigate
git clone https://github.com/JustineQinLao/pos-store-system.git
cd pos-store-system

# 2. Start with development configuration
docker compose -f docker-compose.dev.yml up -d

# 3. Access development tools
# - Frontend with hot reload: http://localhost:4200
# - Backend with debug mode: http://localhost:8083
# - Database admin: http://localhost:8080 (pgAdmin)
```

### 🌐 Application Access Points
- **Frontend Application**: http://localhost:4584
- **Backend API**: http://localhost:8083/api
- **Django Admin Panel**: http://localhost:8083/admin
- **API Documentation**: http://localhost:8083/api/docs (Swagger)
- **PostgreSQL Database**: localhost:5436 (external access)

### 🔑 Default Login Credentials
After running `seed_users` command:

| Role | Username | Email | Password |
|------|----------|-------|----------|
| **Super Admin** | `admin` | `admin@posstore.com` | `admin123` |
| **Super Admin** | `test_superadmin1` | `superadmin1@posstore.com` | `SuperAdmin123!` |
| **Admin** | `test_admin1` | `admin1@posstore.com` | `Admin123!` |
| **Cashier** | `test_cashier1` | `cashier1@posstore.com` | `Cashier123!` |

> ⚠️ **Security Note**: These are TEST credentials only. Change all passwords in production!

## 📦 Manual Installation (Local Development)

### Backend Setup (Django)

1. **Navigate to backend directory**
```bash
cd backend
```

2. **Create and activate virtual environment**
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. **Install Python dependencies**
```bash
pip install -r requirements.txt
```

4. **Configure environment variables**
```bash
cp .env.example .env
# Edit .env file with your local settings
```

5. **Initialize database**
```bash
python manage.py migrate
python manage.py createsuperuser
```

6. **Load sample data (optional)**
```bash
python manage.py seed_all
```

7. **Start Django development server**
```bash
python manage.py runserver 8083
```

### Frontend Setup (Angular)

1. **Navigate to project root**
```bash
cd ../  # Back to project root
```

2. **Install Node.js dependencies**
```bash
npm install
```

3. **Start Angular development server**
```bash
npm start
# or
ng serve
```

4. **Access the application**
- Frontend: http://localhost:4584
- Backend API: http://localhost:8083/api

### 🔧 Development Tools Setup

#### Database Management
```bash
# Install PostgreSQL (Ubuntu/Debian)
sudo apt update
sudo apt install postgresql postgresql-contrib

# Create database
sudo -u postgres createdb pos_store_db
sudo -u postgres createuser pos_admin
```

#### Code Quality Tools
```bash
# Install pre-commit hooks
pip install pre-commit
pre-commit install

# Run linting
npm run lint        # Frontend
flake8 backend/     # Backend
```

## 🔑 User Management & Testing

### Default Test Accounts
After running `python manage.py seed_users`:

| Role | Username | Email | Password | Permissions |
|------|----------|-------|----------|-------------|
| **Super Admin** | `admin` | `admin@posstore.com` | `admin123` | Full system access, user verification, system config |
| **Super Admin** | `test_superadmin1` | `superadmin1@posstore.com` | `SuperAdmin123!` | Full system access, user verification, system config |
| **Admin** | `test_admin1` | `admin1@posstore.com` | `Admin123!` | Product/inventory management, reports, order history |
| **Cashier** | `test_cashier1` | `cashier1@posstore.com` | `Cashier123!` | POS operations, transaction processing |

### Creating Custom Users
1. **Via Django Admin**: http://localhost:8083/admin
2. **Via Registration**: Users register and await Super Admin approval
3. **Via Management Command**:
```bash
python manage.py createsuperuser
```

### User Workflow
1. **Registration**: New users register with email/password
2. **Verification**: Super Admin approves/rejects new users
3. **Role Assignment**: Super Admin assigns appropriate roles
4. **Access**: Users gain access based on their assigned role

## 📁 Detailed Project Structure

```
pos-store-system/
├── 📁 backend/                     # Django REST API Backend
│   ├── 📁 api/                     # Main API application
│   │   ├── 📄 models.py           # Database models (User, Product, Transaction, etc.)
│   │   ├── 📄 views.py            # API endpoints and business logic
│   │   ├── 📄 serializers.py      # DRF serializers for data validation
│   │   ├── 📄 urls.py             # API URL routing
│   │   ├── 📄 encryption.py       # Encryption utilities
│   │   ├── 📄 middleware.py       # Custom middleware for encryption
│   │   ├── 📁 management/         # Django management commands
│   │   │   └── 📁 commands/       # Custom commands (seed_all, etc.)
│   │   └── 📁 migrations/         # Database migration files
│   ├── 📁 backend/                # Django project settings
│   │   ├── 📄 settings.py         # Django configuration
│   │   ├── 📄 urls.py             # Main URL configuration
│   │   └── 📄 wsgi.py             # WSGI application
│   ├── 📄 manage.py               # Django management script
│   ├── 📄 requirements.txt        # Python dependencies
│   └── 📄 .env.example           # Environment variables template
├── 📁 src/                        # Angular Frontend Application
│   ├── 📁 app/
│   │   ├── 📁 components/         # Reusable UI components
│   │   │   ├── 📁 login/          # Authentication components
│   │   │   ├── 📁 navbar/         # Navigation component
│   │   │   └── 📁 product-detail-modal/
│   │   ├── 📁 pages/              # Main application pages
│   │   │   ├── 📁 admin/          # Admin dashboard and management
│   │   │   │   ├── 📁 dashboard/  # Admin overview
│   │   │   │   ├── 📁 product-management/
│   │   │   │   ├── 📁 inventory-management/
│   │   │   │   └── 📁 orders/     # Transaction history
│   │   │   ├── 📁 cashier/        # Cashier POS interface
│   │   │   ├── 📁 cart/           # Shopping cart functionality
│   │   │   └── 📁 products/       # Product catalog
│   │   ├── 📁 services/           # Angular services
│   │   │   ├── 📄 auth.service.ts # Authentication service
│   │   │   ├── 📄 product.service.ts # Product API service
│   │   │   ├── 📄 cart.service.ts # Cart management
│   │   │   └── 📄 encryption.service.ts # Client-side encryption
│   │   ├── 📁 guards/             # Route protection
│   │   │   ├── 📄 auth.guard.ts   # Authentication guard
│   │   │   └── 📄 role.guard.ts   # Role-based access guard
│   │   └── 📁 interceptors/       # HTTP interceptors
│   ├── 📄 index.html              # Main HTML template
│   ├── 📄 main.ts                 # Angular bootstrap
│   └── 📄 styles.css              # Global styles
├── 📁 docker/                     # Docker configuration files
│   ├── 📄 angular.Dockerfile      # Frontend container
│   └── 📄 django.Dockerfile       # Backend container
├── 📄 docker-compose.yml          # Multi-container orchestration
├── 📄 package.json                # Node.js dependencies and scripts
├── 📄 angular.json                # Angular CLI configuration
├── 📄 tailwind.config.js          # Tailwind CSS configuration
├── 📄 tsconfig.json               # TypeScript configuration
├── 📄 .gitignore                  # Git ignore rules
├── 📄 README.md                   # Project documentation
└── 📄 GITHUB_SETUP.md             # GitHub setup guide
```

## 🔐 Environment Configuration

### Backend Environment Variables (.env)

```env
# Database Configuration
POSTGRES_DB=pos_store_db
POSTGRES_USER=pos_admin
POSTGRES_PASSWORD=pos_secure_password_2024


# Django Configuration
SECRET_KEY=django-insecure-change-this-in-production-k8#m9@x!2p$q&w*e
DEBUG=True
```

### Frontend Configuration

The Angular application uses a centralized configuration approach without separate environment files. API endpoints and settings are configured directly in the services and components.

## 🐳 Docker Commands

```bash
# Start all services
docker compose up -d

# Stop all services
docker compose down

# View logs
docker compose logs -f

# Rebuild containers
docker compose up -d --build

# Run Django commands
docker compose exec django python manage.py <command>

# Run migrations
docker compose exec django python manage.py migrate

# Create superuser
docker compose exec django python manage.py createsuperuser
```

## 📚 API Documentation

API endpoints are available at:
- Products: `/api/products/`
- Categories: `/api/categories/`
- Inventory: `/api/inventory/`
- Transactions: `/api/transactions/`
- Authentication: `/api/auth/`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 🙏 Acknowledgments

- Built with Angular and Django
- QR Code functionality for seamless checkout
- Encrypted communication for security
- Docker for easy deployment
