'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Download, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { exportAccountData } from '@/lib/api/users';
import DeleteAccountDialog from './components/DeleteAccountDialog';

export default function SettingsPage() {
  const { data: session } = useSession();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    if (!session?.user?.accessToken) return;
    setIsExporting(true);
    try {
      const blob = await exportAccountData(session.user.accessToken as string);
      const url = URL.createObjectURL(blob);
      const date = new Date().toISOString().split('T')[0];
      const a = document.createElement('a');
      a.href = url;
      a.download = `coffeebudget-export-${date}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Data exported successfully');
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to export data',
      );
    } finally {
      setIsExporting(false);
    }
  };

  if (!session) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Please log in to view settings.</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Account Settings</h1>

      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">Account Information</h2>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div>
              <span className="text-sm text-muted-foreground">Email</span>
              <p className="font-medium">{session.user?.email}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Export Data */}
      <div className="rounded-lg border bg-card p-6 mb-6">
        <h2 className="text-lg font-semibold mb-2">Export Data</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Download a copy of all your data in JSON format. This includes
          your transactions, categories, expense plans, and all other
          account data.
        </p>
        <Button
          variant="outline"
          onClick={handleExport}
          disabled={isExporting}
        >
          {isExporting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Exporting...
            </>
          ) : (
            <>
              <Download className="mr-2 h-4 w-4" />
              Download my data
            </>
          )}
        </Button>
      </div>

      <Card className="border-destructive/50 bg-destructive/5">
        <CardHeader>
          <h2 className="text-lg font-semibold text-destructive">
            Danger Zone
          </h2>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Delete Account</p>
              <p className="text-sm text-muted-foreground">
                Permanently delete your account and all associated data.
              </p>
            </div>
            <Button
              variant="destructive"
              onClick={() => setDeleteDialogOpen(true)}
            >
              Delete my account
            </Button>
          </div>
        </CardContent>
      </Card>

      <DeleteAccountDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
      />
    </div>
  );
}
