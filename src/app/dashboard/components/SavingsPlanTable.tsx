import { cn } from "@/lib/utils"; // se usi clsx puoi sostituire con clsx()

type SavingsItem = {
  categoryName: string;
  total: number;
  monthly: number;
};

export default function SavingsPlanTable({ data }: { data: SavingsItem[] }) {
  if (!data || data.length === 0) {
    return <p className="text-sm text-muted-foreground">No savings plan available.</p>;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
      {data.map((item) => {
        const isHigh = item.total > 1000;

        return (
          <div
            key={item.categoryName}
            className={cn(
              "rounded-lg border shadow-sm p-3 text-sm flex flex-col gap-1",
              isHigh ? "bg-red-50 border-red-300" : "bg-muted"
            )}
          >
            <h3 className="font-medium text-muted-foreground truncate">{item.categoryName}</h3>

            <div className="text-xs text-gray-500">Annual Total</div>
            <div className={cn("font-semibold", isHigh ? "text-red-600" : "text-gray-800")}>
              €{item.total.toFixed(2)}
            </div>

            <div className="text-xs text-gray-500">Monthly Saving</div>
            <div className="font-bold text-green-600">€{item.monthly.toFixed(2)}</div>
          </div>
        );
      })}
    </div>
  );
}
