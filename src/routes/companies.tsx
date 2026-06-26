import { createFileRoute } from "@tanstack/react-router";
import { Building2 } from "lucide-react";
import { PlaceholderPage } from "@/components/placeholder-page";

export const Route = createFileRoute("/companies")({
  head: () => ({ meta: [{ title: "Companies — Attachment Admin" }] }),
  component: () => (
    <PlaceholderPage
      title="Company Management"
      description="Registry of host companies with verification, capacity and supervisor tracking."
      icon={Building2}
      features={[
        "Verified / Pending / Blacklisted status badges",
        "Capacity tracking with 'Full' badge when at limit",
        "Add Company modal — created as Pending until admin verifies",
        "Profile: stats, students hosted, supervisors, approval rate",
        "Actions: Verify, Blacklist (with reason), Edit, Deactivate",
      ]}
    />
  ),
});
