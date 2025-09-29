// client/src/components/ui/toaster.tsx
import { ToastProvider, ToastViewport } from "./toast";
import { ToastProviderLocal } from "./use-toast.tsx";

export function Toaster() {
  return (
    <ToastProvider>
      <ToastProviderLocal>
        <ToastViewport />
      </ToastProviderLocal>
    </ToastProvider>
  );
}
