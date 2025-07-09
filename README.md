# Expeditor Tracker

Modern web application for tracking delivery expeditors and their check locations with real-time statistics and interactive maps.

## 🚀 Features

- **Real-time Tracking** - Track expeditor movements and check locations
- **Interactive Maps** - Yandex Maps integration with custom markers
- **Advanced Filtering** - Filter by date, project, warehouse, city, and more
- **Statistics Dashboard** - Comprehensive analytics and reporting
- **Check Management** - View detailed check information and payment methods
- **Mobile Responsive** - Optimized for all devices including Telegram WebApp

## 🛠️ Tech Stack

### Frontend
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **shadcn/ui** - Modern UI components
- **Yandex Maps API** - Interactive mapping

### Backend
- **Django REST Framework** - Python web framework
- **PostgreSQL** - Database
- **Docker** - Containerization
- **Gunicorn** - WSGI server

## 📦 Installation

### Frontend Setup

1. Clone the repository:
\`\`\`bash
git clone <repository-url>
cd expeditor-tracker
\`\`\`

2. Install dependencies:
\`\`\`bash
npm install
\`\`\`

3. Set up environment variables:
\`\`\`bash
cp .env.example .env.local
\`\`\`

Add your environment variables:
\`\`\`env
NEXT_PUBLIC_API_URL=http://localhost:8000/api
YANDEX_MAPS_API_KEY=your_yandex_maps_api_key
\`\`\`

4. Run the development server:
\`\`\`bash
npm run dev
\`\`\`

### Backend Setup

1. Navigate to backend directory:
\`\`\`bash
cd backend
\`\`\`

2. Create virtual environment:
\`\`\`bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
\`\`\`

3. Install dependencies:
\`\`\`bash
pip install -r requirements.txt
\`\`\`

4. Set up environment variables:
\`\`\`bash
cp .env.example .env
\`\`\`

5. Run migrations:
\`\`\`bash
python manage.py migrate
\`\`\`

6. Create sample data:
\`\`\`bash
python manage.py create_sample_data
\`\`\`

7. Run the server:
\`\`\`bash
python manage.py runserver
\`\`\`

## 🐳 Docker Setup

### Using Docker Compose

1. Build and run all services:
\`\`\`bash
docker-compose up --build
\`\`\`

2. Run migrations:
\`\`\`bash
docker-compose exec backend python manage.py migrate
\`\`\`

3. Create sample data:
\`\`\`bash
docker-compose exec backend python manage.py create_sample_data
\`\`\`

## 📱 API Endpoints

### Core Endpoints
- `GET /api/projects/` - List all projects
- `GET /api/sklad/` - List all warehouses
- `GET /api/city/` - List all cities
- `GET /api/ekispiditor/` - List all expeditors
- `GET /api/check/` - List all checks with filtering
- `GET /api/check-details/` - List check details
- `GET /api/statistics/` - Get statistics data

### Filtering Parameters
- `dateFrom` - Start date (YYYY-MM-DD)
- `dateTo` - End date (YYYY-MM-DD)
- `project` - Project name
- `sklad` - Warehouse name
- `city` - City name
- `expeditor` - Expeditor name
- `search` - Search query

### Example API Calls

\`\`\`bash
# Get all checks
curl http://localhost:8000/api/check/

# Get filtered checks
curl "http://localhost:8000/api/check/?project=Loyiha 1&dateFrom=2024-01-01"

# Get statistics
curl http://localhost:8000/api/statistics/
\`\`\`

## 🗺️ Map Integration

The application uses Yandex Maps API for displaying check locations:

1. Get your API key from [Yandex Developer Console](https://developer.tech.yandex.ru/)
2. Add it to your environment variables as `YANDEX_MAPS_API_KEY`
3. The map will automatically load and display check markers

### Map Features
- **Custom Markers** - Different colors for successful/failed checks
- **Info Balloons** - Detailed check information on marker click
- **Auto Bounds** - Automatically fits all markers in view
- **Legend** - Visual guide for marker meanings

## 📊 Statistics Features

- **Total Checks** - Overall check count and sum
- **Payment Methods** - Breakdown by payment type (Cash, UzCard, Humo, Click)
- **Top Performers** - Best expeditors, projects, and cities
- **Success Rate** - Delivery success percentage
- **Daily Stats** - Day-by-day performance tracking

## 🔧 Configuration

### Environment Variables

#### Frontend (.env.local)
\`\`\`env
NEXT_PUBLIC_API_URL=http://localhost:8000/api
YANDEX_MAPS_API_KEY=your_api_key_here
\`\`\`

#### Backend (.env)
\`\`\`env
DEBUG=True
SECRET_KEY=your_secret_key_here
DATABASE_URL=postgresql://user:password@localhost:5432/expeditor_db
ALLOWED_HOSTS=localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=http://localhost:3000
\`\`\`

## 🚀 Deployment

### Frontend (Vercel)

1. Push to GitHub
2. Connect to Vercel
3. Add environment variables
4. Deploy

### Backend (Heroku/Railway)

1. Create new app
2. Add PostgreSQL addon
3. Set environment variables
4. Deploy from GitHub

### Docker Production

\`\`\`bash
# Build production images
docker-compose -f docker-compose.prod.yml build

# Run in production
docker-compose -f docker-compose.prod.yml up -d
\`\`\`

## 🧪 Testing

### Frontend Tests
\`\`\`bash
npm run test
\`\`\`

### Backend Tests
\`\`\`bash
python manage.py test
\`\`\`

## 📝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Support

For support, email support@expeditor-tracker.com or create an issue on GitHub.

## 🔄 Changelog

### v1.0.0
- Initial release
- Basic expeditor tracking
- Map integration
- Statistics dashboard
- Django REST API

### v1.1.0
- Advanced filtering
- Check modal details
- Mobile optimization
- Performance improvements

---

Made with ❤️ for efficient delivery tracking
