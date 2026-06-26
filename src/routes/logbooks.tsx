import { createFileRoute } from "@tanstack/react-router";
import { BookOpen } from "lucide-react";
import { PlaceholderPage } from "@/components/placeholder-page";

export const Route = createFileRoute("/logbooks")({
  head: () => ({ meta: [{ title: "Logbooks — Attachment Admin" }] }),
  component: () => (
    <PlaceholderPage
      title="Logbooks"
      description="Student weekly logbook submissions and supervisor reviews."
      icon={BookOpen}
      features={[
        "Per-student weekly entry tracking",
        "Completion progress bars and 14-day inactivity alerts",
        "Academic supervisor review queue with avg review time",
        "Filter by student, supervisor, company, status",
        "Mark as Complete with full audit trail",
      ]}
    />
  ),
});
