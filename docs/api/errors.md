# Error Handling

Learn how to handle errors in our API and understand error codes.

## Error Format

All API errors follow a consistent JSON format:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {
      "field": "field_name",
      "reason": "Specific reason for the error"
    }
  }
}
```

## HTTP Status Codes

Our API uses standard HTTP status codes:

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `429` - Too Many Requests
- `500` - Internal Server Error

## Common Error Codes

### Authentication Errors

#### `UNAUTHORIZED` (401)

```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Invalid or missing API key",
    "details": {
      "reason": "API key is required for this endpoint"
    }
  }
}
```

**Solutions:**
- Check that you're including the `Authorization` header
- Verify your API key is correct
- Ensure your API key hasn't expired

#### `FORBIDDEN` (403)

```json
{
  "error": {
    "code": "FORBIDDEN",
    "message": "Insufficient permissions",
    "details": {
      "required_permission": "users:write",
      "current_permissions": ["users:read"]
    }
  }
}
```

**Solutions:**
- Check your API key permissions
- Upgrade to a higher-tier plan if needed
- Contact support for additional permissions

### Validation Errors

#### `INVALID_REQUEST` (400)

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

**Solutions:**
- Check the request format
- Validate input data
- Review the API documentation

### Rate Limiting

#### `RATE_LIMITED` (429)

```json
{
  "error": {
    "code": "RATE_LIMITED",
    "message": "Too many requests",
    "details": {
      "limit": 1000,
      "reset_time": "2024-01-01T01:00:00Z"
    }
  }
}
```

**Solutions:**
- Implement exponential backoff
- Reduce request frequency
- Upgrade your plan for higher limits

### Server Errors

#### `INTERNAL_ERROR` (500)

```json
{
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "An internal server error occurred",
    "details": {
      "request_id": "req_123456789"
    }
  }
}
```

**Solutions:**
- Retry the request after a short delay
- Contact support with the request ID
- Check our status page for known issues

## Error Handling Best Practices

### 1. Always Check Status Codes

```javascript
const response = await fetch('/api/users', {
  headers: {
    'Authorization': `Bearer ${apiKey}`
  }
});

if (!response.ok) {
  const error = await response.json();
  console.error('API Error:', error);
  // Handle the error appropriately
}
```

### 2. Implement Retry Logic

```javascript
async function makeRequestWithRetry(url, options, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url, options);
      if (response.ok) {
        return response;
      }
      
      if (response.status === 429) {
        // Rate limited - wait and retry
        const delay = Math.pow(2, i) * 1000; // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      
      // For other errors, don't retry
      throw new Error(`HTTP ${response.status}`);
    } catch (error) {
      if (i === maxRetries - 1) {
        throw error;
      }
    }
  }
}
```

### 3. Log Errors for Debugging

```javascript
function logError(error, context) {
  console.error('API Error:', {
    code: error.code,
    message: error.message,
    details: error.details,
    context: context,
    timestamp: new Date().toISOString()
  });
}
```

## Getting Help

If you're experiencing persistent errors:

1. Check our [status page](https://status.example.com)
2. Review the [API documentation](/docs/api/endpoints)
3. [Contact support](mailto:support@example.com) with:
   - Error code and message
   - Request details
   - Timestamp of the error
