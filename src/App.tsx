import { QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "react-router-dom";
import { queryClient } from "./app/query-client";
import { AuthProvider } from "./app/auth-context";
import { router } from "./app/router";
import { PwaInstallBanner } from "./app/pwa-install-banner";

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RouterProvider router={router} />
        <PwaInstallBanner />
      </AuthProvider>
    </QueryClientProvider>
  );
}
