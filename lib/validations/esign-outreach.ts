import { z } from "zod";

/**
 * E-Signature / Outreach / Marketplace Validation Schemas
 *
 * Shared Zod schemas for envelope management, outreach sequences/templates,
 * marketplace deals, and related operations.
 */

const MAX_AMOUNT = 100_000_000_000;

// ---------------------------------------------------------------------------
// E-Signature Envelopes
// ---------------------------------------------------------------------------

export const EnvelopeUpdateSchema = z.object({
  title: z.string().max(255).optional(),
  description: z.string().max(5000).optional().nullable(),
  emailSubject: z.string().max(255).optional().nullable(),
  message: z.string().max(5000).optional().nullable(),
  signingMode: z.enum(["SEQUENTIAL", "PARALLEL", "MIXED"]).optional(),
  status: z.string().max(50).optional(),
  expiresAt: z.string().max(30).optional().nullable(),
  reminderEnabled: z.boolean().optional(),
  reminderDays: z.coerce.number().int().min(1).max(30).optional(),
});
export type EnvelopeUpdateInput = z.infer<typeof EnvelopeUpdateSchema>;

// ---------------------------------------------------------------------------
// Outreach Sequences
// ---------------------------------------------------------------------------

export const SequenceUpdateSchema = z.object({
  name: z.string().max(200).optional(),
  description: z.string().max(2000).optional().nullable(),
  status: z.enum(["ACTIVE", "PAUSED", "DRAFT", "ARCHIVED"]).optional(),
  isActive: z.boolean().optional(),
  steps: z.array(z.object({
    order: z.coerce.number().int().min(0),
    type: z.string().max(50),
    subject: z.string().max(500).optional(),
    body: z.string().max(50_000).optional(),
    delayDays: z.coerce.number().int().min(0).max(365).optional(),
    templateId: z.string().max(100).optional().nullable(),
    aiPrompt: z.string().max(5000).optional().nullable(),
    condition: z.string().max(50).optional().nullable(),
  })).max(20).optional(),
});
export type SequenceUpdateInput = z.infer<typeof SequenceUpdateSchema>;

// ---------------------------------------------------------------------------
// Outreach Templates
// ---------------------------------------------------------------------------

export const OutreachTemplateUpdateSchema = z.object({
  name: z.string().max(200).optional(),
  subject: z.string().max(500).optional(),
  body: z.string().max(50_000).optional(),
  category: z.string().max(100).optional().nullable(),
});
export type OutreachTemplateUpdateInput = z.infer<typeof OutreachTemplateUpdateSchema>;

// ---------------------------------------------------------------------------
// Marketplace Deals
// ---------------------------------------------------------------------------

export const DealUpdateSchema = z.object({
  name: z.string().max(255).optional(),
  description: z.string().max(5000).optional().nullable(),
  stage: z.string().max(50).optional(),
  targetAmount: z.coerce.number().min(0).max(MAX_AMOUNT).optional(),
  minimumInvestment: z.coerce.number().min(0).max(MAX_AMOUNT).optional(),
  industry: z.string().max(100).optional().nullable(),
  geography: z.string().max(100).optional().nullable(),
  closingDate: z.string().max(30).optional().nullable(),
  tags: z.array(z.string().max(100)).max(50).optional(),
});
export type DealUpdateInput = z.infer<typeof DealUpdateSchema>;

// ---------------------------------------------------------------------------
// Deal Allocations
// ---------------------------------------------------------------------------

export const DealAllocationSchema = z.object({
  investorId: z.string().max(100).optional(),
  contactId: z.string().max(100).optional(),
  amount: z.coerce.number().min(0).max(MAX_AMOUNT),
  status: z.string().max(50).optional(),
  notes: z.string().max(2000).optional().nullable(),
});
export type DealAllocationInput = z.infer<typeof DealAllocationSchema>;

// ---------------------------------------------------------------------------
// Deal Documents
// ---------------------------------------------------------------------------

export const DealDocumentSchema = z.object({
  title: z.string().min(1, "Title is required").max(255),
  documentType: z.string().max(50).optional(),
  url: z.string().max(2048).optional(),
  storageKey: z.string().max(500).optional(),
  notes: z.string().max(2000).optional().nullable(),
});
export type DealDocumentInput = z.infer<typeof DealDocumentSchema>;

// ---------------------------------------------------------------------------
// Deal Interest
// ---------------------------------------------------------------------------

export const DealInterestSchema = z.object({
  investorId: z.string().max(100).optional(),
  contactId: z.string().max(100).optional(),
  amount: z.coerce.number().min(0).max(MAX_AMOUNT).optional(),
  interestLevel: z.string().max(50).optional(),
  notes: z.string().max(2000).optional().nullable(),
});
export type DealInterestInput = z.infer<typeof DealInterestSchema>;

// ---------------------------------------------------------------------------
// Deal Listing (Marketplace)
// ---------------------------------------------------------------------------

export const DealListingSchema = z.object({
  title: z.string().max(255).optional(),
  description: z.string().max(5000).optional().nullable(),
  category: z.string().max(100).optional(),
  minimumInvestment: z.coerce.number().min(0).max(MAX_AMOUNT).optional(),
  targetAmount: z.coerce.number().min(0).max(MAX_AMOUNT).optional(),
  isPublic: z.boolean().optional(),
  tags: z.array(z.string().max(100)).max(50).optional(),
});
export type DealListingInput = z.infer<typeof DealListingSchema>;

// ---------------------------------------------------------------------------
// Deal Notes
// ---------------------------------------------------------------------------

export const DealNoteSchema = z.object({
  content: z.string().min(1, "Note content is required").max(5000),
  isInternal: z.boolean().optional(),
});
export type DealNoteInput = z.infer<typeof DealNoteSchema>;

// ---------------------------------------------------------------------------
// Offering
// ---------------------------------------------------------------------------

export const OfferingSchema = z.object({
  title: z.string().max(255).optional(),
  description: z.string().max(5000).optional().nullable(),
  fundId: z.string().max(100).optional(),
  status: z.string().max(50).optional(),
  minimumInvestment: z.coerce.number().min(0).max(MAX_AMOUNT).optional(),
  targetAmount: z.coerce.number().min(0).max(MAX_AMOUNT).optional(),
  category: z.string().max(100).optional().nullable(),
  imageUrl: z.string().max(2048).optional().nullable(),
  tags: z.array(z.string().max(100)).max(50).optional(),
  isPublic: z.boolean().optional(),
  highlights: z.array(z.string().max(500)).max(20).optional(),
});
export type OfferingInput = z.infer<typeof OfferingSchema>;

// ---------------------------------------------------------------------------
// LP Wizard Progress
// ---------------------------------------------------------------------------

export const WizardProgressUpdateSchema = z.object({
  currentStep: z.coerce.number().int().min(0).max(20),
  completedSteps: z.array(z.coerce.number().int().min(0).max(20)).optional(),
  formData: z.record(z.string(), z.unknown()).optional(),
});
export type WizardProgressUpdateInput = z.infer<typeof WizardProgressUpdateSchema>;

// ---------------------------------------------------------------------------
// Admin Entity Config
// ---------------------------------------------------------------------------

export const EntityConfigSchema = z.object({
  config: z.record(z.string(), z.unknown()),
});
export type EntityConfigInput = z.infer<typeof EntityConfigSchema>;

// ---------------------------------------------------------------------------
// Admin Pricing Tiers (batch operations)
// ---------------------------------------------------------------------------

export const PricingTierBatchSchema = z.object({
  tiers: z.array(z.object({
    id: z.string().max(100).optional(),
    tranche: z.string().max(100),
    name: z.string().max(200).optional().nullable(),
    pricePerUnit: z.coerce.number().positive().max(MAX_AMOUNT),
    unitsTotal: z.coerce.number().int().positive().max(1_000_000),
    isActive: z.boolean().optional(),
  })).min(1).max(20),
});
export type PricingTierBatchInput = z.infer<typeof PricingTierBatchSchema>;

// ---------------------------------------------------------------------------
// Funding Rounds — MOVED to lib/validations/fund.ts
// FundingRoundCreateSchema & FundingRoundUpdateSchema are canonical in fund.ts
// ---------------------------------------------------------------------------
