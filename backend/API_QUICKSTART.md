# HomeHive API Quick Reference

## Base URL
```
http://localhost:8000/api/
```

## Authentication

### Register
```bash
POST /api/auth/register/
{
  "email": "user@example.com",
  "username": "username",
  "password": "securepass123",
  "password_confirm": "securepass123",
  "role": "LANDLORD"  # or "TENANT"
}
```

### Login
```bash
POST /api/auth/login/
{
  "email": "user@example.com",
  "password": "securepass123"
}

# Returns:
{
  "access": "jwt-token",
  "refresh": "refresh-token",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "role": "LANDLORD",
    ...
  }
}
```

### Use Token
```bash
Authorization: Bearer <access-token>
```

---

## Properties

### List/Search
```bash
GET /api/properties/?city=Lagos&min_price=100000&max_price=500000&property_type=APARTMENT&num_bedrooms=2
```

### Create Property (Landlord Only)
```bash
POST /api/properties/
Authorization: Bearer <token>
{
  "title": "2BR Apartment in Lekki",
  "description": "Beautiful apartment...",
  "price": "450000",
  "location": "Lekki, Lagos",
  "zip_code": "105102",
  "property_type": "APARTMENT",
  "num_bedrooms": 2,
  "num_bathrooms": 2,
  "amenities_list": ["Pool", "Gym", "24/7 Security"],
  "is_premium": false,
  "image_urls": [
    "https://supabase.co/storage/.../image1.jpg"
  ]
}
```

### Save Property (Tenant)
```bash
POST /api/properties/{id}/save/
Authorization: Bearer <tenant-token>
```

---

## Chat

### Create Chat Room
```bash
POST /api/chat/rooms/create/
Authorization: Bearer <tenant-token>
{
  "property_id": 1
}
```

### WebSocket Connection
```javascript
const ws = new WebSocket('ws://localhost:8000/ws/chat/1/');
ws.send(JSON.stringify({message: "Hello!"}));
```

---

## Reviews

### Confirm Lease (Landlord)
```bash
POST /api/reviews/leases/confirm/
Authorization: Bearer <landlord-token>
{
  "property_id": 1,
  "tenant_id": 2,
  "notes": "Lease starts Jan 1, 2025"
}
```

### Submit Review (Tenant)
```bash
POST /api/reviews/create/
Authorization: Bearer <tenant-token>
{
  "lease_confirmation_id": 1,
  "rating": 5,
  "comment": "Great property and landlord!",
  "is_public": true
}
```

---

## Notifications

### List Notifications
```bash
GET /api/notifications/
Authorization: Bearer <token>
```

### Mark All Read
```bash
PATCH /api/notifications/mark-all-read/
Authorization: Bearer <token>
```
