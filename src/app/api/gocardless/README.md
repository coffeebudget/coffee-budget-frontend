# GoCardless API Proxy Routes

## Overview

This directory contains Next.js API routes that proxy requests to the NestJS backend GoCardless service. These routes handle authentication, session management, and provide a secure interface between the frontend and backend.

## Architecture

```
Frontend (Next.js) → API Routes (Proxy) → Backend (NestJS) → GoCardless API
```

### Benefits of API Proxy Pattern

1. **Security**: Tokens are handled server-side, not exposed to client
2. **Session Management**: Automatic session validation using NextAuth
3. **Error Handling**: Consistent error responses across all endpoints
4. **CORS**: Eliminates cross-origin issues
5. **Caching**: Potential for server-side caching (future enhancement)

## Available Endpoints

### Authentication & Token Management

#### `POST /api/gocardless`

Creates a GoCardless access token.

**Request Body:**

```json
{
  "secretId": "string",
  "secretKey": "string"
}
```

**Response:**

```json
{
  "access": "string",
  "access_expires": "number",
  "refresh": "string",
  "refresh_expires": "number"
}
```

### Institution Management

#### `GET /api/gocardless/institutions`

Fetches institutions by country.

**Query Parameters:**

- `country` (optional): Country code (defaults to 'IT')

**Response:**

```json
[
  {
    "id": "string",
    "name": "string",
    "bic": "string",
    "transaction_total_days": "string",
    "countries": ["string"],
    "logo": "string"
  }
]
```

#### `GET /api/gocardless/institutions/italian-banks`

Fetches Italian banks specifically.

**Response:** Same as institutions endpoint, filtered for Italian banks.

### Connection Flow

#### `POST /api/gocardless/flow/start`

Starts the bank connection flow.

**Request Body:**

```json
{
  "institutionId": "string",
  "redirectUrl": "string",
  "reference": "string"
}
```

**Response:**

```json
{
  "authUrl": "string",
  "requisitionId": "string"
}
```

### Agreement Management

#### `POST /api/gocardless/agreements`

Creates an end user agreement.

**Request Body:**

```json
{
  "institutionId": "string",
  "maxHistoricalDays": "number",
  "accessValidForDays": "number",
  "accessScope": ["string"]
}
```

**Response:**

```json
{
  "id": "string",
  "created": "string",
  "max_historical_days": "number",
  "access_valid_for_days": "number",
  "access_scope": ["string"],
  "accepted": "string",
  "institution_id": "string"
}
```

### Requisition Management

#### `POST /api/gocardless/requisitions`

Creates a requisition.

**Request Body:**

```json
{
  "redirect": "string",
  "institution_id": "string",
  "agreement": "string",
  "reference": "string",
  "user_language": "string"
}
```

**Response:**

```json
{
  "id": "string",
  "created": "string",
  "redirect": "string",
  "status": "string",
  "institution_id": "string",
  "agreement": "string",
  "reference": "string",
  "accounts": ["string"],
  "user_language": "string",
  "link": "string",
  "ssn": "string"
}
```

#### `GET /api/gocardless/requisitions/[id]`

Fetches requisition details by ID.

**Path Parameters:**

- `id`: Requisition ID

**Response:**

```json
{
  "id": "string",
  "status": "string",
  "accounts": ["string"],
  "institution_id": "string",
  "reference": "string"
}
```

### Account Management

#### `GET /api/gocardless/accounts/[id]/details`

Fetches account details by ID.

**Path Parameters:**

- `id`: Account ID

**Response:**

```json
{
  "account": {
    "iban": "string",
    "name": "string",
    "currency": "string"
  }
}
```

#### `GET /api/gocardless/accounts/[id]/balances`

Fetches account balances by ID.

**Path Parameters:**

- `id`: Account ID

**Response:**

```json
{
  "balances": [
    {
      "balanceAmount": {
        "amount": "string",
        "currency": "string"
      },
      "balanceType": "string",
      "referenceDate": "string"
    }
  ]
}
```

#### `GET /api/gocardless/accounts/[id]/transactions`

Fetches account transactions by ID.

**Path Parameters:**

- `id`: Account ID

**Response:**

```json
{
  "transactions": {
    "booked": [
      {
        "transactionId": "string",
        "bookingDate": "string",
        "valueDate": "string",
        "transactionAmount": {
          "amount": "string",
          "currency": "string"
        },
        "creditorName": "string",
        "debtorName": "string",
        "remittanceInformationUnstructured": "string"
      }
    ],
    "pending": []
  }
}
```

#### `GET /api/gocardless/connected-accounts`

Fetches all connected GoCardless accounts.

**Response:**

```json
{
  "connectedAccounts": [
    {
      "type": "bank_account" | "credit_card",
      "localId": "number",
      "localName": "string",
      "gocardlessAccountId": "string",
      "details": {
        "account": {
          "iban": "string",
          "name": "string",
          "currency": "string"
        }
      },
      "balances": {
        "balances": [
          {
            "balanceAmount": {
              "amount": "string",
              "currency": "string"
            },
            "balanceType": "string"
          }
        ]
      }
    }
  ]
}
```

### Transaction Import

#### `POST /api/gocardless/import/all`

Imports all transactions from connected accounts.

**Response:**

```json
{
  "summary": {
    "totalNewTransactions": "number",
    "totalDuplicates": "number"
  }
}
```

## Authentication

All endpoints require authentication via NextAuth session. The routes automatically:

1. Validate the user session
2. Extract the access token from the session
3. Forward the token to the backend
4. Handle authentication errors consistently

## Error Handling

All routes follow a consistent error handling pattern:

```json
{
  "error": "string"
}
```

Common HTTP status codes:

- `401`: Unauthorized (no valid session)
- `400`: Bad Request (invalid request data)
- `404`: Not Found (resource not found)
- `500`: Internal Server Error

## Environment Configuration

The routes use the following environment variable:

- `NEXT_PUBLIC_API_URL`: Backend API base URL (e.g., 'http://localhost:3002')

## Usage in Frontend Components

```typescript
// Example: Fetch Italian banks
const response = await fetch("/api/gocardless/institutions/italian-banks", {
  headers: {
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  },
});

// Example: Start bank connection
const response = await fetch("/api/gocardless/flow/start", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  },
  body: JSON.stringify({
    institutionId: "BANK_ID",
    redirectUrl: `${window.location.origin}/gocardless/callback`,
    reference: `user-connection-${Date.now()}`,
  }),
});
```

## Security Considerations

1. **Server-Side Token Handling**: Tokens never exposed to client-side code
2. **Session Validation**: Every request validates the user session
3. **Origin Verification**: Requests are validated against the session
4. **Error Sanitization**: Backend errors are sanitized before forwarding

## Future Enhancements

1. **Request Caching**: Cache institution lists and account details
2. **Rate Limiting**: Implement rate limiting for API calls
3. **Request Logging**: Add comprehensive request/response logging
4. **Retry Logic**: Implement automatic retry for failed requests
5. **Webhook Handling**: Add webhook endpoints for real-time updates
