// Minimal next/router shim backed by TanStack Router.
import { useNavigate, useLocation, useRouter as useTanRouter } from "@tanstack/react-router";
import { useMemo } from "react";

export interface NextRouterShim {
  pathname: string;
  route: string;
  asPath: string;
  query: Record<string, string | string[] | undefined>;
  isReady: boolean;
  locale?: string;
  push: (url: string) => Promise<boolean>;
  replace: (url: string) => Promise<boolean>;
  back: () => void;
  reload: () => void;
  prefetch: () => Promise<void>;
  beforePopState: () => void;
  events: {
    on: () => void;
    off: () => void;
    emit: () => void;
  };
}

function parseQuery(search: string): Record<string, string> {
  const out: Record<string, string> = {};
  const sp = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  sp.forEach((v, k) => {
    out[k] = v;
  });
  return out;
}

export function useRouter(): NextRouterShim {
  const navigate = useNavigate();
  const location = useLocation();
  const router = useTanRouter();

  return useMemo<NextRouterShim>(
    () => ({
      pathname: location.pathname,
      route: location.pathname,
      asPath: location.href ?? location.pathname,
      query: parseQuery(location.searchStr ?? ""),
      isReady: true,
      locale: "en-GB",
      push: async (url: string) => {
        await navigate({ to: url as any });
        return true;
      },
      replace: async (url: string) => {
        await navigate({ to: url as any, replace: true });
        return true;
      },
      back: () => router.history.back(),
      reload: () => {
        if (typeof window !== "undefined") window.location.reload();
      },
      prefetch: async () => {},
      beforePopState: () => {},
      events: { on: () => {}, off: () => {}, emit: () => {} },
    }),
    [navigate, location.pathname, location.href, location.searchStr, router]
  );
}

export default { useRouter };
