import { toast } from "@/hooks/use-toast";

/**
 * Shows a success toast notification
 * @param message The success message to show
 */
export const showSuccessToast = (message: string) => {
  toast({
    title: "Success",
    description: message,
    variant: "default",
    className: "bg-green-50 border-green-200 text-green-800",
  });
};

/**
 * Shows an error toast notification
 * @param message The error message to show
 */
export const showErrorToast = (message: string) => {
  toast({
    title: "Error",
    description: message,
    variant: "destructive",
  });
}; 