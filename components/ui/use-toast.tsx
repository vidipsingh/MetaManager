import { Toast, ToastProvider, ToastViewport } from "@/components/ui/toast";
import { useState } from "react";

export const useToast = () => {
  const [toasts, setToasts] = useState<any[]>([]);

  const addToast = (toast: any) => {
    setToasts((prev) => [...prev, toast]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  return {
    addToast,
    removeToast,
    ToastProvider,
    ToastViewport,
    toasts, // You can map through toasts in your component
  };
};
