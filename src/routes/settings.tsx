import { createFileRoute } from "@tanstack/react-router";
import { Settings } from "lucide-react";
import { PlaceholderPage } from "@/components/placeholder-page";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "System Settings — Attachment Admin" }] }),
  component: () => (
    <PlaceholderPage
      title="System Settings"
      description="Institution-wide configuration."
      icon={Settings}
      features={[
        "Departments, Programs, Regions, Industries",
        "Academic Years and Semesters",
        "Letter templates and reference number format",
        "Notification channels and SMTP / SMS providers",
        "Branding: institution name, logo, colours",
      ]}
    />
  ),
});
