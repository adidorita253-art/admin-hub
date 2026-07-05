import { Outlet, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/logbooks")({
  component: LogbooksLayout,
});

function LogbooksLayout() {
  return <Outlet />;
}