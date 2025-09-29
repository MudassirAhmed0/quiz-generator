// client/src/main.tsx
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { ToastProvider } from "./components/ui/toast";
import { Toaster } from "./components/ui/toaster";
import { ToastProviderLocal } from "./components/ui/use-toast";
import "./index.css";

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <ToastProviderLocal>
          <App />
          <Toaster />
        </ToastProviderLocal>
      </ToastProvider>
    </QueryClientProvider>
  </React.StrictMode>
);
