import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/backoffice/jackpots")({
  ssr: false,
  component: () => <Outlet />,
});
