import { createFileRoute } from "@tanstack/react-router";
import { LogbooksIndexPage } from "@/components/logbooks-index-page";

export const Route = createFileRoute("/logbooks/")({
  head: () => ({ meta: [{ title: "Logbooks — Attachment Admin" }] }),
  component: LogbooksIndexPage,
});