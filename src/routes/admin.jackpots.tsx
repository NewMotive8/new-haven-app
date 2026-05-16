import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/jackpots")({
  ssr: false,
  component: () => <Outlet />,
});
