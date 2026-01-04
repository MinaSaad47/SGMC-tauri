import {
  MutationCache,
  QueryClient,
  QueryClientProvider,
  QueryKey,
} from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./global.css";
import "./lib/i18n";
import { BrowserRouter } from "react-router-dom";
import { toast } from "sonner";
import { Toaster } from "./components/ui/sonner";
import { error } from "@tauri-apps/plugin-log";

declare module "@tanstack/react-query" {
  interface Register {
    mutationMeta: {
      invalidatesQueries?: QueryKey[];
      successMessage?: string;
      errorMessage?: string;
    };
  }
}

export const queryClient = new QueryClient({
  mutationCache: new MutationCache({
    onSuccess(_data, _variables, _context, mutation) {
      if (mutation.meta?.successMessage) {
        toast.success(mutation.meta.successMessage);
      }
    },
    onError(e, _variables, _context, mutation) {
      error("Mutation error: " + e);

      if (mutation.meta?.errorMessage) {
        toast.error(mutation.meta.errorMessage, {
          description: e.message,
        });
      }
    },
    onSettled(_data, _error, _variables, _context, mutation) {
      for (const invalidateQuery of mutation.meta?.invalidatesQueries || []) {
        queryClient.invalidateQueries({
          queryKey: invalidateQuery,
        });
      }
    },
  }),
});

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <App />
      <Toaster />
    </BrowserRouter>
    <ReactQueryDevtools initialIsOpen={false} />
  </QueryClientProvider>,
);
