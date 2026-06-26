import { createFileRoute } from "@tanstack/react-router";
import { ScrollText } from "lucide-react";
import { PlaceholderPage } from "@/components/placeholder-page";

export const Route = createFileRoute("/audit-logs")({
  head: () => ({ meta: [{ title: "Audit Logs — Attachment Admin" }] }),
  component: () => (
    <PlaceholderPage
      title="Audit Logs"
      description="Immutable record of every admin and system action."
      icon={ScrollText}
      features={[
        "Actor, action, target and timestamp on every entry",
        "Filter by user, module, date range and action type",
        "Tamper-evident — no edits, no deletes",
        "Exportable for compliance reviews",
      ]}
    />
  ),
});
