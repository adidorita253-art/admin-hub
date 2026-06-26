import { createFileRoute } from "@tanstack/react-router";
import { GraduationCap } from "lucide-react";
import { PlaceholderPage } from "@/components/placeholder-page";

export const Route = createFileRoute("/students")({
  head: () => ({ meta: [{ title: "Students — Attachment Admin" }] }),
  component: () => (
    <PlaceholderPage
      title="Students"
      description="Manage student records, placements and supervisor assignments."
      icon={GraduationCap}
      features={[
        "Live-search list with department, status and supervisor filters",
        "Add Student modal with passport photo upload",
        "Import Students via Excel with validation preview",
        "Per-row actions: View, Edit, Assign Supervisor, Reset Password, Deactivate",
        "Bulk: Assign supervisor / Deactivate / Export to Excel",
        "Full profile with Application, Letters, Logbook and Notes tabs",
      ]}
    />
  ),
});
