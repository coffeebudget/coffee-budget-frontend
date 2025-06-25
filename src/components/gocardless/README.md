# GoCardless Integration - Popup Communication

## Overview

This implementation provides a seamless popup-based bank authorization flow for GoCardless integration, replacing the previous tab-based approach with proper window communication.

## Key Features

### 1. Proper Popup Management

- **Centered popup window** with optimal dimensions (600x700px)
- **Automatic popup detection** and status monitoring
- **Popup blocking detection** with user-friendly error messages
- **Automatic cleanup** of popup references and intervals

### 2. Window Communication

- **PostMessage API** for secure parent-child window communication
- **Origin verification** for security
- **Structured message types**: SUCCESS, ERROR, CANCELLED
- **Automatic popup closure** after successful authorization

### 3. Enhanced User Experience

- **Real-time status indicator** showing popup state
- **Loading states** during authorization process
- **Automatic data refresh** after successful connection
- **Manual popup closure** option with close button
- **Toast notifications** for all states

### 4. Error Handling

- **Comprehensive error states** with specific messages
- **Graceful fallback** for popup blocking
- **Timeout handling** for abandoned popups
- **Network error recovery**

## Implementation Details

### Main Component (`GocardlessIntegration.tsx`)

#### State Management

```typescript
const [isPopupOpen, setIsPopupOpen] = useState(false);
const [popupProcessing, setPopupProcessing] = useState(false);
const popupRef = useRef<Window | null>(null);
const popupCheckInterval = useRef<NodeJS.Timeout | null>(null);
```

#### Message Handling

```typescript
interface PopupMessage {
  type: "GOCARDLESS_SUCCESS" | "GOCARDLESS_ERROR" | "GOCARDLESS_CANCELLED";
  data?: {
    requisitionId?: string;
    error?: string;
  };
}
```

#### Popup Lifecycle

1. **Open**: `openAuthorizationPopup()` - Creates centered popup with monitoring
2. **Monitor**: Interval checks for popup closure
3. **Communicate**: PostMessage for success/error states
4. **Close**: Automatic cleanup and data refresh

### Callback Page (`callback/page.tsx`)

#### Popup Detection

```typescript
const [isPopup, setIsPopup] = useState(false);

useEffect(() => {
  setIsPopup(window.opener !== null);
}, []);
```

#### Parent Communication

```typescript
const sendMessageToParent = (
  type: PopupMessage["type"],
  data?: PopupMessage["data"]
) => {
  if (window.opener) {
    const message: PopupMessage = { type, data };
    window.opener.postMessage(message, window.location.origin);
  }
};
```

#### Automatic Closure

- **Success**: 2-second delay then auto-close
- **Error**: Manual close button
- **Different UI** for popup vs. regular page mode

## Usage Flow

1. **User clicks "Connect Bank"** → Dialog opens with bank selection
2. **User selects bank** → `startBankConnection()` called
3. **Popup opens** → Centered authorization window
4. **Status indicator** → Shows "Complete authorization in popup"
5. **User authorizes** → Bank redirects to callback page
6. **Callback processes** → Sends success message to parent
7. **Parent receives message** → Refreshes data, closes popup
8. **User sees updated accounts** → Seamless experience

## Security Considerations

- **Origin verification** in message listener
- **Popup reference management** to prevent memory leaks
- **Secure token handling** in localStorage
- **HTTPS enforcement** for production

## Browser Compatibility

- **Modern browsers** with PostMessage API support
- **Popup blocking** gracefully handled
- **Mobile responsive** popup dimensions
- **Cross-origin** communication support

## Future Enhancements

1. **Account association wizard** after successful connection
2. **Batch account creation** with user confirmation
3. **Connection status persistence** across page refreshes
4. **Advanced error recovery** with retry mechanisms
5. **Analytics tracking** for conversion optimization
