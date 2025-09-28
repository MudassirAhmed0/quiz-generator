// client/src/components/ui/toaster.tsx
import * as React from "react";
import { ToastProvider } from "./toast";
import { ToastProviderLocal } from "./use-toast.tsx";
import { ToastViewport } from "./toast";

export function Toaster() {
  return (
    <ToastProvider>
      <ToastProviderLocal>
        <ToastViewport />
      </ToastProviderLocal>
    </ToastProvider>
  );
}
