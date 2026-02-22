"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  Clock,
  DollarSign,
  Eye,
  FileText,
  Loader2,
  Plus,
  ShieldCheck,
  XCircle,
  AlertTriangle,
  Upload,
  Search,
  Filter,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import { Textarea } from "@/components/ui/textarea";
import { useTeam } from "@/context/team-context";

// ============================================================================
// Types
// ============================================================================

type ManualInvestment = {
  id: string;
  investorId: string;
  fundId: string;
  documentType: string;
  documentTitle: string;
  documentNumber: string | null;
  commitmentAmount: string;
  fundedAmount: string;
  unfundedAmount: string | null;
  units: string | null;
  shares: string | null;
  pricePerUnit: string | null;
  ownershipPercent: string | null;
  signedDate: string;
  effectiveDate: string | null;
  fundedDate: string | null;
  transferMethod: string | null;
  transferStatus: string;
  transferRef: string | null;
  bankName: string | null;
  accountLast4: string | null;
  status: string;
  isVerified: boolean;
  verifiedBy: string | null;
  verifiedAt: string | null;
  proofStatus: string;
  proofFileName: string | null;
  proofUploadedAt: string | null;
  proofVerifiedAt: string | null;
  proofRejectedAt: string | null;
  proofRejectionReason: string | null;
  proofNotes: string | null;
  notes: string | null;
  createdAt: string;
  investor: {
    id: string;
    user: { name: string | null; email: string };
  };
  fund: { id: string; name: string };
};

type Fund = { id: string; name: string };

// ============================================================================
// Constants
// ============================================================================

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Draft",
  ACTIVE: "Active",
  SUBMITTED: "Submitted",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  CANCELLED: "Cancelled",
};

const PROOF_STATUS_LABELS: Record<string, string> = {
  NOT_UPLOADED: "No Proof",
  UPLOADED: "Proof Uploaded",
  VERIFIED: "Proof Verified",
  REJECTED: "Proof Rejected",
  RECEIVED: "Proof Received",
  PENDING: "Pending Review",
  NOT_REQUIRED: "Not Required",
};

const PROOF_STATUS_COLORS: Record<string, string> = {
  NOT_UPLOADED: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  UPLOADED: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  VERIFIED: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
  REJECTED: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  RECEIVED: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  PENDING: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  NOT_REQUIRED: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
};

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  ACTIVE: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  SUBMITTED: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  APPROVED: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
  REJECTED: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  CANCELLED: "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400",
};

type TabKey = "all" | "needs_review" | "proof_uploaded" | "verified" | "rejected";

const TABS: { key: TabKey; label: string }[] = [
  { key: "all", label: "All" },
  { key: "needs_review", label: "Needs Review" },
  { key: "proof_uploaded", label: "Proof Uploaded" },
  { key: "verified", label: "Verified" },
  { key: "rejected", label: "Rejected" },
];

// ============================================================================
// Helpers
// ============================================================================

function formatCurrency(value: string | number | null | undefined): string {
  if (value == null) return "$0.00";
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num)) return "$0.00";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
}

function filterByTab(investments: ManualInvestment[], tab: TabKey): ManualInvestment[] {
  switch (tab) {
    case "needs_review":
      return investments.filter(
        (i) =>
          !i.isVerified ||
          i.status === "SUBMITTED" ||
          i.status === "DRAFT",
      );
    case "proof_uploaded":
      return investments.filter(
        (i) =>
          i.proofStatus === "UPLOADED" ||
          i.proofStatus === "PENDING" ||
          i.proofStatus === "RECEIVED",
      );
    case "verified":
      return investments.filter(
        (i) => i.isVerified && i.proofStatus === "VERIFIED",
      );
    case "rejected":
      return investments.filter(
        (i) =>
          i.status === "REJECTED" || i.proofStatus === "REJECTED",
      );
    default:
      return investments;
  }
}

// ============================================================================
// Component
// ============================================================================

export default function ManualInvestmentPageClient() {
  const router = useRouter();
  const teamInfo = useTeam();
  const teamId = teamInfo?.currentTeam?.id;

  const [investments, setInvestments] = useState<ManualInvestment[]>([]);
  const [funds, setFunds] = useState<Fund[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [fundFilter, setFundFilter] = useState("all");

  // Modal states
  const [verifyProofModal, setVerifyProofModal] = useState<ManualInvestment | null>(null);
  const [rejectProofModal, setRejectProofModal] = useState<ManualInvestment | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [verifyDocModal, setVerifyDocModal] = useState<ManualInvestment | null>(null);
  const [detailModal, setDetailModal] = useState<ManualInvestment | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Fetch investments
  const fetchInvestments = useCallback(async () => {
    if (!teamId) return;
    setLoading(true);
    try {
      const [investmentsRes, fundsRes] = await Promise.all([
        fetch("/api/admin/manual-investment"),
        fetch(`/api/teams/${teamId}/funds`),
      ]);

      if (investmentsRes.ok) {
        const data = await investmentsRes.json();
        setInvestments(data.investments || []);
      }

      if (fundsRes.ok) {
        const data = await fundsRes.json();
        setFunds(data.funds || []);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load investment records");
    } finally {
      setLoading(false);
    }
  }, [teamId]);

  useEffect(() => {
    fetchInvestments();
  }, [fetchInvestments]);

  // Filter + search
  const filtered = filterByTab(investments, activeTab).filter((inv) => {
    // Fund filter
    if (fundFilter !== "all" && inv.fundId !== fundFilter) return false;
    // Search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const name = inv.investor?.user?.name?.toLowerCase() || "";
      const email = inv.investor?.user?.email?.toLowerCase() || "";
      const title = inv.documentTitle?.toLowerCase() || "";
      return name.includes(q) || email.includes(q) || title.includes(q);
    }
    return true;
  });

  // Counts
  const counts = {
    all: investments.length,
    needs_review: filterByTab(investments, "needs_review").length,
    proof_uploaded: filterByTab(investments, "proof_uploaded").length,
    verified: filterByTab(investments, "verified").length,
    rejected: filterByTab(investments, "rejected").length,
  };

  // Actions
  const handleVerifyDocument = async (inv: ManualInvestment) => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/manual-investment/${inv.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isVerified: true, status: "APPROVED" }),
      });
      if (!res.ok) {
        const { error } = await res.json();
        toast.error(error || "Failed to verify document");
        return;
      }
      toast.success("Document verified successfully");
      setVerifyDocModal(null);
      await fetchInvestments();
    } catch {
      toast.error("Error verifying document");
    } finally {
      setActionLoading(false);
    }
  };

  const handleVerifyProof = async (inv: ManualInvestment) => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/manual-investment/${inv.id}/verify-proof`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "verify" }),
      });
      if (!res.ok) {
        const { error } = await res.json();
        toast.error(error || "Failed to verify proof");
        return;
      }
      toast.success("Wire proof verified successfully");
      setVerifyProofModal(null);
      await fetchInvestments();
    } catch {
      toast.error("Error verifying proof");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectProof = async (inv: ManualInvestment) => {
    if (!rejectReason.trim()) {
      toast.error("Please provide a rejection reason");
      return;
    }
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/manual-investment/${inv.id}/verify-proof`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reject", reason: rejectReason.trim() }),
      });
      if (!res.ok) {
        const { error } = await res.json();
        toast.error(error || "Failed to reject proof");
        return;
      }
      toast.success("Wire proof rejected");
      setRejectProofModal(null);
      setRejectReason("");
      await fetchInvestments();
    } catch {
      toast.error("Error rejecting proof");
    } finally {
      setActionLoading(false);
    }
  };

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Manual Investments</h1>
          <p className="text-sm text-muted-foreground">
            Review, verify, and confirm off-platform investments and wire proofs.
          </p>
        </div>
        <Button onClick={() => router.push("/admin/manual-investment/new")}>
          <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
          Add Investment
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-blue-50 p-2 dark:bg-blue-900/20">
                <FileText className="h-5 w-5 text-blue-600" aria-hidden="true" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Records</p>
                <p className="text-2xl font-bold font-mono tabular-nums">
                  {investments.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-amber-50 p-2 dark:bg-amber-900/20">
                <Clock className="h-5 w-5 text-amber-600" aria-hidden="true" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Needs Review</p>
                <p className="text-2xl font-bold font-mono tabular-nums">
                  {counts.needs_review}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-purple-50 p-2 dark:bg-purple-900/20">
                <Upload className="h-5 w-5 text-purple-600" aria-hidden="true" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Proof Uploaded</p>
                <p className="text-2xl font-bold font-mono tabular-nums">
                  {counts.proof_uploaded}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-emerald-50 p-2 dark:bg-emerald-900/20">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" aria-hidden="true" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Verified</p>
                <p className="text-2xl font-bold font-mono tabular-nums">
                  {counts.verified}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs + Filters */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            {/* Tabs */}
            <div className="flex gap-1 overflow-x-auto">
              {TABS.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-colors min-h-[36px] ${
                    activeTab === tab.key
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {tab.label}
                  {counts[tab.key] > 0 && (
                    <span className="ml-1.5 inline-flex items-center justify-center rounded-full bg-white/20 px-1.5 text-xs">
                      {counts[tab.key]}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Search + Fund Filter */}
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" aria-hidden="true" />
                <Input
                  placeholder="Search investor or title..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-[220px]"
                />
              </div>
              {funds.length > 1 && (
                <Select value={fundFilter} onValueChange={setFundFilter}>
                  <SelectTrigger className="w-[180px]" aria-label="Filter by fund">
                    <Filter className="mr-2 h-4 w-4" aria-hidden="true" />
                    <SelectValue placeholder="All Funds" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Funds</SelectItem>
                    {funds.map((f) => (
                      <SelectItem key={f.id} value={f.id}>
                        {f.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <FileText className="h-12 w-12 text-muted-foreground/30 mb-4" aria-hidden="true" />
              <p className="text-lg font-medium text-muted-foreground">
                {investments.length === 0
                  ? "No manual investments yet"
                  : "No investments match your filters"}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {investments.length === 0
                  ? "Add an off-platform investment record to get started."
                  : "Try adjusting your search or tab filter."}
              </p>
              {investments.length === 0 && (
                <Button
                  className="mt-4"
                  onClick={() => router.push("/admin/manual-investment/new")}
                >
                  <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
                  Add Investment
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((inv) => (
                <InvestmentRow
                  key={inv.id}
                  investment={inv}
                  onViewDetails={() => setDetailModal(inv)}
                  onVerifyDoc={() => setVerifyDocModal(inv)}
                  onVerifyProof={() => setVerifyProofModal(inv)}
                  onRejectProof={() => {
                    setRejectProofModal(inv);
                    setRejectReason("");
                  }}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Verify Document Confirmation Modal */}
      <Dialog open={!!verifyDocModal} onOpenChange={() => setVerifyDocModal(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-emerald-600" aria-hidden="true" />
              Verify Document
            </DialogTitle>
            <DialogDescription>
              Confirm that you have reviewed and verified the document for{" "}
              <strong>
                {verifyDocModal?.investor?.user?.name ||
                  verifyDocModal?.investor?.user?.email}
              </strong>
              .
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Document</span>
              <span className="font-medium">{verifyDocModal?.documentTitle}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Fund</span>
              <span className="font-medium">{verifyDocModal?.fund?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Amount</span>
              <span className="font-medium font-mono tabular-nums">
                {formatCurrency(verifyDocModal?.commitmentAmount)}
              </span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setVerifyDocModal(null)}>
              Cancel
            </Button>
            <Button
              onClick={() => verifyDocModal && handleVerifyDocument(verifyDocModal)}
              disabled={actionLoading}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {actionLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <ShieldCheck className="mr-2 h-4 w-4" aria-hidden="true" />
              )}
              Verify Document
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Verify Proof Confirmation Modal */}
      <Dialog open={!!verifyProofModal} onOpenChange={() => setVerifyProofModal(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" aria-hidden="true" />
              Verify Wire Proof
            </DialogTitle>
            <DialogDescription>
              Confirm that the wire proof from{" "}
              <strong>
                {verifyProofModal?.investor?.user?.name ||
                  verifyProofModal?.investor?.user?.email}
              </strong>{" "}
              has been verified. This will mark the transfer as completed.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Proof File</span>
              <span className="font-medium">{verifyProofModal?.proofFileName || "—"}</span>
            </div>
            {verifyProofModal?.proofNotes && (
              <div>
                <span className="text-muted-foreground">LP Notes</span>
                <p className="mt-1 text-sm bg-muted/50 rounded p-2">
                  {verifyProofModal.proofNotes}
                </p>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Commitment</span>
              <span className="font-medium font-mono tabular-nums">
                {formatCurrency(verifyProofModal?.commitmentAmount)}
              </span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setVerifyProofModal(null)}>
              Cancel
            </Button>
            <Button
              onClick={() => verifyProofModal && handleVerifyProof(verifyProofModal)}
              disabled={actionLoading}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {actionLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="mr-2 h-4 w-4" aria-hidden="true" />
              )}
              Verify Proof
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Proof Modal */}
      <Dialog open={!!rejectProofModal} onOpenChange={() => setRejectProofModal(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-600" aria-hidden="true" />
              Reject Wire Proof
            </DialogTitle>
            <DialogDescription>
              Provide a reason for rejecting the wire proof from{" "}
              <strong>
                {rejectProofModal?.investor?.user?.name ||
                  rejectProofModal?.investor?.user?.email}
              </strong>
              .
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Proof File</span>
              <span className="font-medium">{rejectProofModal?.proofFileName || "—"}</span>
            </div>
            <div>
              <label htmlFor="reject-reason" className="text-sm font-medium">
                Rejection Reason *
              </label>
              <Textarea
                id="reject-reason"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="e.g., Amount does not match commitment, proof is unreadable..."
                rows={3}
                className="mt-1.5"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectProofModal(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => rejectProofModal && handleRejectProof(rejectProofModal)}
              disabled={actionLoading || !rejectReason.trim()}
            >
              {actionLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <XCircle className="mr-2 h-4 w-4" aria-hidden="true" />
              )}
              Reject Proof
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Modal */}
      <Dialog open={!!detailModal} onOpenChange={() => setDetailModal(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Investment Details</DialogTitle>
            <DialogDescription>
              {detailModal?.documentTitle}
            </DialogDescription>
          </DialogHeader>
          {detailModal && <InvestmentDetail investment={detailModal} />}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailModal(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ============================================================================
// Sub-components
// ============================================================================

function InvestmentRow({
  investment: inv,
  onViewDetails,
  onVerifyDoc,
  onVerifyProof,
  onRejectProof,
}: {
  investment: ManualInvestment;
  onViewDetails: () => void;
  onVerifyDoc: () => void;
  onVerifyProof: () => void;
  onRejectProof: () => void;
}) {
  const needsDocVerification = !inv.isVerified;
  const hasProofToReview =
    inv.proofStatus === "UPLOADED" ||
    inv.proofStatus === "PENDING" ||
    inv.proofStatus === "RECEIVED";

  return (
    <div className="rounded-lg border p-4 hover:bg-muted/30 transition-colors">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Left: Investor + Details */}
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium truncate">
              {inv.investor?.user?.name || inv.investor?.user?.email}
            </span>
            <Badge variant="outline" className="text-xs">
              {inv.fund?.name}
            </Badge>
          </div>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span className="font-mono tabular-nums">
              {formatCurrency(inv.commitmentAmount)}
            </span>
            <span className="hidden sm:inline">|</span>
            <span className="hidden sm:inline">{inv.documentTitle}</span>
            <span className="hidden sm:inline">|</span>
            <span className="hidden sm:inline">
              {format(new Date(inv.signedDate), "MMM d, yyyy")}
            </span>
          </div>
          {/* Status badges */}
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                STATUS_COLORS[inv.status] || STATUS_COLORS.DRAFT
              }`}
            >
              {STATUS_LABELS[inv.status] || inv.status}
            </span>
            <span
              className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                PROOF_STATUS_COLORS[inv.proofStatus] || PROOF_STATUS_COLORS.NOT_UPLOADED
              }`}
            >
              {PROOF_STATUS_LABELS[inv.proofStatus] || inv.proofStatus}
            </span>
            {inv.isVerified && (
              <span className="inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
                <ShieldCheck className="h-3 w-3" aria-hidden="true" />
                Doc Verified
              </span>
            )}
            {inv.proofRejectionReason && inv.proofStatus === "REJECTED" && (
              <span className="inline-flex items-center gap-1 text-xs text-red-600 dark:text-red-400">
                <AlertTriangle className="h-3 w-3" aria-hidden="true" />
                {inv.proofRejectionReason}
              </span>
            )}
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={onViewDetails}
            className="min-h-[36px]"
          >
            <Eye className="h-4 w-4" aria-hidden="true" />
            <span className="sr-only sm:not-sr-only sm:ml-1.5">Details</span>
          </Button>

          {needsDocVerification && (
            <Button
              variant="outline"
              size="sm"
              onClick={onVerifyDoc}
              className="min-h-[36px] text-emerald-700 border-emerald-300 hover:bg-emerald-50 dark:text-emerald-400 dark:border-emerald-800 dark:hover:bg-emerald-900/20"
            >
              <ShieldCheck className="h-4 w-4 sm:mr-1.5" aria-hidden="true" />
              <span className="sr-only sm:not-sr-only">Verify Doc</span>
            </Button>
          )}

          {hasProofToReview && (
            <>
              <Button
                size="sm"
                onClick={onVerifyProof}
                className="min-h-[36px] bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <CheckCircle2 className="h-4 w-4 sm:mr-1.5" aria-hidden="true" />
                <span className="sr-only sm:not-sr-only">Confirm</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={onRejectProof}
                className="min-h-[36px] text-red-700 border-red-300 hover:bg-red-50 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-900/20"
              >
                <XCircle className="h-4 w-4 sm:mr-1.5" aria-hidden="true" />
                <span className="sr-only sm:not-sr-only">Reject</span>
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function InvestmentDetail({ investment: inv }: { investment: ManualInvestment }) {
  const rows: { label: string; value: React.ReactNode }[] = [
    {
      label: "Investor",
      value: inv.investor?.user?.name || inv.investor?.user?.email,
    },
    { label: "Fund", value: inv.fund?.name },
    { label: "Document", value: inv.documentTitle },
    { label: "Document Type", value: inv.documentType },
    {
      label: "Commitment",
      value: (
        <span className="font-mono tabular-nums">
          {formatCurrency(inv.commitmentAmount)}
        </span>
      ),
    },
    {
      label: "Funded",
      value: (
        <span className="font-mono tabular-nums">
          {formatCurrency(inv.fundedAmount)}
        </span>
      ),
    },
    {
      label: "Signed",
      value: format(new Date(inv.signedDate), "MMM d, yyyy"),
    },
    {
      label: "Status",
      value: (
        <span
          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
            STATUS_COLORS[inv.status] || STATUS_COLORS.DRAFT
          }`}
        >
          {STATUS_LABELS[inv.status] || inv.status}
        </span>
      ),
    },
    {
      label: "Doc Verified",
      value: inv.isVerified ? (
        <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
          <ShieldCheck className="h-4 w-4" aria-hidden="true" />
          Yes
          {inv.verifiedAt && (
            <span className="text-muted-foreground ml-1">
              ({format(new Date(inv.verifiedAt), "MMM d, yyyy")})
            </span>
          )}
        </span>
      ) : (
        <span className="text-amber-600 dark:text-amber-400">Not verified</span>
      ),
    },
    {
      label: "Proof Status",
      value: (
        <span
          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
            PROOF_STATUS_COLORS[inv.proofStatus] || PROOF_STATUS_COLORS.NOT_UPLOADED
          }`}
        >
          {PROOF_STATUS_LABELS[inv.proofStatus] || inv.proofStatus}
        </span>
      ),
    },
  ];

  if (inv.proofFileName) {
    rows.push({ label: "Proof File", value: inv.proofFileName });
  }
  if (inv.proofNotes) {
    rows.push({ label: "Proof Notes", value: inv.proofNotes });
  }
  if (inv.proofRejectionReason) {
    rows.push({
      label: "Rejection Reason",
      value: (
        <span className="text-red-600 dark:text-red-400">
          {inv.proofRejectionReason}
        </span>
      ),
    });
  }
  if (inv.transferMethod) {
    rows.push({ label: "Transfer Method", value: inv.transferMethod });
  }
  if (inv.transferRef) {
    rows.push({ label: "Transfer Ref", value: inv.transferRef });
  }
  if (inv.bankName) {
    rows.push({ label: "Bank", value: inv.bankName });
  }
  if (inv.notes) {
    rows.push({ label: "Notes", value: inv.notes });
  }

  return (
    <div className="space-y-2">
      {rows.map((row, i) => (
        <div key={i} className="flex justify-between gap-4 text-sm py-1 border-b border-border/50 last:border-0">
          <span className="text-muted-foreground flex-shrink-0">{row.label}</span>
          <span className="font-medium text-right">{row.value}</span>
        </div>
      ))}
    </div>
  );
}
