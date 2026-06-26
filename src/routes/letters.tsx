import { createFileRoute } from "@tanstack/react-router";
import { Mail } from "lucide-react";
import { PlaceholderPage } from "@/components/placeholder-page";

export const Route = createFileRoute("/letters")({
  head: () => ({ meta: [{ title: "Letters — Attachment Admin" }] }),
  component: () => (
    <PlaceholderPage
      title="Letters"
      description="Generate, send and track introduction and confirmation letters."
      icon={Mail}
      features={[
        "Auto-generated reference numbers per institution policy",
        "Single and bulk letter generation",
        "Template management with merge fields",
        "Status tracking: Draft / Generated / Sent / Delivered / Viewed",
        "Per-letter audit trail and downloadable PDF",
      ]}
    />
  ),
});
