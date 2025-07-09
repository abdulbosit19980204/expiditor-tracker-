# Expeditor Tracker Backend

Django REST Framework backend for the Modern Expeditor Tracker application.

## Features

- **Complete REST API** for expeditor tracking
- **Advanced filtering** and search capabilities
- **Real-time statistics** with comprehensive analytics
- **PostgreSQL database** with optimized queries
- **Docker support** for easy deployment
- **Admin interface** for data management
- **CORS enabled** for frontend integration

## Models

### Core Models
- **Projects** - Project management
- **Sklad** - Warehouse management  
- **City** - City management
- **Ekispiditor** - Expeditor management with today's check count
- **Check** - Main check records with location data
- **CheckDetail** - Detailed check information with payment methods

## API Endpoints

### Base URL: `/api/`

#### Core Resources
- `GET/POST /projects/` - Projects CRUD
- `GET/POST /sklad/` - Warehouse CRUD
- `GET/POST /city/` - Cities CRUD
- `GET/POST /ekispiditor/` - Expeditors CRUD
- `GET/POST /check/` - Checks CRUD
- `GET/POST /check-details/` - Check details CRUD

#### Special Endpoints
- `GET /check/today_checks/` - Today's checks only
- `GET /check/with_locations/` - Checks with GPS coordinates
- `GET /statistics/` - Comprehensive statistics

### Statistics API

`GET /api/statistics/`

**Query Parameters:**
- `date_from` - Filter from date (ISO format)
- `date_to` - Filter to date (ISO format)  
- `project` - Filter by project name
- `sklad` - Filter by warehouse
- `city` - Filter by city
- `ekispiditor` - Filter by expeditor
- `status` - Filter by status (delivered/failed/pending)

**Response:**
\`\`\`json
{
  "overview": {
    "total_checks": 150,
    "delivered_checks": 120,
    "failed_checks": 20,
    "pending_checks": 10,
    "success_rate": 80.0
  },
  "payment_stats": {
    "total_sum": 15000000,
    "nalichniy": 6000000,
    "uzcard": 4500000,
    "humo": 3000000,
    "click": 1500000
  },
  "top_expeditors": [...],
  "top_projects": [...],
  "top_cities": [...],
  "daily_stats": [...]
}
\`\`\`

## Installation

### Local Development

1. **Clone the repository**
\`\`\`bash
git clone <repository-url>
cd backend
\`\`\`

2. **Create virtual environment**
\`\`\`bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
\`\`\`

3. **Install dependencies**
\`\`\`bash
pip install -r requirements.txt
\`\`\`

4. **Setup environment variables**
\`\`\`bash
cp .env.example .env
# Edit .env with your settings
\`\`\`

5. **Setup database**
\`\`\`bash
python manage.py makemigrations
python manage.py migrate
\`\`\`

6. **Create superuser**
\`\`\`bash
python manage.py createsuperuser
\`\`\`

7. **Create sample data**
\`\`\`bash
python manage.py create_sample_data
\`\`\`

8. **Run development server**
\`\`\`bash
python manage.py runserver
\`\`\`

### Docker Deployment

1. **Using Docker Compose**
\`\`\`bash
docker-compose up -d
\`\`\`

2. **Run migrations**
\`\`\`bash
docker-compose exec web python manage.py migrate
\`\`\`

3. **Create superuser**
\`\`\`bash
docker-compose exec web python manage.py createsuperuser
\`\`\`

4. **Create sample data**
\`\`\`bash
docker-compose exec web python manage.py create_sample_data
\`\`\`

## Environment Variables

\`\`\`env
# Django Settings
SECRET_KEY=your-secret-key-here
DEBUG=True

# Database Settings  
DB_NAME=expeditor_db
DB_USER=postgres
DB_PASSWORD=password
DB_HOST=localhost
DB_PORT=5432

# CORS Settings
CORS_ALLOWED_ORIGINS=http://localhost:3000,https://your-frontend.vercel.app
\`\`\`

## Database Schema

### Check Model
- `check_id` - Unique check identifier
- `project` - Project name
- `sklad` - Warehouse name
- `city` - City name
- `ekispiditor` - Expeditor name
- `yetkazilgan_vaqti` - Delivery time
- `client_name` - Client name
- `client_address` - Client address
- `check_lat/check_lon` - GPS coordinates
- `status` - Delivery status

### CheckDetail Model
- `check_id` - Links to Check
- `checkURL` - soliq.uz check URL
- `total_sum` - Total amount
- `nalichniy` - Cash payment
- `uzcard` - UzCard payment
- `humo` - Humo payment
- `click` - Click payment

## Admin Interface

Access the admin interface at `/admin/` to:
- Manage all data models
- View today's check counts for expeditors
- Filter and search records
- Export data

## API Features

### Filtering
All list endpoints support:
- **Search** - Text search across relevant fields
- **Filtering** - Field-specific filters
- **Ordering** - Sort by any field
- **Pagination** - Paginated responses

### Advanced Check Filtering
- Date range filtering
- Multi-field text search
- Status filtering
- Location-based filtering

## Production Deployment

### Vercel Deployment
1. Install Vercel CLI
2. Configure environment variables
3. Deploy with `vercel --prod`

### Traditional Server
1. Use gunicorn WSGI server
2. Configure nginx reverse proxy
3. Setup PostgreSQL database
4. Configure environment variables

## Integration with Frontend

Set the frontend environment variable:
\`\`\`env
NEXT_PUBLIC_API_URL=https://your-backend-domain.com/api
\`\`\`

The frontend will automatically connect to all endpoints and display:
- Real-time statistics
- Interactive maps with check locations
- Advanced filtering capabilities
- Check details with payment information

## Sample Data

Run the management command to create sample data:
\`\`\`bash
python manage.py create_sample_data
\`\`\`

This creates:
- 3 Projects
- 3 Warehouses  
- 5 Cities
- 4 Expeditors
- 200 Checks with details (last 30 days)

## Support

For issues and questions:
1. Check the Django logs
2. Verify database connections
3. Ensure CORS settings are correct
4. Check environment variables

## License

This project is licensed under the MIT License.
