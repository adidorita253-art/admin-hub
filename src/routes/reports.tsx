import { createFileRoute } from "@tanstack/react-router";
import { BarChart3 } from "lucide-react";
import { PlaceholderPage } from "@/components/placeholder-page";

export const Route = createFileRoute("/reports")({
  head: () => ({ meta: [{ title: "Reports & Analytics — Attachment Admin" }] }),
  component: () => (
    <PlaceholderPage
      title="Reports & Analytics"
      description="Deep analytics with export to Excel and PDF."
      icon={BarChart3}
      features={[
        "Department placement rate with multi-semester comparison",
        "Company performance: approval rate, retention, capacity utilisation",
        "Supervisor workload and review-time benchmarks",
        "Custom date ranges, academic years and semesters",
        "Export everything to Excel or PDF",
      ]}
    />
  ),
});
