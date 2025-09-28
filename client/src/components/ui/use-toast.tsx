// client/src/components/ui/use-toast.ts
import * as React from "react";
import { Toast, ToastTitle, ToastDescription } from "./toast";

type ToastMessage = {
  id: number;
  title?: string;
  description?: string;
  variant?: "default" | "destructive";
};

const ToastCtx = React.createContext<{
  toasts: ToastMessage[];
  push: (t: Omit<ToastMessage, "id">) => void;
  remove: (id: number) => void;
} | null>(null);

let id = 1;

export function ToastProviderLocal({
  children,
}: {
  children: React.ReactNode;
}) {
  const [toasts, setToasts] = React.useState<ToastMessage[]>([]);
  const push = (t: Omit<ToastMessage, "id">) => {
    const msg = { ...t, id: id++ };
    setToasts((prev) => [...prev, msg]);
    setTimeout(() => remove(msg.id), 3500);
  };
  const remove = (tid: number) =>
    setToasts((prev) => prev.filter((t) => t.id !== tid));
  return (
    <ToastCtx.Provider value={{ toasts, push, remove }}>
      {children}
      <div className="fixed top-2 right-2 z-50 flex w-96 flex-col gap-2">
        {toasts.map((t) => (
          <Toast
            key={t.id}
            className={t.variant === "destructive" ? "border-destructive" : ""}
          >
            {t.title && <ToastTitle>{t.title}</ToastTitle>}
            {t.description && (
              <ToastDescription>{t.description}</ToastDescription>
            )}
          </Toast>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

export function useToast() {
  const ctx = React.useContext(ToastCtx);
  if (!ctx) throw new Error("useToast must be used within ToastProviderLocal");
  return { toast: ctx.push };
}
