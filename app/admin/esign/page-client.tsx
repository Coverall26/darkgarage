"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  PenLine,
  Plus,
  Send,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ChevronRight,
  Mail,
  Users,
  MoreHorizontal,
  Eye,
  Bell,
  Trash2,
  FileText,
  ArrowLeft,
  Loader2,
  Upload,
  X,
  GripVertical,
} from "lucide-react";
import { toast } from "sonner";
import { reportError } from "@/lib/error";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// ── Types ──

interface Recipient {
  id?: string;
  name: string;
  email: string;
  role: "SIGNER" | "CC" | "CERTIFIED_DELIVERY";
  order: number;
  status?: string;
  signedAt?: string | null;
  viewedAt?: string | null;
}

interface Envelope {
  id: string;
  title: string;
  description?: string | null;
  status: string;
  signingMode: string;
  emailSubject?: string | null;
  emailMessage?: string | null;
  expiresAt?: string | null;
  reminderEnabled: boolean;
  reminderDays: number;
  maxReminders: number;
  sourceFileName?: string | null;
  createdAt: string;
  updatedAt: string;
  sentAt?: string | null;
  completedAt?: string | null;
  recipients: Recipient[];
  createdBy?: { name: string | null; email: string };
}

interface StatusCounts {
  [key: string]: number;
}

// ── Status helpers ──

const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; icon: React.ElementType }
> = {
  DRAFT: { label: "Draft", color: "bg-gray-500", icon: FileText },
  PREPARING: { label: "Preparing", color: "bg-yellow-500", icon: Clock },
  SENT: { label: "Sent", color: "bg-blue-500", icon: Send },
  VIEWED: { label: "Viewed", color: "bg-indigo-500", icon: Eye },
  PARTIALLY_SIGNED: {
    label: "In Progress",
    color: "bg-amber-500",
    icon: Clock,
  },
  COMPLETED: {
    label: "Completed",
    color: "bg-emerald-500",
    icon: CheckCircle2,
  },
  VOIDED: { label: "Voided", color: "bg-red-500", icon: XCircle },
  DECLINED: { label: "Declined", color: "bg-orange-500", icon: AlertTriangle },
  EXPIRED: { label: "Expired", color: "bg-gray-400", icon: Clock },
};

function StatusBadge({ status }: { status: string }) {
  const config = STATUS_CONFIG[status] || {
    label: status,
    color: "bg-gray-500",
    icon: FileText,
  };
  return (
    <span className="inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium text-foreground">
      <span className={`h-2 w-2 rounded-full ${config.color}`} />
      {config.label}
    </span>
  );
}

function RecipientStatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; className: string }> = {
    PENDING: { label: "Pending", className: "text-gray-500" },
    SENT: { label: "Sent", className: "text-blue-500" },
    VIEWED: { label: "Viewed", className: "text-indigo-500" },
    SIGNED: { label: "Signed", className: "text-emerald-500" },
    DECLINED: { label: "Declined", className: "text-red-500" },
  };
  const cfg = map[status] || { label: status, className: "text-gray-400" };
  return <span className={`text-xs font-medium ${cfg.className}`}>{cfg.label}</span>;
}

// ── Tab filters ──

const TABS = [
  { key: "ALL", label: "All" },
  { key: "DRAFT", label: "Drafts" },
  { key: "SENT", label: "Sent" },
  { key: "COMPLETED", label: "Completed" },
  { key: "VOIDED", label: "Voided" },
];

// ── Main page ──

export default function ESignPageClient() {
  const router = useRouter();

  // List state
  const [envelopes, setEnvelopes] = useState<Envelope[]>([]);
  const [statusCounts, setStatusCounts] = useState<StatusCounts>({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("ALL");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Detail state
  const [selectedEnvelope, setSelectedEnvelope] = useState<Envelope | null>(
    null,
  );
  const [detailLoading, setDetailLoading] = useState(false);

  // Compose state
  const [showCompose, setShowCompose] = useState(false);

  // Void dialog
  const [voidTarget, setVoidTarget] = useState<string | null>(null);
  const [voidReason, setVoidReason] = useState("");

  // ── Fetch envelopes ──

  const fetchEnvelopes = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ page: String(page), pageSize: "20" });
      if (activeTab !== "ALL") params.set("status", activeTab);

      const res = await fetch(`/api/esign/envelopes?${params}`);
      if (!res.ok) throw new Error("Failed to fetch envelopes");

      const data = await res.json();
      setEnvelopes(data.envelopes || []);
      setStatusCounts(data.statusCounts || {});
      setTotalPages(data.totalPages || 1);
    } catch (error) {
      reportError(error as Error);
      toast.error("Failed to load envelopes");
    } finally {
      setLoading(false);
    }
  }, [page, activeTab]);

  useEffect(() => {
    fetchEnvelopes();
  }, [fetchEnvelopes]);

  // ── Fetch detail ──

  const fetchDetail = useCallback(async (id: string) => {
    try {
      setDetailLoading(true);
      const res = await fetch(`/api/esign/envelopes/${id}`);
      if (!res.ok) throw new Error("Failed to fetch envelope");
      const data = await res.json();
      setSelectedEnvelope(data);
    } catch (error) {
      reportError(error as Error);
      toast.error("Failed to load envelope details");
    } finally {
      setDetailLoading(false);
    }
  }, []);

  // ── Actions ──

  const handleSend = async (id: string) => {
    try {
      const res = await fetch(`/api/esign/envelopes/${id}/send`, {
        method: "POST",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || "Failed to send envelope");
        return;
      }
      toast.success("Envelope sent to recipients");
      fetchEnvelopes();
      if (selectedEnvelope?.id === id) fetchDetail(id);
    } catch (error) {
      reportError(error as Error);
      toast.error("Failed to send envelope");
    }
  };

  const handleRemind = async (id: string) => {
    try {
      const res = await fetch(`/api/esign/envelopes/${id}/remind`, {
        method: "POST",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || "Failed to send reminder");
        return;
      }
      toast.success("Reminder sent to pending signers");
    } catch (error) {
      reportError(error as Error);
      toast.error("Failed to send reminder");
    }
  };

  const handleVoidConfirm = async () => {
    if (!voidTarget) return;
    try {
      const res = await fetch(`/api/esign/envelopes/${voidTarget}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: voidReason || undefined }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || "Failed to void envelope");
        return;
      }
      toast.success("Envelope voided");
      setVoidTarget(null);
      setVoidReason("");
      fetchEnvelopes();
      if (selectedEnvelope?.id === voidTarget) setSelectedEnvelope(null);
    } catch (error) {
      reportError(error as Error);
      toast.error("Failed to void envelope");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/esign/envelopes/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || "Failed to delete envelope");
        return;
      }
      toast.success("Draft deleted");
      fetchEnvelopes();
      if (selectedEnvelope?.id === id) setSelectedEnvelope(null);
    } catch (error) {
      reportError(error as Error);
      toast.error("Failed to delete");
    }
  };

  // ── Compose callback ──

  const handleComposeComplete = (envelope: Envelope) => {
    setShowCompose(false);
    fetchEnvelopes();
    setSelectedEnvelope(envelope);
  };

  // Total count helper
  const totalCount = (Object.values(statusCounts) as number[]).reduce((a, b) => a + b, 0);

  // ── Render: Compose mode ──

  if (showCompose) {
    return (
      <ComposeEnvelope
        onCancel={() => setShowCompose(false)}
        onComplete={handleComposeComplete}
      />
    );
  }

  // ── Render: Detail mode ──

  if (selectedEnvelope) {
    return (
      <EnvelopeDetail
        envelope={selectedEnvelope}
        loading={detailLoading}
        onBack={() => setSelectedEnvelope(null)}
        onSend={handleSend}
        onRemind={handleRemind}
        onVoid={(id) => setVoidTarget(id)}
        onDelete={handleDelete}
        onRefresh={() => fetchDetail(selectedEnvelope.id)}
      />
    );
  }

  // ── Render: List mode ──

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            E-Signature
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Send documents for signature to anyone
          </p>
        </div>
        <Button onClick={() => setShowCompose(true)} className="gap-2">
          <Plus className="h-4 w-4" aria-hidden="true" />
          New Envelope
        </Button>
      </div>

      {/* Status tabs */}
      <div className="flex gap-1 border-b">
        {TABS.map((tab) => {
          const count =
            tab.key === "ALL"
              ? totalCount
              : statusCounts[tab.key] || 0;
          return (
            <button
              key={tab.key}
              onClick={() => {
                setActiveTab(tab.key);
                setPage(1);
              }}
              className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.key
                  ? "border-[#0066FF] text-[#0066FF]"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
              {count > 0 && (
                <span className="ml-1.5 text-xs text-muted-foreground font-mono">
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Envelope list */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-20 bg-muted animate-pulse rounded-lg"
            />
          ))}
        </div>
      ) : envelopes.length === 0 ? (
        <div className="text-center py-16">
          <PenLine
            className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4"
            aria-hidden="true"
          />
          <h3 className="text-lg font-medium">No envelopes yet</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
            Create your first envelope to send documents for signature to
            anyone — investors, partners, or vendors.
          </p>
          <Button
            onClick={() => setShowCompose(true)}
            className="mt-4 gap-2"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            New Envelope
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {envelopes.map((env: Envelope) => (
            <button
              key={env.id}
              onClick={() => fetchDetail(env.id)}
              className="w-full text-left p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium truncate">
                      {env.title}
                    </span>
                    <StatusBadge status={env.status} />
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" aria-hidden="true" />
                      {env.recipients.filter((r: Recipient) => r.role === "SIGNER").length}{" "}
                      signer
                      {env.recipients.filter((r: Recipient) => r.role === "SIGNER")
                        .length !== 1
                        ? "s"
                        : ""}
                    </span>
                    <span className="flex items-center gap-1">
                      <Mail className="h-3 w-3" aria-hidden="true" />
                      {env.recipients
                        .slice(0, 2)
                        .map((r: Recipient) => r.email)
                        .join(", ")}
                      {env.recipients.length > 2 &&
                        ` +${env.recipients.length - 2}`}
                    </span>
                    <span>
                      {new Date(env.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <ChevronRight
                  className="h-4 w-4 text-muted-foreground flex-shrink-0"
                  aria-hidden="true"
                />
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p: number) => Math.max(1, p - 1))}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground font-mono">
            {page} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p: number) => p + 1)}
          >
            Next
          </Button>
        </div>
      )}

      {/* Void confirmation dialog */}
      <AlertDialog
        open={!!voidTarget}
        onOpenChange={(open: boolean) => {
          if (!open) {
            setVoidTarget(null);
            setVoidReason("");
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Void Envelope</AlertDialogTitle>
            <AlertDialogDescription>
              This will cancel the envelope and notify all recipients. This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Input
            placeholder="Reason for voiding (optional)"
            value={voidReason}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setVoidReason(e.target.value)}
          />
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleVoidConfirm}
              className="bg-red-600 hover:bg-red-700"
            >
              Void Envelope
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Compose Envelope
// ═══════════════════════════════════════════════════════════════════════════

interface ComposeProps {
  onCancel: () => void;
  onComplete: (envelope: Envelope) => void;
}

function ComposeEnvelope({ onCancel, onComplete }: ComposeProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailMessage, setEmailMessage] = useState("");
  const [signingMode, setSigningMode] = useState<string>("SEQUENTIAL");
  const [expiresAt, setExpiresAt] = useState("");
  const [reminderEnabled, setReminderEnabled] = useState(true);
  const [reminderDays, setReminderDays] = useState(3);

  // Recipients
  const [recipients, setRecipients] = useState<
    { name: string; email: string; role: string; order: number }[]
  >([{ name: "", email: "", role: "SIGNER", order: 1 }]);

  // Document file
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const addRecipient = () => {
    setRecipients((prev) => [
      ...prev,
      {
        name: "",
        email: "",
        role: "SIGNER",
        order: prev.length + 1,
      },
    ]);
  };

  const removeRecipient = (index: number) => {
    setRecipients((prev) => {
      const next = prev.filter((_, i) => i !== index);
      return next.map((r, i) => ({ ...r, order: i + 1 }));
    });
  };

  const updateRecipient = (
    index: number,
    field: string,
    value: string | number,
  ) => {
    setRecipients((prev) =>
      prev.map((r, i) => (i === index ? { ...r, [field]: value } : r)),
    );
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      if (f.size > 25 * 1024 * 1024) {
        toast.error("File must be under 25MB");
        return;
      }
      setFile(f);
    }
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (f) {
      if (f.size > 25 * 1024 * 1024) {
        toast.error("File must be under 25MB");
        return;
      }
      setFile(f);
    }
  };

  const handleCreate = async (sendImmediately: boolean) => {
    // Validate
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }
    const validRecipients = recipients.filter(
      (r) => r.name.trim() && r.email.trim(),
    );
    if (validRecipients.length === 0) {
      toast.error("At least one recipient with name and email is required");
      return;
    }

    setSaving(true);

    try {
      // Build body
      const body: Record<string, unknown> = {
        title: title.trim(),
        description: description.trim() || undefined,
        emailSubject: emailSubject.trim() || undefined,
        emailMessage: emailMessage.trim() || undefined,
        signingMode,
        reminderEnabled,
        reminderDays,
        expiresAt: expiresAt || undefined,
        recipients: validRecipients.map((r) => ({
          name: r.name.trim(),
          email: r.email.trim().toLowerCase(),
          role: r.role,
          order: r.order,
        })),
      };

      // If file was selected, include file metadata
      if (file) {
        body.sourceFileName = file.name;
        body.sourceMimeType = file.type || "application/pdf";
        body.sourceFileSize = file.size;
      }

      // Create envelope
      const res = await fetch("/api/esign/envelopes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || "Failed to create envelope");
        return;
      }

      const envelope = await res.json();

      // If sendImmediately, send it
      if (sendImmediately) {
        const sendRes = await fetch(
          `/api/esign/envelopes/${envelope.id}/send`,
          { method: "POST" },
        );
        if (!sendRes.ok) {
          const sendData = await sendRes.json().catch(() => ({}));
          toast.error(
            sendData.error || "Envelope created but failed to send",
          );
        } else {
          toast.success("Envelope created and sent");
        }
        // Refresh detail
        const detailRes = await fetch(`/api/esign/envelopes/${envelope.id}`);
        if (detailRes.ok) {
          const updated = await detailRes.json();
          onComplete(updated);
          return;
        }
      } else {
        toast.success("Envelope saved as draft");
      }

      onComplete(envelope);
    } catch (error) {
      reportError(error as Error);
      toast.error("Failed to create envelope");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onCancel}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            New Envelope
          </h1>
          <p className="text-sm text-muted-foreground">
            Send a document for signature
          </p>
        </div>
      </div>

      {/* Document upload */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Document</CardTitle>
        </CardHeader>
        <CardContent>
          {file ? (
            <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/50">
              <FileText className="h-8 w-8 text-blue-500 flex-shrink-0" aria-hidden="true" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {(file.size / 1024 / 1024).toFixed(1)} MB
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setFile(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleFileDrop}
              className="border-2 border-dashed rounded-lg p-8 text-center hover:border-blue-400 hover:bg-blue-50/50 dark:hover:bg-blue-950/20 transition-colors cursor-pointer"
            >
              <input
                type="file"
                accept=".pdf,.docx,.doc"
                onChange={handleFileChange}
                className="hidden"
                id="doc-upload"
              />
              <label htmlFor="doc-upload" className="cursor-pointer">
                <Upload
                  className="h-8 w-8 text-muted-foreground mx-auto mb-2"
                  aria-hidden="true"
                />
                <p className="text-sm font-medium">
                  Drop a file here or click to browse
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  PDF or DOCX, up to 25 MB
                </p>
              </label>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Envelope details */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1 block">
              Envelope Title <span className="text-red-500">*</span>
            </label>
            <Input
              placeholder="e.g., NDA — Acme Corp"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={200}
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">
              Description
            </label>
            <Input
              placeholder="Optional internal description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={500}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block">
                Email Subject
              </label>
              <Input
                placeholder="Please sign this document"
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                maxLength={200}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">
                Signing Mode
              </label>
              <Select value={signingMode} onValueChange={setSigningMode}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SEQUENTIAL">
                    Sequential — one at a time
                  </SelectItem>
                  <SelectItem value="PARALLEL">
                    Parallel — all at once
                  </SelectItem>
                  <SelectItem value="MIXED">
                    Mixed — group-based order
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">
              Email Message
            </label>
            <textarea
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              placeholder="Optional message to include in the signing email"
              value={emailMessage}
              onChange={(e) => setEmailMessage(e.target.value)}
              maxLength={2000}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block">
                Expiration Date
              </label>
              <Input
                type="date"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
              />
            </div>
            <div className="flex items-center gap-3 pt-6">
              <input
                type="checkbox"
                id="reminders"
                checked={reminderEnabled}
                onChange={(e) => setReminderEnabled(e.target.checked)}
                className="h-4 w-4 rounded border-input"
              />
              <label htmlFor="reminders" className="text-sm">
                Send reminders every{" "}
                <input
                  type="number"
                  min={1}
                  max={14}
                  value={reminderDays}
                  onChange={(e) =>
                    setReminderDays(Math.max(1, Math.min(14, Number(e.target.value))))
                  }
                  className="w-12 rounded border border-input bg-background px-2 py-0.5 text-sm text-center font-mono mx-1"
                />{" "}
                days
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recipients */}
      <Card>
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-base">Recipients</CardTitle>
          <Button variant="outline" size="sm" onClick={addRecipient}>
            <Plus className="h-3 w-3 mr-1" aria-hidden="true" />
            Add
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {recipients.map((r, idx) => (
            <div
              key={idx}
              className="flex items-start gap-2 p-3 rounded-lg border bg-muted/30"
            >
              <div className="text-xs text-muted-foreground font-mono pt-2 w-5 text-center flex-shrink-0">
                {idx + 1}
              </div>
              <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2">
                <Input
                  placeholder="Full name"
                  value={r.name}
                  onChange={(e) =>
                    updateRecipient(idx, "name", e.target.value)
                  }
                />
                <Input
                  placeholder="email@example.com"
                  type="email"
                  value={r.email}
                  onChange={(e) =>
                    updateRecipient(idx, "email", e.target.value)
                  }
                />
                <Select
                  value={r.role}
                  onValueChange={(v) => updateRecipient(idx, "role", v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SIGNER">Signer</SelectItem>
                    <SelectItem value="CC">CC (copy)</SelectItem>
                    <SelectItem value="CERTIFIED_DELIVERY">
                      Certified Delivery
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {recipients.length > 1 && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="flex-shrink-0 mt-0.5"
                  onClick={() => removeRecipient(idx)}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
          {signingMode === "SEQUENTIAL" && recipients.length > 1 && (
            <p className="text-xs text-muted-foreground">
              Recipients will sign in the order listed above (top to bottom).
            </p>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex items-center gap-3 pt-2">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          variant="outline"
          disabled={saving}
          onClick={() => handleCreate(false)}
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <FileText className="h-4 w-4 mr-2" aria-hidden="true" />
          )}
          Save as Draft
        </Button>
        <Button disabled={saving} onClick={() => handleCreate(true)}>
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Send className="h-4 w-4 mr-2" aria-hidden="true" />
          )}
          Send Now
        </Button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Envelope Detail
// ═══════════════════════════════════════════════════════════════════════════

interface DetailProps {
  envelope: Envelope;
  loading: boolean;
  onBack: () => void;
  onSend: (id: string) => void;
  onRemind: (id: string) => void;
  onVoid: (id: string) => void;
  onDelete: (id: string) => void;
  onRefresh: () => void;
}

function EnvelopeDetail({
  envelope,
  loading,
  onBack,
  onSend,
  onRemind,
  onVoid,
  onDelete,
  onRefresh,
}: DetailProps) {
  const signers = envelope.recipients.filter((r) => r.role === "SIGNER");
  const ccRecipients = envelope.recipients.filter((r) => r.role !== "SIGNER");
  const signedCount = signers.filter((r) => r.status === "SIGNED").length;
  const isDraft =
    envelope.status === "DRAFT" || envelope.status === "PREPARING";
  const isActive = ["SENT", "VIEWED", "PARTIALLY_SIGNED"].includes(
    envelope.status,
  );
  const isTerminal = ["COMPLETED", "VOIDED", "DECLINED", "EXPIRED"].includes(
    envelope.status,
  );

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold truncate">
              {envelope.title}
            </h1>
            <StatusBadge status={envelope.status} />
          </div>
          {envelope.description && (
            <p className="text-sm text-muted-foreground mt-0.5">
              {envelope.description}
            </p>
          )}
        </div>
      </div>

      {/* Action bar */}
      <div className="flex items-center gap-2 flex-wrap">
        {isDraft && (
          <Button size="sm" onClick={() => onSend(envelope.id)} className="gap-1.5">
            <Send className="h-3.5 w-3.5" aria-hidden="true" />
            Send
          </Button>
        )}
        {isActive && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => onRemind(envelope.id)}
            className="gap-1.5"
          >
            <Bell className="h-3.5 w-3.5" aria-hidden="true" />
            Send Reminder
          </Button>
        )}
        {isActive && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => onVoid(envelope.id)}
            className="gap-1.5 text-red-600 hover:text-red-700"
          >
            <XCircle className="h-3.5 w-3.5" aria-hidden="true" />
            Void
          </Button>
        )}
        {isDraft && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => onDelete(envelope.id)}
            className="gap-1.5 text-red-600 hover:text-red-700"
          >
            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
            Delete Draft
          </Button>
        )}
      </div>

      {/* Progress (for active envelopes) */}
      {signers.length > 0 && !isDraft && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Signing Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3 mb-3">
              <div className="flex-1 bg-muted rounded-full h-2.5 overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all"
                  style={{
                    width: `${signers.length > 0 ? (signedCount / signers.length) * 100 : 0}%`,
                  }}
                />
              </div>
              <span className="text-sm font-mono text-muted-foreground">
                {signedCount}/{signers.length}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium text-foreground">
                {envelope.signingMode === "SEQUENTIAL"
                  ? "Sequential"
                  : envelope.signingMode === "PARALLEL"
                    ? "Parallel"
                    : "Mixed"}
              </span>
              {envelope.sentAt && (
                <span>
                  Sent {new Date(envelope.sentAt).toLocaleDateString()}
                </span>
              )}
              {envelope.completedAt && (
                <span className="text-emerald-600 font-medium">
                  Completed{" "}
                  {new Date(envelope.completedAt).toLocaleDateString()}
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Signers */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">
            Signers ({signers.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {signers.map((r, idx) => (
            <div
              key={r.id || idx}
              className="flex items-center gap-3 p-3 rounded-lg border"
            >
              <div className="text-xs font-mono text-muted-foreground w-5 text-center flex-shrink-0">
                {r.order}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{r.name}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {r.email}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {r.viewedAt && (
                  <span className="text-xs text-muted-foreground">
                    Viewed {new Date(r.viewedAt).toLocaleDateString()}
                  </span>
                )}
                {r.signedAt && (
                  <span className="text-xs text-emerald-600">
                    Signed {new Date(r.signedAt).toLocaleDateString()}
                  </span>
                )}
                <RecipientStatusBadge status={r.status || "PENDING"} />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* CC Recipients */}
      {ccRecipients.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">
              CC Recipients ({ccRecipients.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {ccRecipients.map((r, idx) => (
              <div
                key={r.id || idx}
                className="flex items-center gap-3 p-2 text-sm"
              >
                <Mail
                  className="h-4 w-4 text-muted-foreground flex-shrink-0"
                  aria-hidden="true"
                />
                <span className="font-medium">{r.name}</span>
                <span className="text-muted-foreground">{r.email}</span>
                <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium text-foreground ml-auto">
                  {r.role === "CC" ? "CC" : "Certified"}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Metadata */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Details</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 gap-y-2 gap-x-4 text-sm">
            <dt className="text-muted-foreground">Created</dt>
            <dd>{new Date(envelope.createdAt).toLocaleString()}</dd>
            {envelope.createdBy && (
              <>
                <dt className="text-muted-foreground">Created by</dt>
                <dd>{envelope.createdBy.name || envelope.createdBy.email}</dd>
              </>
            )}
            {envelope.sourceFileName && (
              <>
                <dt className="text-muted-foreground">Document</dt>
                <dd className="truncate">{envelope.sourceFileName}</dd>
              </>
            )}
            {envelope.emailSubject && (
              <>
                <dt className="text-muted-foreground">Email subject</dt>
                <dd className="truncate">{envelope.emailSubject}</dd>
              </>
            )}
            {envelope.expiresAt && (
              <>
                <dt className="text-muted-foreground">Expires</dt>
                <dd>{new Date(envelope.expiresAt).toLocaleDateString()}</dd>
              </>
            )}
            <dt className="text-muted-foreground">Reminders</dt>
            <dd>
              {envelope.reminderEnabled
                ? `Every ${envelope.reminderDays} days`
                : "Disabled"}
            </dd>
          </dl>
        </CardContent>
      </Card>
    </div>
  );
}
