"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

/**
 * Client providers.
 *
 * The QueryClient is created inside `useState` rather than at module scope.
 * At module scope it would be a singleton shared across every request the
 * server handles, which on a server-rendered page means one visitor's cached
 * investor data can be served to the next — a cache bug that is also a data
 * leak. Per-render construction makes that impossible.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // The portal's data is small and cheap; the cost of a stale cap
            // table or a revoked-code list that still reads "active" is not.
            staleTime: 30_000,
            gcTime: 5 * 60_000,
            retry: 1,
            refetchOnWindowFocus: false,
          },
          mutations: {
            // Redeeming a code and generating a code are both non-idempotent.
            // A silent retry would burn a single-use invite or mint a second
            // code nobody asked for.
            retry: 0,
          },
        },
      }),
  );

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
