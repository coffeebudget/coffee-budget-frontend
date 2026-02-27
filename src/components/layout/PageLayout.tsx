import { type LucideIcon } from "lucide-react";

interface PageLayoutProps {
  title: string;
  description?: string;
  icon: LucideIcon;
  actions?: React.ReactNode;
  children: React.ReactNode;
}

export default function PageLayout({
  title,
  description,
  icon: Icon,
  actions,
  children,
}: PageLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-7xl mx-auto mb-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Icon className="h-8 w-8 text-primary" />
              <h1 className="text-3xl font-bold text-gray-800">{title}</h1>
            </div>
            {description && (
              <p className="text-gray-600 max-w-3xl">{description}</p>
            )}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      </div>
      <div className="max-w-7xl mx-auto">{children}</div>
    </div>
  );
}
