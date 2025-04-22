import { toast } from "@/hooks/use-toast";

export const showSuccessToast = (message: string) => {
  toast({
    title: "Success",
    description: message,
    variant: "default",
    duration: 3000,
  });
};

export const showErrorToast = (message: string) => {
  toast({
    title: "Error",
    description: message,
    variant: "destructive",
    duration: 5000,
  });
}; 