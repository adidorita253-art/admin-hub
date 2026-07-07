import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Bell,
  Mail,
  MessageSquare,
  Send,
  Plus,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Users,
  Eye,
  Copy,
  Pencil,
  Trash2,
  Smartphone,
  Inbox,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/notifications")({
  head: () => ({ meta: [{ title: "Notifications — Attachment Admin" }] }),
  component: NotificationsPage,
});

type Channel = "email" | "sms" | "inapp";
type DeliveryStatus = "delivered" | "sent" | "queued" | "failed" | "bounced";
type Audience = "students" | "academic_supervisors" | "company_supervisors" | "companies" | "all";

interface TemplateRec {
  id: string;
  name: string;
  event: string;
  channels: Channel[];
  subject: string;
  body: string;
  updatedAt: string;
  active: boolean;
}

interface DeliveryRow {
  id: string;
  template: string;
  recipient: string;
  audience: Audience;
  channel: Channel;
  status: DeliveryStatus;
  sentAt: string;
  openedAt?: string;
  error?: string;
}

interface InboxItem {
  id: string;
  title: string;
  body: string;
  time: string;
  read: boolean;
  channel: Channel;
  event: string;
}

const AUDIENCE_LABEL: Record<Audience, string> = {
  students: "All Students",
  academic_supervisors: "Academic Supervisors",
  company_supervisors: "Company Supervisors",
  companies: "Partner Companies",
  all: "Everyone",
};

const AUDIENCE_COUNT: Record<Audience, number> = {
  students: 1284,
  academic_supervisors: 42,
  company_supervisors: 211,
  companies: 186,
  all: 1723,
};

const seedTemplates: TemplateRec[] = [
  {
    id: "tpl-1",
    name: "Placement approved",
    event: "application.approved",
    channels: ["email", "inapp"],
    subject: "Your attachment placement has been approved",
    body: "Hi {{FIRST_NAME}}, great news — {{COMPANY_NAME}} has approved your industrial attachment. Report on {{START_DATE}}. Your academic supervisor is {{ACADEMIC_SUPERVISOR}}.",
    updatedAt: "2026-06-14T10:20:00Z",
    active: true,
  },
  {
    id: "tpl-2",
    name: "Letter sent to company",
    event: "letter.sent",
    channels: ["email"],
    subject: "Attachment request letter — {{STUDENT_NAME}} ({{REFERENCE_NO}})",
    body: "Dear {{COMPANY_CONTACT}}, please find the official attachment request letter for {{STUDENT_NAME}}. Kindly respond via {{APPROVAL_LINK}} within 7 days.",
    updatedAt: "2026-06-02T14:00:00Z",
    active: true,
  },
  {
    id: "tpl-3",
    name: "Logbook overdue",
    event: "logbook.overdue",
    channels: ["email", "sms", "inapp"],
    subject: "Reminder: log this week's attachment activity",
    body: "Hi {{FIRST_NAME}}, you haven't logged an entry in {{DAYS_INACTIVE}} days. Please update your logbook today to stay on track.",
    updatedAt: "2026-05-28T09:12:00Z",
    active: true,
  },
  {
    id: "tpl-4",
    name: "Approval link expiring",
    event: "letter.expiring",
    channels: ["email"],
    subject: "Approval link expires in 24 hours",
    body: "Dear {{COMPANY_CONTACT}}, the attachment approval link for {{STUDENT_NAME}} will expire on {{EXPIRY_DATE}}. Please respond via {{APPROVAL_LINK}}.",
    updatedAt: "2026-05-19T16:45:00Z",
    active: false,
  },
  {
    id: "tpl-5",
    name: "Supervisor assignment",
    event: "supervisor.assigned",
    channels: ["email", "inapp"],
    subject: "New student assigned: {{STUDENT_NAME}}",
    body: "Dear {{SUPERVISOR_NAME}}, you have been assigned to supervise {{STUDENT_NAME}} at {{COMPANY_NAME}} for the {{SEMESTER}} semester.",
    updatedAt: "2026-05-10T11:00:00Z",
    active: true,
  },
];

const seedDeliveries: DeliveryRow[] = [
  { id: "d1", template: "Placement approved", recipient: "brian.otieno@students.uni.ac.ke", audience: "students", channel: "email", status: "delivered", sentAt: "2026-07-06T10:04:00Z", openedAt: "2026-07-06T10:08:00Z" },
  { id: "d2", template: "Placement approved", recipient: "brian.otieno@students.uni.ac.ke", audience: "students", channel: "inapp", status: "delivered", sentAt: "2026-07-06T10:04:00Z", openedAt: "2026-07-06T10:04:12Z" },
  { id: "d3", template: "Logbook overdue", recipient: "aisha.mwangi@students.uni.ac.ke", audience: "students", channel: "sms", status: "sent", sentAt: "2026-07-06T08:30:00Z" },
  { id: "d4", template: "Letter sent to company", recipient: "careers@safaricom.co.ke", audience: "companies", channel: "email", status: "delivered", sentAt: "2026-07-05T15:20:00Z", openedAt: "2026-07-05T16:02:00Z" },
  { id: "d5", template: "Approval link expiring", recipient: "hr@twiga.com", audience: "companies", channel: "email", status: "bounced", sentAt: "2026-07-05T09:00:00Z", error: "550 mailbox unavailable" },
  { id: "d6", template: "Supervisor assignment", recipient: "dr.mensah@uni.ac.ke", audience: "academic_supervisors", channel: "email", status: "delivered", sentAt: "2026-07-04T13:10:00Z", openedAt: "2026-07-04T13:44:00Z" },
  { id: "d7", template: "Logbook overdue", recipient: "kevin.kamau@students.uni.ac.ke", audience: "students", channel: "email", status: "queued", sentAt: "2026-07-06T11:00:00Z" },
  { id: "d8", template: "Logbook overdue", recipient: "+254712345678", audience: "students", channel: "sms", status: "failed", sentAt: "2026-07-06T11:00:00Z", error: "Invalid MSISDN" },
  { id: "d9", template: "Placement approved", recipient: "naomi.hassan@students.uni.ac.ke", audience: "students", channel: "email", status: "delivered", sentAt: "2026-07-03T09:22:00Z", openedAt: "2026-07-03T09:45:00Z" },
  { id: "d10", template: "Letter sent to company", recipient: "hello@cellulant.io", audience: "companies", channel: "email", status: "delivered", sentAt: "2026-07-02T14:55:00Z" },
];

const seedInbox: InboxItem[] = [
  { id: "n1", title: "5 applications need your review", body: "Applications for Computer Science attachment placements are waiting for approval.", time: "10 min ago", read: false, channel: "inapp", event: "applications.pending" },
  { id: "n2", title: "Bulk letter generation complete", body: "23 letters generated for the 2025/2026 first semester batch.", time: "1 hour ago", read: false, channel: "inapp", event: "letter.batch" },
  { id: "n3", title: "Company Cellulant approved 3 placements", body: "Placements confirmed for Aisha, Kevin, and Naomi.", time: "3 hours ago", read: true, channel: "inapp", event: "application.approved" },
  { id: "n4", title: "Approval link expired without response", body: "The approval link for Wanjiku Kamau at Kenya Power expired 2 days ago.", time: "Yesterday", read: false, channel: "email", event: "letter.expired" },
  { id: "n5", title: "12 logbook entries unreviewed for 5+ days", body: "Dr. Boateng has a review backlog. Consider re-assigning.", time: "Yesterday", read: true, channel: "inapp", event: "supervisor.backlog" },
];

const STATUS_META: Record<DeliveryStatus, { label: string; className: string; icon: typeof CheckCircle2 }> = {
  delivered: { label: "Delivered", className: "bg-success/10 text-success", icon: CheckCircle2 },
  sent: { label: "Sent", className: "bg-info/10 text-info", icon: Send },
  queued: { label: "Queued", className: "bg-muted text-muted-foreground", icon: Clock },
  failed: { label: "Failed", className: "bg-destructive/10 text-destructive", icon: XCircle },
  bounced: { label: "Bounced", className: "bg-warning/15 text-warning-foreground", icon: XCircle },
};

const CHANNEL_META: Record<Channel, { label: string; icon: typeof Mail }> = {
  email: { label: "Email", icon: Mail },
  sms: { label: "SMS", icon: Smartphone },
  inapp: { label: "In-app", icon: Bell },
};

function NotificationsPage() {
  const [templates, setTemplates] = useState(seedTemplates);
  const [inbox, setInbox] = useState(seedInbox);
  const [deliveries] = useState(seedDeliveries);

  // Compose state
  const [audience, setAudience] = useState<Audience>("students");
  const [channels, setChannels] = useState<Record<Channel, boolean>>({ email: true, sms: false, inapp: true });
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [templateId, setTemplateId] = useState<string>("");

  // Delivery filters
  const [statusFilter, setStatusFilter] = useState<DeliveryStatus | "all">("all");
  const [channelFilter, setChannelFilter] = useState<Channel | "all">("all");
  const [search, setSearch] = useState("");

  // Template dialog
  const [editing, setEditing] = useState<TemplateRec | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<TemplateRec | null>(null);

  const unread = inbox.filter((i) => !i.read).length;

  const filteredDeliveries = useMemo(
    () =>
      deliveries.filter(
        (d) =>
          (statusFilter === "all" || d.status === statusFilter) &&
          (channelFilter === "all" || d.channel === channelFilter) &&
          (!search ||
            d.recipient.toLowerCase().includes(search.toLowerCase()) ||
            d.template.toLowerCase().includes(search.toLowerCase())),
      ),
    [deliveries, statusFilter, channelFilter, search],
  );

  const deliveryStats = useMemo(() => {
    const total = deliveries.length;
    const delivered = deliveries.filter((d) => d.status === "delivered").length;
    const failed = deliveries.filter((d) => d.status === "failed" || d.status === "bounced").length;
    const opened = deliveries.filter((d) => d.openedAt).length;
    const rate = total ? Math.round((delivered / total) * 100) : 0;
    const openRate = delivered ? Math.round((opened / delivered) * 100) : 0;
    return { total, delivered, failed, opened, rate, openRate };
  }, [deliveries]);

  const applyTemplate = (id: string) => {
    setTemplateId(id);
    const t = templates.find((x) => x.id === id);
    if (!t) return;
    setSubject(t.subject);
    setBody(t.body);
    setChannels({
      email: t.channels.includes("email"),
      sms: t.channels.includes("sms"),
      inapp: t.channels.includes("inapp"),
    });
  };

  const handleSend = () => {
    const activeChannels = (Object.keys(channels) as Channel[]).filter((c) => channels[c]);
    if (!activeChannels.length) return toast.error("Pick at least one channel");
    if (!subject.trim() || !body.trim()) return toast.error("Subject and message are required");
    toast.success("Broadcast queued", {
      description: `${AUDIENCE_LABEL[audience]} · ${AUDIENCE_COUNT[audience]} recipients · ${activeChannels.map((c) => CHANNEL_META[c].label).join(", ")}`,
    });
    setSubject("");
    setBody("");
    setTemplateId("");
  };

  const toggleTemplateActive = (id: string) => {
    setTemplates((prev) => prev.map((t) => (t.id === id ? { ...t, active: !t.active } : t)));
  };

  const saveTemplate = (rec: TemplateRec) => {
    setTemplates((prev) => {
      const exists = prev.some((t) => t.id === rec.id);
      return exists ? prev.map((t) => (t.id === rec.id ? rec : t)) : [...prev, rec];
    });
    setEditing(null);
    toast.success("Template saved");
  };

  const deleteTemplate = (id: string) => {
    setTemplates((prev) => prev.filter((t) => t.id !== id));
    setConfirmDelete(null);
    toast.success("Template deleted");
  };

  const markAllRead = () => {
    setInbox((prev) => prev.map((i) => ({ ...i, read: true })));
    toast.success("All notifications marked as read");
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Notifications"
        description="System-generated and admin-composed messages across email, SMS and in-app."
        actions={
          <>
            <Button variant="outline" size="sm" onClick={markAllRead} disabled={unread === 0}>
              <CheckCircle2 className="h-4 w-4" /> Mark all read
            </Button>
            <Button
              size="sm"
              onClick={() =>
                setEditing({
                  id: `tpl-${Date.now()}`,
                  name: "",
                  event: "custom.event",
                  channels: ["email"],
                  subject: "",
                  body: "",
                  updatedAt: new Date().toISOString(),
                  active: true,
                })
              }
            >
              <Plus className="h-4 w-4" /> New Template
            </Button>
          </>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Sent (24h)" value={deliveryStats.total.toString()} icon={Send} tone="info" />
        <StatCard label="Delivery Rate" value={`${deliveryStats.rate}%`} icon={CheckCircle2} tone="success" />
        <StatCard label="Open Rate" value={`${deliveryStats.openRate}%`} icon={Eye} tone="info" />
        <StatCard label="Failures" value={deliveryStats.failed.toString()} icon={XCircle} tone="destructive" />
      </div>

      <Tabs defaultValue="inbox">
        <TabsList>
          <TabsTrigger value="inbox" className="gap-2">
            <Inbox className="h-4 w-4" /> Inbox
            {unread > 0 && <Badge variant="destructive" className="h-5 px-1.5">{unread}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="compose"><Send className="mr-2 h-4 w-4" /> Compose</TabsTrigger>
          <TabsTrigger value="templates"><MessageSquare className="mr-2 h-4 w-4" /> Templates</TabsTrigger>
          <TabsTrigger value="log"><Mail className="mr-2 h-4 w-4" /> Delivery Log</TabsTrigger>
        </TabsList>

        {/* Inbox */}
        <TabsContent value="inbox" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Recent notifications</CardTitle>
              <p className="text-xs text-muted-foreground">
                System events that landed in your admin inbox
              </p>
            </CardHeader>
            <CardContent className="divide-y divide-border p-0">
              {inbox.map((n) => {
                const ChIcon = CHANNEL_META[n.channel].icon;
                return (
                  <button
                    key={n.id}
                    onClick={() =>
                      setInbox((prev) => prev.map((i) => (i.id === n.id ? { ...i, read: true } : i)))
                    }
                    className={`flex w-full items-start gap-3 p-4 text-left transition-colors hover:bg-accent/40 ${
                      !n.read ? "bg-accent/20" : ""
                    }`}
                  >
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                      <ChIcon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-sm ${!n.read ? "font-semibold" : "font-medium"}`}>
                          {n.title}
                        </span>
                        {!n.read && <span className="h-1.5 w-1.5 rounded-full bg-primary" />}
                      </div>
                      <div className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{n.body}</div>
                      <div className="mt-1 flex items-center gap-2 text-[11px] text-muted-foreground">
                        <span>{n.time}</span>
                        <span>·</span>
                        <Badge variant="outline" className="h-4 px-1.5 text-[10px]">{n.event}</Badge>
                      </div>
                    </div>
                  </button>
                );
              })}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Compose */}
        <TabsContent value="compose" className="mt-4 grid gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-base">Compose broadcast</CardTitle>
              <p className="text-xs text-muted-foreground">
                Send to an audience segment across one or more channels
              </p>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid gap-2">
                <Label>Audience</Label>
                <Select value={audience} onValueChange={(v) => setAudience(v as Audience)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(Object.keys(AUDIENCE_LABEL) as Audience[]).map((k) => (
                      <SelectItem key={k} value={k}>
                        {AUDIENCE_LABEL[k]} · {AUDIENCE_COUNT[k].toLocaleString()} recipients
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label>Start from template (optional)</Label>
                <Select value={templateId} onValueChange={applyTemplate}>
                  <SelectTrigger><SelectValue placeholder="Blank message" /></SelectTrigger>
                  <SelectContent>
                    {templates.filter((t) => t.active).map((t) => (
                      <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label>Channels</Label>
                <div className="flex flex-wrap gap-3">
                  {(Object.keys(CHANNEL_META) as Channel[]).map((c) => {
                    const CIcon = CHANNEL_META[c].icon;
                    return (
                      <label
                        key={c}
                        className={`flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm ${
                          channels[c] ? "border-primary bg-primary/5" : "border-border"
                        }`}
                      >
                        <Checkbox
                          checked={channels[c]}
                          onCheckedChange={(v) =>
                            setChannels((prev) => ({ ...prev, [c]: Boolean(v) }))
                          }
                        />
                        <CIcon className="h-4 w-4" />
                        {CHANNEL_META[c].label}
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="grid gap-2">
                <Label>Subject</Label>
                <Input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. Reminder: submit this week's logbook"
                />
              </div>

              <div className="grid gap-2">
                <Label>Message</Label>
                <Textarea
                  rows={7}
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Use tokens like {{FIRST_NAME}}, {{COMPANY_NAME}}, {{APPROVAL_LINK}}"
                />
                <p className="text-xs text-muted-foreground">
                  Tokens: {`{{FIRST_NAME}}`} · {`{{STUDENT_NAME}}`} · {`{{COMPANY_NAME}}`} · {`{{APPROVAL_LINK}}`} · {`{{ACADEMIC_YEAR}}`}
                </p>
              </div>

              <div className="flex items-center justify-between border-t border-border pt-4">
                <div className="text-xs text-muted-foreground">
                  Estimated recipients: <span className="font-semibold text-foreground">
                    {AUDIENCE_COUNT[audience].toLocaleString()}
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => { setSubject(""); setBody(""); setTemplateId(""); }}>
                    Clear
                  </Button>
                  <Button onClick={handleSend}><Send className="h-4 w-4" /> Send broadcast</Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Preview</CardTitle>
              <p className="text-xs text-muted-foreground">How the first recipient will see it</p>
            </CardHeader>
            <CardContent className="grid gap-3">
              <div className="rounded-md border border-border bg-card p-3">
                <div className="flex items-center gap-2 border-b border-border pb-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Bell className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs text-muted-foreground">Attachment Admin</div>
                    <div className="truncate text-sm font-semibold">
                      {subject || "Subject preview"}
                    </div>
                  </div>
                </div>
                <div className="mt-3 whitespace-pre-wrap text-sm text-foreground">
                  {body || "Message body preview will appear here."}
                </div>
              </div>
              <div className="grid gap-2 rounded-md border border-dashed border-border p-3 text-xs text-muted-foreground">
                <div className="flex items-center justify-between">
                  <span>Audience</span>
                  <span className="font-medium text-foreground">{AUDIENCE_LABEL[audience]}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Channels</span>
                  <span className="font-medium text-foreground">
                    {(Object.keys(channels) as Channel[]).filter((c) => channels[c]).map((c) => CHANNEL_META[c].label).join(", ") || "None"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Est. delivery time</span>
                  <span className="font-medium text-foreground">&lt; 2 minutes</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Templates */}
        <TabsContent value="templates" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Notification templates</CardTitle>
              <p className="text-xs text-muted-foreground">
                Automated messages triggered by system events
              </p>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Template</TableHead>
                    <TableHead>Trigger event</TableHead>
                    <TableHead>Channels</TableHead>
                    <TableHead>Updated</TableHead>
                    <TableHead>Active</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {templates.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell>
                        <div className="font-medium">{t.name}</div>
                        <div className="line-clamp-1 text-xs text-muted-foreground">{t.subject}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-mono text-xs">{t.event}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {t.channels.map((c) => {
                            const Icon = CHANNEL_META[c].icon;
                            return (
                              <span key={c} title={CHANNEL_META[c].label}
                                className="flex h-6 w-6 items-center justify-center rounded-md bg-muted text-muted-foreground">
                                <Icon className="h-3.5 w-3.5" />
                              </span>
                            );
                          })}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(t.updatedAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Switch checked={t.active} onCheckedChange={() => toggleTemplateActive(t.id)} />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button size="sm" variant="ghost" onClick={() => setEditing(t)}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() =>
                              saveTemplate({
                                ...t,
                                id: `tpl-${Date.now()}`,
                                name: `${t.name} (copy)`,
                                updatedAt: new Date().toISOString(),
                              })
                            }
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setConfirmDelete(t)}>
                            <Trash2 className="h-3.5 w-3.5 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Delivery Log */}
        <TabsContent value="log" className="mt-4">
          <Card>
            <CardHeader className="gap-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-base">Delivery log</CardTitle>
                  <p className="text-xs text-muted-foreground">
                    Status per recipient · retries and bounces tracked
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search recipient or template"
                      className="h-9 w-[240px] pl-7"
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as DeliveryStatus | "all")}>
                    <SelectTrigger className="h-9 w-[140px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All statuses</SelectItem>
                      {(Object.keys(STATUS_META) as DeliveryStatus[]).map((s) => (
                        <SelectItem key={s} value={s}>{STATUS_META[s].label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={channelFilter} onValueChange={(v) => setChannelFilter(v as Channel | "all")}>
                    <SelectTrigger className="h-9 w-[130px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All channels</SelectItem>
                      {(Object.keys(CHANNEL_META) as Channel[]).map((c) => (
                        <SelectItem key={c} value={c}>{CHANNEL_META[c].label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Recipient</TableHead>
                    <TableHead>Template</TableHead>
                    <TableHead>Audience</TableHead>
                    <TableHead>Channel</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Sent</TableHead>
                    <TableHead>Opened</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDeliveries.map((d) => {
                    const meta = STATUS_META[d.status];
                    const Icon = meta.icon;
                    const ChIcon = CHANNEL_META[d.channel].icon;
                    return (
                      <TableRow key={d.id}>
                        <TableCell className="font-medium">{d.recipient}</TableCell>
                        <TableCell className="text-muted-foreground">{d.template}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="gap-1">
                            <Users className="h-3 w-3" />
                            {AUDIENCE_LABEL[d.audience]}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="inline-flex items-center gap-1.5 text-sm">
                            <ChIcon className="h-3.5 w-3.5 text-muted-foreground" />
                            {CHANNEL_META[d.channel].label}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge className={`gap-1 ${meta.className}`} variant="secondary">
                            <Icon className="h-3 w-3" />
                            {meta.label}
                          </Badge>
                          {d.error && (
                            <div className="mt-0.5 text-[11px] text-destructive">{d.error}</div>
                          )}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {new Date(d.sentAt).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {d.openedAt ? new Date(d.openedAt).toLocaleString() : "—"}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {filteredDeliveries.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="py-8 text-center text-sm text-muted-foreground">
                        No matching deliveries
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Template editor dialog */}
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing?.name ? "Edit template" : "New template"}</DialogTitle>
            <DialogDescription>
              Triggered automatically when the linked system event fires.
            </DialogDescription>
          </DialogHeader>
          {editing && (
            <div className="grid gap-4">
              <div className="grid gap-2 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label>Name</Label>
                  <Input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
                </div>
                <div className="grid gap-2">
                  <Label>Trigger event</Label>
                  <Input
                    value={editing.event}
                    onChange={(e) => setEditing({ ...editing, event: e.target.value })}
                    placeholder="e.g. logbook.overdue"
                    className="font-mono text-sm"
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Channels</Label>
                <div className="flex gap-3">
                  {(Object.keys(CHANNEL_META) as Channel[]).map((c) => {
                    const on = editing.channels.includes(c);
                    return (
                      <label key={c} className={`flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm ${on ? "border-primary bg-primary/5" : ""}`}>
                        <Checkbox
                          checked={on}
                          onCheckedChange={(v) =>
                            setEditing({
                              ...editing,
                              channels: v ? [...editing.channels, c] : editing.channels.filter((x) => x !== c),
                            })
                          }
                        />
                        {CHANNEL_META[c].label}
                      </label>
                    );
                  })}
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Subject</Label>
                <Input value={editing.subject} onChange={(e) => setEditing({ ...editing, subject: e.target.value })} />
              </div>
              <div className="grid gap-2">
                <Label>Body</Label>
                <Textarea rows={6} value={editing.body} onChange={(e) => setEditing({ ...editing, body: e.target.value })} />
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={editing.active}
                  onCheckedChange={(v) => setEditing({ ...editing, active: v })}
                />
                <Label className="text-sm">Active — send when the event fires</Label>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
            <Button
              onClick={() =>
                editing &&
                saveTemplate({ ...editing, updatedAt: new Date().toISOString() })
              }
            >
              Save template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <Dialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete template?</DialogTitle>
            <DialogDescription>
              "{confirmDelete?.name}" will no longer send when {confirmDelete?.event} fires.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDelete(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => confirmDelete && deleteTemplate(confirmDelete.id)}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  icon: typeof Mail;
  tone: "success" | "info" | "warning" | "destructive";
}) {
  const toneClass = {
    success: "bg-success/10 text-success",
    info: "bg-info/10 text-info",
    warning: "bg-warning/15 text-warning-foreground",
    destructive: "bg-destructive/10 text-destructive",
  }[tone];
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-5">
        <div className={`flex h-11 w-11 items-center justify-center rounded-md ${toneClass}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</div>
          <div className="text-2xl font-bold tabular-nums tracking-tight">{value}</div>
        </div>
      </CardContent>
    </Card>
  );
}
