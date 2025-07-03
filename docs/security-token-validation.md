# 🔐 Sistema di Validazione Token Robusta

## Panoramica

Il sistema di validazione token implementa controlli di sicurezza avanzati per tutte le API routes di Coffee Budget, sostituendo la validazione base con controlli robusti contro:

- Token malformati o scaduti
- Bypass di autenticazione
- Privilege escalation
- Information disclosure

## Funzionalità Principali

### ✅ Validazioni Implementate

1. **Struttura JWT**: Verifica formato e encoding base64url
2. **Payload Validation**: Controlla campi obbligatori (sub, iat, exp)
3. **Scadenza Token**: Verifica automatica dell'expiration time
4. **Audience Validation**: Controlla audience Auth0 corretta
5. **Scope Verification**: Verifica permessi specifici per operazione
6. **Session Integrity**: Controlla integrità della sessione NextAuth

### 🛡️ Protezioni di Sicurezza

- **Rate Limiting**: Prevenzione attacchi brute force
- **Error Sanitization**: Messaggi di errore sicuri
- **Logging Security**: Log strutturati per monitoring
- **Type Safety**: Validazione TypeScript completa

## Utilizzo

### Metodo 1: Validazione Manuale

```typescript
import { validateAuthSession, createAuthErrorResponse } from "@/lib/auth-validation";

export async function GET() {
  const validation = await validateAuthSession({
    requireEmail: true,
    requireUserId: true,
    logErrors: true,
    customScopes: ['read:transactions']
  });

  if (!validation.success || !validation.session) {
    return createAuthErrorResponse(validation.error!, validation.message);
  }

  const { accessToken } = validation.session.user;
  // ... resto della logica
}
```

### Metodo 2: Decorator withAuth (Consigliato)

```typescript
import { withAuth, ValidatedSession } from "@/lib/auth-validation";

export const GET = withAuth(
  async (validatedSession: ValidatedSession) => {
    const { accessToken } = validatedSession.user;
    // ... logica API
  },
  {
    requireEmail: true,
    requireUserId: true,
    logErrors: true,
    customScopes: ['read:transactions']
  }
);
```

## Configurazione

### ValidationConfig Options

```typescript
interface ValidationConfig {
  requireEmail?: boolean;      // Default: true
  requireUserId?: boolean;     // Default: true
  logErrors?: boolean;         // Default: false
  customScopes?: string[];     // Default: []
}
```

### Scope Disponibili

- `read:transactions` - Lettura transazioni
- `write:transactions` - Scrittura transazioni
- `delete:transactions` - Cancellazione transazioni
- `read:categories` - Lettura categorie
- `write:categories` - Scrittura categorie

## Gestione Errori

### Tipi di Errore

```typescript
enum AuthValidationError {
  NO_SESSION = 'NO_SESSION',                    // 401
  INVALID_TOKEN = 'INVALID_TOKEN',              // 401
  EXPIRED_TOKEN = 'EXPIRED_TOKEN',              // 401
  MALFORMED_TOKEN = 'MALFORMED_TOKEN',          // 400
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS' // 403
}
```

### Risposta Errore Standardizzata

```json
{
  "error": "Authentication token expired",
  "code": "EXPIRED_TOKEN"
}
```

## Migrazione API Routes

### Prima (Vulnerabile)

```typescript
export async function GET() {
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  // ... resto del codice
}
```

### Dopo (Sicura)

```typescript
export const GET = withAuth(
  async (validatedSession: ValidatedSession) => {
    const { accessToken } = validatedSession.user;
    // ... resto del codice
  },
  { customScopes: ['read:transactions'] }
);
```

## Monitoring e Logging

### Log di Sicurezza

```typescript
// Abilita logging per monitoring
const validation = await validateAuthSession({
  logErrors: true  // Abilita log strutturati
});
```

### Esempi di Log

```
🔒 Auth validation failed: No session found
🔒 Auth validation failed: Malformed JWT
🔒 Auth validation failed: Insufficient permissions
```

## Best Practices

1. **Usa sempre withAuth** per nuove API routes
2. **Specifica scope minimi** necessari per l'operazione
3. **Abilita logging** in produzione per monitoring
4. **Testa token scaduti** nei test automatici
5. **Monitora errori 401/403** per possibili attacchi

## Testing

### Test di Sicurezza

```typescript
// Test token malformato
const malformedToken = "invalid.jwt.token";

// Test token scaduto
const expiredToken = "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9...";

// Test scope insufficienti
const limitedScopeToken = "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9...";
```

## Compatibilità

- ✅ NextAuth.js 4.x
- ✅ Auth0 Provider
- ✅ Next.js 13+ App Router
- ✅ TypeScript 5.x

## Changelog

### v1.0.0 (2024-07-01)
- ✅ Implementazione validazione robusta
- ✅ Sistema di scope granulari
- ✅ Decorator withAuth
- ✅ Error handling standardizzato
- ✅ Logging di sicurezza 