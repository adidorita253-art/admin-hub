import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Building2,
  Search,
  Plus,
  MoreHorizontal,
  Eye,
  ShieldCheck,
  ShieldAlert,
  Ban,
  Pencil,
  Users,
  UserCheck,
  FileText,
  CheckCircle2,
  Mail,
  Phone,
  Globe,
  MapPin,
  Download,
  Building,
  Clock,
  AlertTriangle,
  TrendingUp,
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  companies as seed,
  companySupervisors,
  students,
  type Company,
  type CompanyStatus,
} from "@/lib/mock-data";
import { AttachmentPill } from "@/components/status-pill";

export const Route = createFileRoute("/companies")({
  head: () => ({ meta: [{ title: "Companies — Attachment Admin" }] }),
  validateSearch: (s: Record<string, unknown>) => ({
    add: s.add === 1 || s.add === "1" || s.add === true ? 1 : undefined,
  }),
  component: CompaniesPage,
});

const INDUSTRY_OPTIONS = [
  "Telecommunications",
  "Banking & Finance",
  "Consulting",
  "Software & Cloud",
  "Agritech",
  "Energy & Utilities",
  "Fintech",
  "Manufacturing",
  "Healthcare",
  "Education",
  "Hospitality",
  "Other",
];

function CompaniesPage() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const [data, setData] = useState<Company[]>(seed);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<string>("all");
  const [industry, setIndustry] = useState<string>("all");
  const [size, setSize] = useState<string>("all");
  const [viewing, setViewing] = useState<Company | null>(null);
  const [editing, setEditing] = useState<Company | null>(null);
  const [adding, setAdding] = useState(false);
  const [blacklisting, setBlacklisting] = useState<Company | null>(null);

  useEffect(() => {
    if (search.add) {
      setAdding(true);
      navigate({ search: { add: undefined }, replace: true });
    }
  }, [search.add, navigate]);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    return data.filter((c) => {
      if (status !== "all" && c.status !== status) return false;
      if (industry !== "all" && c.industry !== industry) return false;
      if (size !== "all" && c.size !== size) return false;
      if (!q) return true;
      return (
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.city.toLowerCase().includes(q) ||
        c.contactPerson.toLowerCase().includes(q)
      );
    });
  }, [data, query, status, industry, size]);

  const stats = useMemo(() => {
    const total = data.length;
    const verified = data.filter((c) => c.status === "verified").length;
    const pending = data.filter((c) => c.status === "pending").length;
    const blacklisted = data.filter((c) => c.status === "blacklisted").length;
    const totalStudents = data.reduce((a, c) => a + c.studentsHosted, 0);
    return { total, verified, pending, blacklisted, totalStudents };
  }, [data]);

  const updateStatus = (id: string, next: CompanyStatus, reason?: string) => {
    setData((prev) =>
      prev.map((c) =>
        c.id === id
          ? {
              ...c,
              status: next,
              blacklistReason: next === "blacklisted" ? reason : undefined,
              verifiedAt:
                next === "verified"
                  ? new Date().toISOString()
                  : c.verifiedAt,
              verifiedBy: next === "verified" ? "Admin User" : c.verifiedBy,
            }
          : c,
      ),
    );
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Company Management"
        description="Registry of host companies — verify, monitor capacity and manage supervisor partnerships."
        actions={
          <>
            <Button variant="outline" onClick={() => toast.success("Export started")}>
              <Download /> Export CSV
            </Button>
            <Button onClick={() => setAdding(true)}>
              <Plus /> Add Company
            </Button>
          </>
        }
      />

      {/* Stats */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <Mini icon={Building2} label="Total" value={stats.total} />
        <Mini icon={ShieldCheck} label="Verified" value={stats.verified} tone="success" />
        <Mini icon={Clock} label="Pending" value={stats.pending} tone="amber" />
        <Mini icon={Ban} label="Blacklisted" value={stats.blacklisted} tone="destructive" />
        <Mini icon={Users} label="Students Hosted" value={stats.totalStudents} />
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="flex flex-col gap-3 p-4 lg:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, city or contact…"
              className="pl-8"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="lg:w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="verified">Verified</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="blacklisted">Blacklisted</SelectItem>
            </SelectContent>
          </Select>
          <Select value={industry} onValueChange={setIndustry}>
            <SelectTrigger className="lg:w-52">
              <SelectValue placeholder="Industry" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All industries</SelectItem>
              {Array.from(new Set(data.map((c) => c.industry))).map((i) => (
                <SelectItem key={i} value={i}>
                  {i}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={size} onValueChange={setSize}>
            <SelectTrigger className="lg:w-36">
              <SelectValue placeholder="Size" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All sizes</SelectItem>
              <SelectItem value="Startup">Startup</SelectItem>
              <SelectItem value="SME">SME</SelectItem>
              <SelectItem value="Large">Large</SelectItem>
              <SelectItem value="Multinational">Multinational</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Company</TableHead>
              <TableHead>Industry</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Capacity</TableHead>
              <TableHead>Supervisors</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((c) => {
              const full = c.studentsHosted >= c.capacity;
              const pct = Math.min(100, (c.studentsHosted / c.capacity) * 100);
              return (
                <TableRow key={c.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <CompanyLogo text={c.logoText} status={c.status} />
                      <div>
                        <div className="flex items-center gap-1.5 font-medium">
                          {c.name}
                          {full && (
                            <Badge variant="outline" className="border-amber-300 bg-amber-100 text-[10px] font-medium text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">
                              FULL
                            </Badge>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {c.size}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{c.industry}</TableCell>
                  <TableCell className="text-sm">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <MapPin className="h-3 w-3" /> {c.city}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">
                    <div className="font-medium">{c.contactPerson}</div>
                    <div className="text-xs text-muted-foreground">
                      {c.contactJobTitle}
                    </div>
                  </TableCell>
                  <TableCell className="w-40">
                    <div className="mb-1 flex justify-between text-xs">
                      <span className="font-medium">
                        {c.studentsHosted}/{c.capacity}
                      </span>
                      <span className="text-muted-foreground">{Math.round(pct)}%</span>
                    </div>
                    <Progress
                      value={pct}
                      className={cn("h-1.5", full && "[&>div]:bg-amber-500")}
                    />
                  </TableCell>
                  <TableCell className="text-sm">{c.supervisorsCount}</TableCell>
                  <TableCell>
                    <CompanyStatusBadge status={c.status} />
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="icon" variant="ghost">
                          <MoreHorizontal />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => setViewing(c)}>
                          <Eye /> View profile
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setEditing(c)}>
                          <Pencil /> Edit details
                        </DropdownMenuItem>
                        {c.status !== "verified" && (
                          <DropdownMenuItem
                            onClick={() => {
                              updateStatus(c.id, "verified");
                              toast.success(`${c.name} verified`);
                            }}
                          >
                            <CheckCircle2 /> Verify
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        {c.status !== "blacklisted" ? (
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => setBlacklisting(c)}
                          >
                            <Ban /> Blacklist
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem
                            onClick={() => {
                              updateStatus(c.id, "pending");
                              toast.success(`${c.name} reinstated to Pending`);
                            }}
                          >
                            <ShieldCheck /> Remove from blacklist
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="py-10 text-center text-muted-foreground">
                  No companies match the filters.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      <ProfileDialog company={viewing} onClose={() => setViewing(null)} />
      <CompanyFormDialog
        open={adding}
        onClose={() => setAdding(false)}
        onSave={(c) => {
          setData((prev) => [c, ...prev]);
          toast.success(`${c.name} added — pending verification`);
          setAdding(false);
        }}
      />
      <CompanyFormDialog
        open={!!editing}
        company={editing}
        onClose={() => setEditing(null)}
        onSave={(c) => {
          setData((prev) => prev.map((x) => (x.id === c.id ? c : x)));
          toast.success(`${c.name} updated`);
          setEditing(null);
        }}
      />
      <BlacklistDialog
        company={blacklisting}
        onClose={() => setBlacklisting(null)}
        onConfirm={(reason) => {
          if (!blacklisting) return;
          updateStatus(blacklisting.id, "blacklisted", reason);
          toast.success(`${blacklisting.name} blacklisted`);
          setBlacklisting(null);
        }}
      />
    </div>
  );
}

/* ---------------- atoms ---------------- */

function CompanyLogo({ text, status }: { text: string; status: CompanyStatus }) {
  const tone =
    status === "verified"
      ? "bg-primary/10 text-primary border-primary/20"
      : status === "pending"
        ? "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-500/15 dark:text-amber-300"
        : "bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-500/15 dark:text-rose-300";
  return (
    <div
      className={cn(
        "flex h-10 w-10 shrink-0 items-center justify-center rounded-md border text-xs font-bold tracking-wide",
        tone,
      )}
    >
      {text}
    </div>
  );
}

function CompanyStatusBadge({ status }: { status: CompanyStatus }) {
  const map: Record<CompanyStatus, { label: string; cls: string; Icon: typeof ShieldCheck }> = {
    verified: {
      label: "Verified",
      cls: "bg-emerald-100 text-emerald-700 border-emerald-200/60 dark:bg-emerald-500/15 dark:text-emerald-300",
      Icon: ShieldCheck,
    },
    pending: {
      label: "Pending",
      cls: "bg-amber-100 text-amber-700 border-amber-200/60 dark:bg-amber-500/15 dark:text-amber-300",
      Icon: Clock,
    },
    blacklisted: {
      label: "Blacklisted",
      cls: "bg-rose-100 text-rose-700 border-rose-200/60 dark:bg-rose-500/15 dark:text-rose-300",
      Icon: Ban,
    },
  };
  const { label, cls, Icon } = map[status];
  return (
    <Badge variant="outline" className={cn("gap-1 font-medium", cls)}>
      <Icon className="h-3 w-3" /> {label}
    </Badge>
  );
}

function Mini({
  icon: Icon,
  label,
  value,
  tone = "primary",
}: {
  icon: typeof Building2;
  label: string;
  value: number;
  tone?: "primary" | "success" | "amber" | "destructive";
}) {
  const c =
    tone === "success"
      ? "text-emerald-600 bg-emerald-100 dark:bg-emerald-500/15"
      : tone === "amber"
        ? "text-amber-600 bg-amber-100 dark:bg-amber-500/15"
        : tone === "destructive"
          ? "text-rose-600 bg-rose-100 dark:bg-rose-500/15"
          : "text-primary bg-primary/10";
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <div className={cn("flex h-10 w-10 items-center justify-center rounded-md", c)}>
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

function Info({
  icon: Icon,
  label,
  value,
  href,
}: {
  icon: typeof Mail;
  label: string;
  value: string;
  href?: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-md border p-3">
      <Icon className="mt-0.5 h-4 w-4 text-muted-foreground" />
      <div className="min-w-0">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        {href ? (
          <a
            href={href}
            target="_blank"
            rel="noreferrer"
            className="truncate text-sm font-medium text-primary hover:underline"
          >
            {value}
          </a>
        ) : (
          <p className="truncate text-sm font-medium">{value}</p>
        )}
      </div>
    </div>
  );
}

/* ---------------- profile ---------------- */

function ProfileDialog({
  company,
  onClose,
}: {
  company: Company | null;
  onClose: () => void;
}) {
  if (!company) return null;
  const sups = companySupervisors.filter((s) => s.companyName === company.name);
  const sts = students.filter((s) => s.companyName === company.name);
  return (
    <Dialog open={!!company} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="sr-only">{company.name}</DialogTitle>
          <div className="flex items-start gap-4">
            <CompanyLogo text={company.logoText} status={company.status} />
            <div className="flex-1">
              <h2 className="text-xl font-semibold">{company.name}</h2>
              <p className="text-sm text-muted-foreground">
                {company.industry} • {company.size}
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                <CompanyStatusBadge status={company.status} />
                {company.verifiedAt && (
                  <Badge variant="outline" className="gap-1 text-xs">
                    <CheckCircle2 className="h-3 w-3" />
                    Verified {new Date(company.verifiedAt).toLocaleDateString()}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </DialogHeader>

        {company.status === "blacklisted" && company.blacklistReason && (
          <div className="rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">
            <div className="mb-1 flex items-center gap-1.5 font-semibold">
              <AlertTriangle className="h-4 w-4" /> Blacklist reason
            </div>
            {company.blacklistReason}
          </div>
        )}

        <Tabs defaultValue="overview">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="students">
              Students ({sts.length})
            </TabsTrigger>
            <TabsTrigger value="supervisors">
              Supervisors ({sups.length})
            </TabsTrigger>
            <TabsTrigger value="notes">Notes</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-4 space-y-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <MiniStat
                icon={Users}
                label="Students Hosted"
                value={`${company.studentsHosted} / ${company.capacity}`}
              />
              <MiniStat
                icon={FileText}
                label="Applications"
                value={String(company.applicationsReceived)}
              />
              <MiniStat
                icon={TrendingUp}
                label="Approval Rate"
                value={`${company.approvalRate}%`}
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Info icon={Mail} label="Email" value={company.email} />
              <Info icon={Phone} label="Phone" value={company.phone} />
              <Info
                icon={Globe}
                label="Website"
                value={company.website.replace(/^https?:\/\//, "")}
                href={company.website}
              />
              <Info
                icon={MapPin}
                label="Address"
                value={`${company.address}, ${company.city}`}
              />
              <Info icon={Building} label="County" value={company.county} />
              <Info
                icon={Clock}
                label="Registered"
                value={new Date(company.registeredAt).toLocaleDateString()}
              />
            </div>
          </TabsContent>

          <TabsContent value="students" className="mt-4">
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Reg No.</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sts.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium">
                        {s.firstName} {s.lastName}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {s.regNumber}
                      </TableCell>
                      <TableCell className="text-sm">{s.department}</TableCell>
                      <TableCell>
                        <AttachmentPill status={s.attachmentStatus} />
                      </TableCell>
                    </TableRow>
                  ))}
                  {sts.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        className="py-6 text-center text-sm text-muted-foreground"
                      >
                        No students hosted yet.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          <TabsContent value="supervisors" className="mt-4">
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Job Title</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Students</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sups.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium">
                        {s.firstName} {s.lastName}
                      </TableCell>
                      <TableCell className="text-sm">{s.jobTitle}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {s.email}
                      </TableCell>
                      <TableCell className="text-sm">{s.studentsAssigned}</TableCell>
                    </TableRow>
                  ))}
                  {sups.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        className="py-6 text-center text-sm text-muted-foreground"
                      >
                        No supervisors yet.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          <TabsContent value="notes" className="mt-4">
            <Card>
              <CardContent className="p-4 text-sm leading-relaxed">
                {company.notes}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

function MiniStat({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Users;
  label: string;
  value: string;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
          <Icon className="h-3.5 w-3.5" /> {label}
        </div>
        <div className="mt-1 text-xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
}

/* ---------------- create/edit ---------------- */

function CompanyFormDialog({
  open,
  company,
  onClose,
  onSave,
}: {
  open: boolean;
  company?: Company | null;
  onClose: () => void;
  onSave: (c: Company) => void;
}) {
  const isEdit = !!company;
  const blank: Company = {
    id: `co-new-${Date.now()}`,
    name: "",
    industry: "Software & Cloud",
    size: "SME",
    email: "",
    phone: "",
    website: "",
    address: "",
    city: "Nairobi",
    county: "Nairobi",
    contactPerson: "",
    contactJobTitle: "",
    logoText: "NEW",
    status: "pending",
    capacity: 5,
    studentsHosted: 0,
    supervisorsCount: 0,
    applicationsReceived: 0,
    approvalRate: 0,
    registeredAt: new Date().toISOString(),
    verifiedAt: null,
    verifiedBy: null,
    notes: "",
  };
  const [form, setForm] = useState<Company>(company ?? blank);

  // re-init when target changes
  const targetId = company?.id ?? "new";
  const [bound, setBound] = useState(targetId);
  if (bound !== targetId) {
    setBound(targetId);
    setForm(company ?? blank);
  }

  const set = <K extends keyof Company>(k: K, v: Company[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const submit = () => {
    if (!form.name.trim()) {
      toast.error("Company name is required");
      return;
    }
    const initials = form.name
      .split(" ")
      .map((w) => w[0])
      .join("")
      .slice(0, 3)
      .toUpperCase();
    onSave({ ...form, logoText: initials });
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Company" : "Add New Company"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update company details."
              : "New companies are saved as Pending until an administrator verifies them."}
          </DialogDescription>
        </DialogHeader>

        <div className="grid max-h-[60vh] gap-3 overflow-y-auto sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label>Company name *</Label>
            <Input
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="e.g. Acme Technologies Ltd"
            />
          </div>
          <div>
            <Label>Industry</Label>
            <Select value={form.industry} onValueChange={(v) => set("industry", v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {INDUSTRY_OPTIONS.map((i) => (
                  <SelectItem key={i} value={i}>
                    {i}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Company size</Label>
            <Select
              value={form.size}
              onValueChange={(v) => set("size", v as Company["size"])}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Startup">Startup (1–10)</SelectItem>
                <SelectItem value="SME">SME (11–250)</SelectItem>
                <SelectItem value="Large">Large (251–1000)</SelectItem>
                <SelectItem value="Multinational">Multinational (1000+)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Email</Label>
            <Input
              type="email"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
              placeholder="hr@acme.co.ke"
            />
          </div>
          <div>
            <Label>Phone</Label>
            <Input
              value={form.phone}
              onChange={(e) => set("phone", e.target.value)}
              placeholder="+254 700 000000"
            />
          </div>
          <div className="sm:col-span-2">
            <Label>Website</Label>
            <Input
              value={form.website}
              onChange={(e) => set("website", e.target.value)}
              placeholder="https://www.acme.co.ke"
            />
          </div>
          <div className="sm:col-span-2">
            <Label>Address</Label>
            <Input
              value={form.address}
              onChange={(e) => set("address", e.target.value)}
              placeholder="Plot 12, Industrial Area"
            />
          </div>
          <div>
            <Label>City</Label>
            <Input
              value={form.city}
              onChange={(e) => set("city", e.target.value)}
            />
          </div>
          <div>
            <Label>County</Label>
            <Input
              value={form.county}
              onChange={(e) => set("county", e.target.value)}
            />
          </div>
          <div>
            <Label>Primary contact name</Label>
            <Input
              value={form.contactPerson}
              onChange={(e) => set("contactPerson", e.target.value)}
              placeholder="Jane Mwangi"
            />
          </div>
          <div>
            <Label>Contact job title</Label>
            <Input
              value={form.contactJobTitle}
              onChange={(e) => set("contactJobTitle", e.target.value)}
              placeholder="HR Manager"
            />
          </div>
          <div className="sm:col-span-2">
            <Label>Capacity (max concurrent students)</Label>
            <Input
              type="number"
              min={0}
              value={form.capacity}
              onChange={(e) =>
                set("capacity", Math.max(0, Number(e.target.value) || 0))
              }
            />
          </div>
          <div className="sm:col-span-2">
            <Label>Internal notes</Label>
            <Textarea
              rows={3}
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              placeholder="Anything the team should know about this partner."
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={submit}>
            {isEdit ? (
              <>
                <Pencil /> Save changes
              </>
            ) : (
              <>
                <Plus /> Add company
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ---------------- blacklist ---------------- */

function BlacklistDialog({
  company,
  onClose,
  onConfirm,
}: {
  company: Company | null;
  onClose: () => void;
  onConfirm: (reason: string) => void;
}) {
  const [reason, setReason] = useState("");
  if (!company) return null;
  return (
    <Dialog
      open={!!company}
      onOpenChange={(o) => {
        if (!o) {
          setReason("");
          onClose();
        }
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-rose-500" />
            Blacklist {company.name}?
          </DialogTitle>
          <DialogDescription>
            Blacklisted companies are hidden from students and cannot receive
            new applications. Provide a clear reason — this will be logged in
            the audit trail.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label>Reason</Label>
          <Textarea
            rows={4}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Repeated unpaid stipends reported by students."
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            disabled={reason.trim().length < 10}
            onClick={() => {
              onConfirm(reason.trim());
              setReason("");
            }}
          >
            <Ban /> Blacklist
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
