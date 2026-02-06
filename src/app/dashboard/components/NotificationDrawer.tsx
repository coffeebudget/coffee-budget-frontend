'use client';

import { CheckCircle, RefreshCw } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import NotificationCard from './NotificationCard';
import type { Notification } from '../hooks/useNotifications';

interface NotificationDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  notifications: Notification[];
  isLoading: boolean;
  onDismiss: (id: string) => void;
  onRefresh: () => void;
}

export default function NotificationDrawer({
  open,
  onOpenChange,
  notifications,
  isLoading,
  onDismiss,
  onRefresh,
}: NotificationDrawerProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex flex-col">
        <SheetHeader>
          <SheetTitle>Notifications</SheetTitle>
          <SheetDescription>Alerts and suggestions</SheetDescription>
        </SheetHeader>

        {isLoading ? (
          <div className="flex flex-1 items-center justify-center">
            <RefreshCw className="h-5 w-5 animate-spin text-blue-600 mr-2" />
            <span className="text-gray-600">Caricamento...</span>
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center text-center px-4">
            <CheckCircle className="h-12 w-12 text-green-500 mb-3" />
            <p className="text-lg font-medium text-green-700">
              Tutto sotto controllo!
            </p>
            <p className="text-sm text-green-600 mt-1">
              Nessun alert attivo.
            </p>
          </div>
        ) : (
          <ScrollArea className="flex-1 mt-4">
            <div className="space-y-3 pr-2">
              {notifications.map((n) => (
                <NotificationCard
                  key={n.id}
                  notification={n}
                  onDismiss={onDismiss}
                />
              ))}
            </div>
          </ScrollArea>
        )}

        {notifications.length > 0 && (
          <div className="border-t pt-3 mt-auto">
            <Button variant="ghost" size="sm" onClick={onRefresh}>
              <RefreshCw className="h-4 w-4 mr-1" />
              Refresh
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
