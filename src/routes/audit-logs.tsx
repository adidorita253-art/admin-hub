import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  ScrollText,
  Search,
  Download,
  Shield,
  AlertTriangle,
  Activity,
  Users,
  Eye,
  Filter,
  Copy,
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  auditLogs,
  AUDIT_MODULES,
  AUDIT_ACTIONS,
  ACTOR_ROLES,
  type AuditLog,
  type AuditSeverity,
} from "@/lib/audit-logs-data";

export const Route = createFileRoute("/audit-logs")({
  head: () => ({ meta: [{ title: "Audit Logs — Attachment Admin" }] }),
  component: AuditLogsPage,
});

const RANGE_OPTIONS = [
  { value: "1h", label: "Last hour", mins: 60 },
  { value: "24h", label: "Last 24 hours", mins: 60 * 24 },
  { value: "7d", label: "Last 7 days", mins: 60 * 24 * 7 },
  { value: "30d", label: "Last 30 days", mins: 60 * 24 * 30 },
  { value: "all", label: "All time", mins: Infinity },
];

function AuditLogsPage() {
  const [query, setQuery] = useState("");
  const [module, setModule] = useState<string>("all");
  const [action, setAction] = useState<string>("all");
  const [role, setRole] = useState<string>("all");
  const [severity, setSeverity] = useState<string>("all");
  const [range, setRange] = useState<string>("24h");
  const [viewing, setViewing] = useState<AuditLog | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const rangeMins =
      RANGE_OPTIONS.find((r) => r.value === range)?.mins ?? Infinity;
    const cutoff = Date.now() - rangeMins * 60_000;
    return auditLogs.filter((l) => {
      if (module !== "all" && l.module !== module) return false;
      if (action !== "all" && l.action !== action) return false;
      if (role !== "all" && l.actorRole !== role) return false;
      if (severity !== "all" && l.severity !== severity) return false;
      if (rangeMins !== Infinity && new Date(l.at).getTime() < cutoff)
        return false;
      if (!q) return true;
      return (
        l.actorName.toLowerCase().includes(q) ||
        l.actorEmail.toLowerCase().includes(q) ||
        l.target.toLowerCase().includes(q) ||
        l.description.toLowerCase().includes(q) ||
        l.ip.includes(q)
      );
    });
  }, [query, module, action, role, severity, range]);

  const stats = useMemo(() => {
    const last24 = Date.now() - 24 * 60 * 60_000;
    const recent = auditLogs.filter((l) => new Date(l.at).getTime() >= last24);
    return {
      total: auditLogs.length,
      today: recent.length,
      critical: auditLogs.filter((l) => l.severity === "critical").length,
      actors: new Set(auditLogs.map((l) => l.actorEmail)).size,
    };
  }, []);

  const resetFilters = () => {
    setQuery("");
    setModule("all");
    setAction("all");
    setRole("all");
    setSeverity("all");
    setRange("24h");
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Audit Logs"
        description="Immutable, tamper-evident record of every admin and system action."
        actions={
          <>
            <Button
              variant="outline"
              onClick={() => toast.success("Exported audit-logs.csv")}
            >
              <Download /> Export CSV
            </Button>
            <Button
              variant="outline"
              onClick={() => toast.success("Exported audit-logs.pdf")}
            >
              <Download /> Export PDF
            </Button>
          </>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Mini icon={ScrollText} label="Total Events" value={stats.total} />
        <Mini icon={Activity} label="Last 24h" value={stats.today} tone="indigo" />
        <Mini
          icon={AlertTriangle}
          label="Critical"
          value={stats.critical}
          tone="destructive"
        />
        <Mini icon={Users} label="Unique Actors" value={stats.actors} tone="amber" />
      </div>

      <Card>
        <CardContent className="flex flex-col gap-3 p-4">
          <div className="flex flex-col gap-3 lg:flex-row">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search actor, target, IP, description…"
                className="pl-8"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <Select value={range} onValueChange={setRange}>
              <SelectTrigger className="lg:w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {RANGE_OPTIONS.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={resetFilters}>
              <Filter /> Reset
            </Button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Select value={module} onValueChange={setModule}>
              <SelectTrigger>
                <SelectValue placeholder="Module" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All modules</SelectItem>
                {AUDIT_MODULES.map((m) => (
                  <SelectItem key={m.value} value={m.value}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={action} onValueChange={setAction}>
              <SelectTrigger>
                <SelectValue placeholder="Action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All actions</SelectItem>
                {AUDIT_ACTIONS.map((a) => (
                  <SelectItem key={a.value} value={a.value}>
                    {a.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger>
                <SelectValue placeholder="Actor role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All roles</SelectItem>
                {ACTOR_ROLES.map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={severity} onValueChange={setSeverity}>
              <SelectTrigger>
                <SelectValue placeholder="Severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All severities</SelectItem>
                <SelectItem value="info">Info</SelectItem>
                <SelectItem value="warning">Warning</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <div className="flex items-center gap-2 border-b bg-muted/30 px-4 py-2 text-xs text-muted-foreground">
          <Shield className="h-3.5 w-3.5" />
          Entries are append-only. No edits or deletes are possible.
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-40">Timestamp</TableHead>
              <TableHead>Actor</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Module</TableHead>
              <TableHead>Target</TableHead>
              <TableHead>IP</TableHead>
              <TableHead>Severity</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((l) => (
              <TableRow
                key={l.id}
                className="cursor-pointer"
                onClick={() => setViewing(l)}
              >
                <TableCell className="text-xs">
                  <div>{new Date(l.at).toLocaleDateString()}</div>
                  <div className="text-muted-foreground">
                    {new Date(l.at).toLocaleTimeString()}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm font-medium">{l.actorName}</div>
                  <div className="text-xs text-muted-foreground">
                    {l.actorRole}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="font-mono text-[10px] uppercase">
                    {l.action.replace("_", " ")}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm capitalize">{l.module}</TableCell>
                <TableCell className="max-w-xs truncate text-sm">
                  {l.target}
                </TableCell>
                <TableCell className="font-mono text-xs">{l.ip}</TableCell>
                <TableCell>
                  <SeverityPill severity={l.severity} />
                </TableCell>
                <TableCell>
                  <Button size="icon" variant="ghost">
                    <Eye />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="py-10 text-center text-muted-foreground"
                >
                  No log entries match your filters.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <div className="flex items-center justify-between border-t px-4 py-3 text-xs text-muted-foreground">
          <span>
            Showing {filtered.length} of {auditLogs.length} entries
          </span>
          <div className="flex gap-1">
            <Button variant="outline" size="sm" disabled>
              Previous
            </Button>
            <Button variant="outline" size="sm" disabled>
              Next
            </Button>
          </div>
        </div>
      </Card>

      <LogDetailDialog log={viewing} onClose={() => setViewing(null)} />
    </div>
  );
}

function Mini({
  icon: Icon,
  label,
  value,
  tone = "primary",
}: {
  icon: typeof ScrollText;
  label: string;
  value: number;
  tone?: "primary" | "indigo" | "amber" | "destructive";
}) {
  const c =
    tone === "indigo"
      ? "text-indigo-600 bg-indigo-100 dark:bg-indigo-500/15"
      : tone === "amber"
        ? "text-amber-600 bg-amber-100 dark:bg-amber-500/15"
        : tone === "destructive"
          ? "text-destructive bg-destructive/10"
          : "text-primary bg-primary/10";
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <div className={`flex h-10 w-10 items-center justify-center rounded-md ${c}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            {label}
          </p>
          <p className="text-xl font-bold">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function SeverityPill({ severity }: { severity: AuditSeverity }) {
  const map: Record<AuditSeverity, string> = {
    info: "bg-slate-100 text-slate-700 dark:bg-slate-500/15 dark:text-slate-300",
    warning:
      "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
    critical:
      "bg-destructive/15 text-destructive dark:bg-destructive/25",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium uppercase ${map[severity]}`}
    >
      {severity}
    </span>
  );
}

function LogDetailDialog({
  log,
  onClose,
}: {
  log: AuditLog | null;
  onClose: () => void;
}) {
  if (!log) return null;
  const copy = () => {
    navigator.clipboard?.writeText(JSON.stringify(log, null, 2));
    toast.success("Log entry copied to clipboard");
  };
  return (
    <Dialog open={!!log} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Audit Entry
            <SeverityPill severity={log.severity} />
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 text-sm">
          <div className="rounded-md border bg-muted/30 p-3">
            <p className="font-medium">{log.description}</p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Row label="Timestamp" value={new Date(log.at).toLocaleString()} />
            <Row label="Entry ID" value={log.id} mono />
            <Row label="Actor" value={`${log.actorName} (${log.actorRole})`} />
            <Row label="Actor email" value={log.actorEmail} />
            <Row label="Action" value={log.action.replace("_", " ")} />
            <Row label="Module" value={log.module} />
            <Row label="Target" value={log.target} />
            <Row label="Target ID" value={log.targetId ?? "—"} mono />
            <Row label="IP address" value={log.ip} mono />
            <Row label="User agent" value={log.userAgent} />
          </div>

          {log.metadata && Object.keys(log.metadata).length > 0 && (
            <div className="rounded-md border">
              <div className="border-b bg-muted/30 px-3 py-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Metadata
              </div>
              <pre className="overflow-x-auto p-3 text-xs">
                {JSON.stringify(log.metadata, null, 2)}
              </pre>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={copy}>
              <Copy /> Copy JSON
            </Button>
            <Button onClick={onClose}>Close</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Row({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="rounded-md border p-2.5">
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className={`mt-0.5 truncate text-sm ${mono ? "font-mono text-xs" : ""}`}>
        {value}
      </p>
    </div>
  );
}
