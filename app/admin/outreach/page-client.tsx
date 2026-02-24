"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Send, Lock } from "lucide-react";
import { useTier } from "@/lib/hooks/use-tier";

import type { Tab } from "./types";
import { TABS } from "./types";
import {
  FollowUpQueueTab,
  SequencesTab,
  TemplatesTab,
  BulkSendTab,
} from "./sections";

// ---------------------------------------------------------------------------
// Orchestrator
// ---------------------------------------------------------------------------

export default function OutreachClient() {
  const { tier, aiCrmEnabled, limits, isLoading: tierLoading } = useTier();
  const [activeTab, setActiveTab] = useState<Tab>("queue");

  // Check URL for tab param
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get("tab");
    if (tab && TABS.some((t) => t.key === tab)) {
      setActiveTab(tab as Tab);
    }
  }, []);

  const isPaid = tier === "CRM_PRO" || tier === "FUNDROOM";

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Send className="h-6 w-6 text-[#0066FF]" aria-hidden="true" />
            Outreach Center
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage email sequences, templates, and follow-ups
          </p>
        </div>
      </div>

      {/* Tab navigation */}
      <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide border-b border-border pb-px">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          const isLocked = (tab.key === "sequences" || tab.key === "bulk") && !isPaid && !tierLoading;
          return (
            <button
              key={tab.key}
              onClick={() => {
                if (isLocked) {
                  toast.info("Upgrade to CRM Pro for email sequences and bulk send", {
                    action: {
                      label: "Upgrade",
                      onClick: () => window.location.assign("/admin/settings?tab=organization"),
                    },
                  });
                  return;
                }
                setActiveTab(tab.key);
              }}
              className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors border-b-2 -mb-px ${
                isActive
                  ? "text-[#0066FF] border-[#0066FF]"
                  : isLocked
                    ? "text-muted-foreground/50 border-transparent cursor-default"
                    : "text-muted-foreground border-transparent hover:text-foreground hover:border-border"
              }`}
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              {tab.label}
              {isLocked && <Lock className="h-3 w-3 ml-0.5" aria-hidden="true" />}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      {activeTab === "queue" && <FollowUpQueueTab />}
      {activeTab === "sequences" && <SequencesTab aiEnabled={!!aiCrmEnabled} />}
      {activeTab === "templates" && <TemplatesTab />}
      {activeTab === "bulk" && <BulkSendTab />}
    </div>
  );
}
