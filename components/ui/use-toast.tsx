import { ToastProvider, ToastViewport } from "@/components/ui/toast";
import { useState } from "react";

export const useToast = () => {
  interface Toast {
    id: string;
    message: string;
  }

  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = (toast: Toast) => {
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
    toasts,
  };
};
