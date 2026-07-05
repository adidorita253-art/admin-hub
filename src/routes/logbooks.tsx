import { Outlet, createFileRoute, useMatches } from "@tanstack/react-router";
import { LogbooksIndexPage } from "./logbooks.index";

export const Route = createFileRoute("/logbooks")({
  component: LogbooksLayout,
});

function LogbooksLayout() {
  const hasChildMatch = useMatches({
    select: (matches) =>
      matches.some(
        (match) =>
          match.routeId === "/logbooks/" || match.routeId === "/logbooks/$id",
      ),
  });

  if (!hasChildMatch) {
    return <LogbooksIndexPage />;
  }

  return <Outlet />;
}