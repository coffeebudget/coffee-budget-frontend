/**
 * GoCardless Connection Types for Coffee Budget Frontend
 * Mirrors backend GocardlessConnection entity and DTOs
 */

// ============================================================================
// ENUMS & CONSTANTS
// ============================================================================

export const GOCARDLESS_CONNECTION_STATUSES = {
  ACTIVE: 'active',
  EXPIRING_SOON: 'expiring_soon',
  EXPIRED: 'expired',
  DISCONNECTED: 'disconnected',
  ERROR: 'error',
} as const;

export type GocardlessConnectionStatus = typeof GOCARDLESS_CONNECTION_STATUSES[keyof typeof GOCARDLESS_CONNECTION_STATUSES];

// ============================================================================
// CONNECTION INTERFACES
// ============================================================================

export interface GocardlessConnection {
  id: number;
  userId: number;
  requisitionId: string;
  euaId: string | null;
  institutionId: string;
  institutionName: string | null;
  institutionLogo: string | null;
  status: GocardlessConnectionStatus;
  connectedAt: string;
  expiresAt: string;
  accessValidForDays: number;
  lastSyncAt: string | null;
  lastSyncError: string | null;
  linkedAccountIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ConnectionAlert {
  connectionId: number;
  institutionName: string;
  institutionLogo: string | null;
  status: 'expiring_soon' | 'expired';
  expiresAt: string;
  daysUntilExpiration: number;
  linkedAccountIds: string[];
}

export interface ConnectionStatusSummary {
  totalConnections: number;
  activeConnections: number;
  expiringSoonConnections: number;
  expiredConnections: number;
  errorConnections: number;
  alerts: ConnectionAlert[];
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get a human-readable status label
 */
export function getStatusLabel(status: GocardlessConnectionStatus): string {
  switch (status) {
    case 'active':
      return 'Active';
    case 'expiring_soon':
      return 'Expiring Soon';
    case 'expired':
      return 'Expired';
    case 'disconnected':
      return 'Disconnected';
    case 'error':
      return 'Error';
    default:
      return 'Unknown';
  }
}

/**
 * Get status color for badges
 */
export function getStatusColor(status: GocardlessConnectionStatus): 'green' | 'yellow' | 'red' | 'gray' {
  switch (status) {
    case 'active':
      return 'green';
    case 'expiring_soon':
      return 'yellow';
    case 'expired':
    case 'error':
      return 'red';
    case 'disconnected':
      return 'gray';
    default:
      return 'gray';
  }
}

/**
 * Format days until expiration for display
 */
export function formatExpirationMessage(daysUntilExpiration: number): string {
  if (daysUntilExpiration < 0) {
    const daysAgo = Math.abs(daysUntilExpiration);
    return `Expired ${daysAgo} day${daysAgo === 1 ? '' : 's'} ago`;
  } else if (daysUntilExpiration === 0) {
    return 'Expires today';
  } else if (daysUntilExpiration === 1) {
    return 'Expires tomorrow';
  } else {
    return `Expires in ${daysUntilExpiration} days`;
  }
}
