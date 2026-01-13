'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  AlertTriangle,
  RefreshCw,
  X,
  Link as LinkIcon,
  Clock,
  CheckCircle,
  Building2,
} from 'lucide-react';
import {
  ConnectionStatusSummary,
  ConnectionAlert,
  formatExpirationMessage,
} from '@/types/gocardless-types';

interface BankConnectionAlertsProps {
  className?: string;
  onReconnect?: (connectionId: number) => void;
}

export default function BankConnectionAlerts({
  className = '',
  onReconnect,
}: BankConnectionAlertsProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [status, setStatus] = useState<ConnectionStatusSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (!session?.user?.accessToken) return;
    loadConnectionStatus();
  }, [session]);

  const loadConnectionStatus = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/gocardless/connection-status');

      if (!response.ok) {
        throw new Error('Failed to fetch connection status');
      }

      const data: ConnectionStatusSummary = await response.json();
      setStatus(data);
    } catch (err) {
      console.error('Error loading connection status:', err);
      setError('Failed to load bank connection status');
    } finally {
      setLoading(false);
    }
  };

  const dismissAlert = (connectionId: number) => {
    setDismissedAlerts((prev) => new Set([...prev, connectionId]));
  };

  const handleReconnect = (alert: ConnectionAlert) => {
    if (onReconnect) {
      onReconnect(alert.connectionId);
    } else {
      // Navigate to bank accounts page with reconnect action
      router.push(`/bank-accounts?reconnect=${alert.connectionId}`);
    }
  };

  const getAlertIcon = (alertStatus: 'expiring_soon' | 'expired') => {
    if (alertStatus === 'expired') {
      return <AlertTriangle className="w-5 h-5 text-red-500" />;
    }
    return <Clock className="w-5 h-5 text-yellow-500" />;
  };

  const getAlertColor = (alertStatus: 'expiring_soon' | 'expired') => {
    if (alertStatus === 'expired') {
      return 'border-red-200 bg-red-50';
    }
    return 'border-yellow-200 bg-yellow-50';
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-xl shadow-lg border p-4 ${className}`}>
        <div className="flex items-center justify-center">
          <RefreshCw className="w-5 h-5 animate-spin text-blue-600 mr-2" />
          <span className="text-gray-600">Checking bank connections...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-red-50 border border-red-200 rounded-xl p-4 ${className}`}>
        <div className="flex items-center">
          <AlertTriangle className="w-5 h-5 text-red-500 mr-2" />
          <span className="text-red-700">{error}</span>
          <button
            onClick={loadConnectionStatus}
            className="ml-auto text-red-600 hover:text-red-800"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  // No connections or no alerts
  if (!status || status.alerts.length === 0) {
    // Only show if there are connections
    if (status && status.totalConnections > 0) {
      return (
        <div className={`bg-green-50 border border-green-200 rounded-xl p-4 ${className}`}>
          <div className="flex items-center">
            <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
            <span className="text-green-700 font-medium">Bank connections healthy</span>
            <span className="text-green-600 ml-2">
              {status.activeConnections} active connection{status.activeConnections !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      );
    }
    return null; // No connections at all, don't show anything
  }

  const visibleAlerts = status.alerts.filter(
    (alert) => !dismissedAlerts.has(alert.connectionId)
  );

  if (visibleAlerts.length === 0) {
    return null; // All alerts dismissed
  }

  return (
    <div className={`bg-white rounded-xl shadow-lg border ${className}`}>
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center">
          <Building2 className="w-6 h-6 text-blue-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">Bank Connection Alerts</h3>
          {status.expiredConnections > 0 && (
            <span className="ml-2 bg-red-100 text-red-800 text-xs font-medium px-2 py-1 rounded-full">
              {status.expiredConnections} expired
            </span>
          )}
          {status.expiringSoonConnections > 0 && (
            <span className="ml-2 bg-yellow-100 text-yellow-800 text-xs font-medium px-2 py-1 rounded-full">
              {status.expiringSoonConnections} expiring soon
            </span>
          )}
        </div>
        <button
          onClick={loadConnectionStatus}
          className="p-1 hover:bg-gray-100 rounded"
          title="Refresh status"
        >
          <RefreshCw className="w-4 h-4 text-gray-500" />
        </button>
      </div>

      <div className="p-4 space-y-3">
        {visibleAlerts.map((alert) => (
          <div
            key={alert.connectionId}
            className={`p-3 rounded-lg border ${getAlertColor(alert.status)}`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start flex-1">
                {getAlertIcon(alert.status)}
                <div className="ml-3 flex-1">
                  <div className="flex items-center">
                    {alert.institutionLogo && (
                      <img
                        src={alert.institutionLogo}
                        alt={alert.institutionName}
                        className="w-6 h-6 mr-2 rounded"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    )}
                    <span className="font-medium text-gray-900">
                      {alert.institutionName || 'Bank Connection'}
                    </span>
                    <span
                      className={`ml-2 text-xs px-2 py-1 rounded ${
                        alert.status === 'expired'
                          ? 'bg-red-200 text-red-800'
                          : 'bg-yellow-200 text-yellow-800'
                      }`}
                    >
                      {alert.status === 'expired' ? 'Expired' : 'Expiring Soon'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    {formatExpirationMessage(alert.daysUntilExpiration)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {alert.linkedAccountIds.length} linked account
                    {alert.linkedAccountIds.length !== 1 ? 's' : ''}
                  </p>
                  <button
                    onClick={() => handleReconnect(alert)}
                    className="mt-2 inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-800"
                  >
                    <LinkIcon className="w-4 h-4 mr-1" />
                    Reconnect Bank
                  </button>
                </div>
              </div>
              <button
                onClick={() => dismissAlert(alert.connectionId)}
                className="text-gray-400 hover:text-gray-600 ml-2"
                title="Dismiss alert"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
