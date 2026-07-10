import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Status, AttachmentStatus } from "@/lib/mock-data";
import { attachmentLabel } from "@/lib/mock-data";

export function StatusPill({ status }: { status: Status }) {
  const map: Record<Status, string> = {
    active:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300 border-emerald-200/60",
    inactive:
      "bg-muted text-muted-foreground border-border",
    pending:
      "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300 border-amber-200/60",
  };
  const label: Record<Status, string> = {
    active: "Active",
    inactive: "Inactive",
    pending: "Pending Setup",
  };
  return (
    <Badge variant="outline" className={cn("font-medium", map[status])}>
      {label[status]}
    </Badge>
  );
}

export function AttachmentPill({ status }: { status: AttachmentStatus }) {
  const map: Record<AttachmentStatus, string> = {
    not_placed: "bg-muted text-muted-foreground border-border",
    applied:
      "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300 border-sky-200/60",
    placed:
      "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300 border-indigo-200/60",
    ongoing:
      "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300 border-amber-200/60",
    completed:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300 border-emerald-200/60",
  };
  return (
    <Badge variant="outline" className={cn("font-medium", map[status])}>
      {attachmentLabel[status]}
    </Badge>
  );
}
