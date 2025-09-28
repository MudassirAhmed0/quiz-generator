// client/src/main.tsx
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "./components/ui/toaster";
import { Toast } from "@radix-ui/react-toast";
import { ToastProviderLocal } from "./components/ui/use-toast";

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <ToastProviderLocal>
      <App />
      <Toaster />
      </ToastProviderLocal>
    </QueryClientProvider>
  </React.StrictMode>
);
