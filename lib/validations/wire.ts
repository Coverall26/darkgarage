import { z } from "zod";

/**
 * Wire Transfer Validation Schemas
 *
 * Shared Zod schemas for wire proof upload and GP wire confirmation.
 */

const MAX_AMOUNT = 100_000_000_000;

/** Date string that is not in the future (with 1-day tolerance) */
const pastOrPresentDateSchema = z
  .string()
  .refine((val) => !isNaN(Date.parse(val)), { message: "Invalid date format" })
  .refine(
    (val) => new Date(val).getTime() <= Date.now() + 86_400_000,
    { message: "Date cannot be in the future" },
  );

// ---------------------------------------------------------------------------
// Wire Proof Upload (POST /api/lp/wire-proof)
// ---------------------------------------------------------------------------

/**
 * LP wire proof upload input.
 * investmentId can be either a regular Investment ID or a ManualInvestment ID
 * (not necessarily a UUID — may use newId() format).
 */
export const WireProofSchema = z.object({
  investmentId: z.string().min(1, "Investment ID is required"),
  storageKey: z.string().min(1).max(1024),
  storageType: z.string().min(1).max(50),
  fileType: z.string().min(1).max(100),
  fileName: z.string().min(1).max(255),
  fileSize: z.number().int().nonnegative().max(25 * 1024 * 1024).optional(),
  notes: z.string().max(500).optional(),
  bankReference: z.string().max(100).optional(),
  amountSent: z.number().finite().min(0).max(MAX_AMOUNT).optional().nullable(),
  wireDateInitiated: pastOrPresentDateSchema.optional(),
});

export type WireProofInput = z.infer<typeof WireProofSchema>;

// ---------------------------------------------------------------------------
// GP Wire Confirmation (POST /api/admin/wire/confirm)
// ---------------------------------------------------------------------------

export const WireConfirmSchema = z.object({
  transactionId: z.string().uuid(),
  teamId: z.string().uuid(),
  fundsReceivedDate: z.string().refine(
    (val) => !isNaN(Date.parse(val)),
    { message: "Invalid date format" },
  ),
  amountReceived: z.number().min(0).max(MAX_AMOUNT),
  bankReference: z.string().max(255).optional(),
  confirmationNotes: z.string().max(1000).optional(),
  confirmationProofDocumentId: z.string().uuid().optional(),
});

export type WireConfirmInput = z.infer<typeof WireConfirmSchema>;
