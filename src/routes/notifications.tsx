import { createFileRoute } from "@tanstack/react-router";
import { Bell } from "lucide-react";
import { PlaceholderPage } from "@/components/placeholder-page";

export const Route = createFileRoute("/notifications")({
  head: () => ({ meta: [{ title: "Notifications — Attachment Admin" }] }),
  component: () => (
    <PlaceholderPage
      title="Notifications"
      description="System-generated and admin-composed notifications across email, SMS and in-app."
      icon={Bell}
      features={[
        "Templates for automated events (placement, letter, reminder)",
        "Compose targeted broadcasts to students / supervisors / companies",
        "Delivery log with status per recipient",
        "Channel preferences per audience",
      ]}
    />
  ),
});
