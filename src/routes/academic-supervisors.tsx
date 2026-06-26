import { createFileRoute } from "@tanstack/react-router";
import { UserCheck } from "lucide-react";
import { PlaceholderPage } from "@/components/placeholder-page";

export const Route = createFileRoute("/academic-supervisors")({
  head: () => ({ meta: [{ title: "Academic Supervisors — Attachment Admin" }] }),
  component: () => (
    <PlaceholderPage
      title="Academic Supervisors"
      description="Manage faculty supervisors, their workload and student assignments."
      icon={UserCheck}
      features={[
        "List with name, department, students assigned, reviews pending",
        "Add Supervisor modal — auto sends welcome email with temp password",
        "Profile shows workload: assigned students, avg review time",
        "Assigned Students tab with reassignment flow",
        "Actions: Edit, Reset Password, Deactivate",
      ]}
    />
  ),
});
