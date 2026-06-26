import { createFileRoute } from "@tanstack/react-router";
import { FileText } from "lucide-react";
import { PlaceholderPage } from "@/components/placeholder-page";

export const Route = createFileRoute("/applications")({
  head: () => ({ meta: [{ title: "Applications — Attachment Admin" }] }),
  component: () => (
    <PlaceholderPage
      title="Applications"
      description="End-to-end pipeline from application to approved placement."
      icon={FileText}
      features={[
        "Pipeline stages: Applied → Letter Generated → Sent → Viewed → Awaiting → Approved/Rejected",
        "Filters: status, stage, department, date range, academic year/semester",
        "Approval status: Pending / Approved / Rejected / Expired",
        "Detail page with timeline, letter, company response and reassignment",
        "Approvals managed here — no separate Approvals menu",
      ]}
    />
  ),
});
