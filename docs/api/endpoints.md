# API Endpoints

Our REST API provides programmatic access to all platform features.

## Base URL

All API requests should be made to:

```
https://api.example.com/v1
```

## Authentication

All API requests require authentication using an API key. Include your API key in the Authorization header:

```bash
Authorization: Bearer YOUR_API_KEY
```

## Rate Limits

API requests are rate limited to prevent abuse:

- **Free tier**: 1,000 requests per hour
- **Pro tier**: 10,000 requests per hour
- **Enterprise**: Custom limits

## Endpoints

### Users

#### Get User Profile

```http
GET /users/me
```

**Response:**

```json
{
  "id": "user_123",
  "email": "user@example.com",
  "name": "John Doe",
  "created_at": "2024-01-01T00:00:00Z",
  "subscription": {
    "plan": "pro",
    "status": "active"
  }
}
```

### Projects

#### List Projects

```http
GET /projects
```

**Response:**

```json
{
  "projects": [
    {
      "id": "proj_123",
      "name": "My Project",
      "description": "A sample project",
      "created_at": "2024-01-01T00:00:00Z",
      "status": "active"
    }
  ],
  "total": 1
}
```

## Error Handling

All errors follow a consistent format:

```json
{
  "error": {
    "code": "INVALID_REQUEST",
    "message": "The request was invalid",
    "details": {
      "field": "email",
      "reason": "Invalid email format"
    }
  }
}
```

### Common Error Codes

- `INVALID_REQUEST` (400): The request was malformed
- `UNAUTHORIZED` (401): Invalid or missing API key
- `FORBIDDEN` (403): Insufficient permissions
- `NOT_FOUND` (404): Resource not found
- `RATE_LIMITED` (429): Too many requests
- `INTERNAL_ERROR` (500): Server error
