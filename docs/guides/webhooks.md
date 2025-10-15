# Webhooks

Learn how to set up and use webhooks to receive real-time notifications from our platform.

## Overview

Webhooks allow you to receive real-time notifications when events occur in your account. Instead of polling our API for changes, you can set up webhooks to be notified immediately.

## Setting Up Webhooks

### 1. Create a Webhook Endpoint

First, create an endpoint in your application to receive webhook notifications:

```javascript
// Express.js example
app.post('/webhooks/events', (req, res) => {
  const event = req.body;
  
  // Verify the webhook signature
  if (!verifyWebhookSignature(req)) {
    return res.status(401).send('Unauthorized');
  }
  
  // Process the event
  handleWebhookEvent(event);
  
  res.status(200).send('OK');
});
```

### 2. Configure Webhook in Dashboard

1. Log into your dashboard
2. Navigate to "Webhooks" in the settings
3. Click "Add Webhook"
4. Enter your endpoint URL
5. Select the events you want to receive
6. Save the configuration

## Webhook Events

### User Events

- `user.created` - A new user is created
- `user.updated` - User information is updated
- `user.deleted` - A user is deleted

### Project Events

- `project.created` - A new project is created
- `project.updated` - Project settings are updated
- `project.deleted` - A project is deleted

### Data Events

- `data.created` - New data is added
- `data.updated` - Existing data is modified
- `data.deleted` - Data is removed

## Webhook Payload

All webhook payloads follow this structure:

```json
{
  "id": "evt_1234567890",
  "type": "user.created",
  "created": 1640995200,
  "data": {
    "object": {
      "id": "user_123",
      "email": "user@example.com",
      "name": "John Doe"
    }
  }
}
```

## Security

### Signature Verification

Always verify webhook signatures to ensure the request comes from our platform:

```javascript
const crypto = require('crypto');

function verifyWebhookSignature(req) {
  const signature = req.headers['x-signature'];
  const payload = JSON.stringify(req.body);
  const secret = process.env.WEBHOOK_SECRET;
  
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  
  return signature === expectedSignature;
}
```

### HTTPS Only

Webhooks must be sent to HTTPS endpoints. We do not support HTTP endpoints for security reasons.

## Retry Logic

If your webhook endpoint returns an error (4xx or 5xx status code), we will retry the delivery:

- **Immediate retry**: After 1 second
- **Second retry**: After 10 seconds
- **Third retry**: After 100 seconds
- **Final retry**: After 1000 seconds

After all retries are exhausted, the webhook will be marked as failed.

## Testing Webhooks

### Using ngrok

For local development, use ngrok to expose your local server:

```bash
# Install ngrok
npm install -g ngrok

# Expose your local server
ngrok http 3000
```

Then use the ngrok URL as your webhook endpoint.

### Webhook Testing Tool

We provide a webhook testing tool in your dashboard:

1. Go to "Webhooks" in your dashboard
2. Click "Test Webhook"
3. Select an event type
4. Send a test payload

## Best Practices

1. **Idempotency**: Make your webhook handlers idempotent
2. **Quick Response**: Return a 200 status code quickly
3. **Error Handling**: Handle errors gracefully
4. **Logging**: Log all webhook events for debugging
5. **Monitoring**: Monitor webhook delivery success rates

## Troubleshooting

### Common Issues

- **Webhook not received**: Check your endpoint URL and firewall settings
- **Signature verification failed**: Verify your webhook secret
- **Timeout errors**: Ensure your endpoint responds quickly
- **Duplicate events**: Implement idempotency in your handlers

### Getting Help

- [Contact Support](mailto:support@example.com)
- [Check our FAQ](/docs/faq)
- [Community Forum](https://forum.example.com)
