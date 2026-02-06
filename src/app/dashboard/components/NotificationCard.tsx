'use client';

import Link from 'next/link';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Notification } from '../hooks/useNotifications';

interface NotificationCardProps {
  notification: Notification;
  onDismiss: (id: string) => void;
}

const severityStyles: Record<string, string> = {
  high: 'border-l-red-500 bg-red-50',
  medium: 'border-l-yellow-500 bg-yellow-50',
  low: 'border-l-blue-500 bg-blue-50',
};

export default function NotificationCard({
  notification,
  onDismiss,
}: NotificationCardProps) {
  const { id, severity, title, message, icon: Icon, iconColor, action, secondaryAction, source } = notification;
  const showDismiss = source !== 'link'; // link suggestions use backend mutations

  return (
    <div
      className={cn(
        'rounded-lg border-l-4 p-3',
        severityStyles[severity] ?? 'border-l-gray-500 bg-gray-50'
      )}
    >
      {/* Header row: icon + title + dismiss */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2 min-w-0">
          <Icon className={cn('h-5 w-5 shrink-0 mt-0.5', iconColor)} />
          <span className="font-medium text-gray-900 text-sm leading-snug">
            {title}
          </span>
        </div>
        {showDismiss && (
          <button
            onClick={() => onDismiss(id)}
            className="text-gray-400 hover:text-gray-600 shrink-0"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Message */}
      <p className="mt-1 ml-7 text-sm text-gray-600">{message}</p>

      {/* Actions */}
      {(action || secondaryAction) && (
        <div className="mt-2 ml-7 flex items-center gap-2 flex-wrap">
          {action &&
            (action.href ? (
              <Button variant="outline" size="sm" asChild>
                <Link href={action.href}>{action.label}</Link>
              </Button>
            ) : (
              <Button variant="outline" size="sm" onClick={action.onClick}>
                {action.label}
              </Button>
            ))}
          {secondaryAction && (
            <Button
              variant="ghost"
              size="sm"
              className="text-red-600 hover:text-red-800 hover:bg-red-50"
              onClick={secondaryAction.onClick}
            >
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
