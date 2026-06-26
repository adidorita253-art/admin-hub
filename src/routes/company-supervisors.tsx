import { createFileRoute } from "@tanstack/react-router";
import { UserCheck } from "lucide-react";
import { PlaceholderPage } from "@/components/placeholder-page";

export const Route = createFileRoute("/company-supervisors")({
  head: () => ({ meta: [{ title: "Company Supervisors — Attachment Admin" }] }),
  component: () => (
    <PlaceholderPage
      title="Company Supervisors"
      description="Oversight of supervisors created via the company QR/OTP approval flow."
      icon={UserCheck}
      features={[
        "List with name, email, company, students assigned",
        "Per-row: View Profile, Reset Password, Deactivate, Transfer Students",
        "Transfer flow moves all students to another supervisor at the same company",
      ]}
    />
  ),
});
