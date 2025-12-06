# HomeHive Backend

A comprehensive Django REST API for the HomeHive rental property platform.

## Features

- **Authentication**: JWT-based auth with role selection (Landlord/Tenant)
- **Social Login**: Google, Microsoft, and Apple OAuth support
- **Property Management**: CRUD operations with image galleries (Supabase Storage)
- **Advanced Search**: Filter by location, price, property type, bedrooms, bathrooms, amenities
- **Premium Listings**: Featured properties pinned to top
- **Real-time Chat**: WebSocket support via Django Channels
- **Reviews & Ratings**: Tenants review after lease confirmation
- **Notifications**: Auto-generated for messages, property updates, reviews, leases
- **Admin Panel**: Manage property type help pages

## Setup

1. **Create `.env` file** (copy from `.env.example`):
   ```bash
   cp .env.example .env
   ```
   
2. **Configure environment variables**:
   - `SUPABASE_URL`, `SUPABASE_KEY`, `DATABASE_URL`
   - `REDIS_URL` for Channels
   - OAuth credentials (optional)

3. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Run migrations**:
   ```bash
   python manage.py makemigrations
   python manage.py migrate
   ```

5. **Create superuser**:
   ```bash
   python manage.py createsuperuser
   ```

6. **Run development server**:
   ```bash
   # For HTTP only
   python manage.py runserver
   
   # For WebSocket support (Channels)
   daphne -b 0.0.0.0 -p 8000 homehive.asgi:application
   ```

7. **Start Redis** (required for chat):
   ```bash
   redis-server
   ```

## API Endpoints

### Authentication (`/api/auth/`)
- `POST /register/` - User registration with role
- `POST /login/` - JWT login
- `POST /refresh/` - Refresh JWT token
- `GET/PATCH /profile/` - User profile
- `GET/PATCH /notifications/` - Notification preferences

### Properties (`/api/properties/`)
- `GET /` - List/search properties
- `POST /` - Create property (landlords only)
- `GET /{id}/` - Property details
- `PATCH /{id}/` - Update property (owner only)
- `DELETE /{id}/` - Delete property (owner only)
- `GET /featured/` - Premium listings
- `POST /{id}/save/` - Save property (tenants)
- `GET /saved/` - Saved properties
- `GET /analytics/` - Landlord analytics

### Chat (`/api/chat/`)
- `GET /rooms/` - List chat rooms
- `POST /rooms/create/` - Create/get room for property
- `GET /rooms/{id}/messages/` - Chat history
- `PATCH /rooms/{id}/mark-read/` - Mark messages read
- WebSocket: `ws/chat/{room_id}/`

### Reviews (`/api/reviews/`)
- `POST /leases/confirm/` - Confirm lease (landlords)
- `GET /leases/` - List leases
- `POST /create/` - Submit review (tenants)
- `GET /property/{id}/` - Property reviews
- `GET /landlord/{id}/` - Landlord reviews

### Notifications (`/api/notifications/`)
- `GET /` - List notifications
- `PATCH /{id}/read/` - Mark as read
- `PATCH /mark-all-read/` - Mark all as read

### Help (`/api/help/`)
- `GET /property-types/` - Property type help pages

## Admin Panel

Access at `/admin/` to:
- Manage users, properties, chats, reviews
- Create/edit property type help pages
- View analytics

## Database Schema

- **CustomUser**: Email-based auth with role (Landlord/Tenant)
- **Property**: Listings with location, price, amenities
- **PropertyImage**: Multiple images per property (Supabase URLs)
- **SavedProperty**: Tenant favorites
- **ChatRoom**: Landlord-tenant conversations
- **Message**: Chat messages
- **LeaseConfirmation**: Landlord confirms lease with tenant
- **Review**: Tenant reviews after lease
- **Notification**: Auto-generated notifications
- **PropertyTypeHelp**: Admin-managed help content

## Tech Stack

- Django 5.0 + Django REST Framework
- Django Channels (WebSocket)
- PostgreSQL (Supabase)
- Redis (Channel Layer)
- Supabase Storage (images)
- JWT authentication
- django-allauth (social login)
