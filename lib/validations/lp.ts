import { z } from "zod";

/**
 * LP-Related Validation Schemas
 *
 * Shared Zod schemas for LP onboarding, accreditation, and document APIs.
 */

const MAX_AMOUNT = 100_000_000_000;

/** Normalized email — trimmed, lowercased */
const emailSchema = z
  .string()
  .min(1, "Email is required")
  .email("Invalid email format")
  .transform((v) => v.toLowerCase().trim());

// ---------------------------------------------------------------------------
// POST /api/lp/register
// ---------------------------------------------------------------------------

export const LpRegisterSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  email: emailSchema,
  phone: z.string().max(30).optional().nullable(),
  password: z.string().min(8).max(72).optional(),
  entityType: z.string().max(50).optional().nullable(),
  entityName: z.string().max(255).optional().nullable(),
  entityData: z.record(z.string(), z.unknown()).optional().nullable(),
  address: z
    .object({
      street1: z.string().max(255).optional(),
      street2: z.string().max(255).optional(),
      city: z.string().max(100).optional(),
      state: z.string().max(100).optional(),
      zip: z.string().max(20).optional(),
      country: z.string().max(100).optional(),
    })
    .optional()
    .nullable(),
  accreditationType: z.string().max(100).optional().nullable(),
  ndaAccepted: z.boolean().optional(),
  sourceOfFunds: z.string().max(50).optional().nullable(),
  occupation: z.string().max(255).optional().nullable(),
  fundId: z.string().max(100).optional().nullable(),
  teamId: z.string().max(100).optional().nullable(),
  referralSource: z.string().max(255).optional().nullable(),
});

export type LpRegisterInput = z.infer<typeof LpRegisterSchema>;

// ---------------------------------------------------------------------------
// POST /api/lp/sign-nda
// ---------------------------------------------------------------------------

export const SignNdaSchema = z.object({
  fundId: z.string().max(100).optional().nullable(),
  ndaAccepted: z.literal(true, {
    errorMap: () => ({ message: "NDA must be accepted" }),
  }),
  signatureMethod: z.string().max(50).optional().nullable(),
  signatureData: z
    .union([z.string().max(500_000), z.record(z.string(), z.unknown())])
    .optional()
    .nullable(),
});

export type SignNdaInput = z.infer<typeof SignNdaSchema>;

// ---------------------------------------------------------------------------
// POST /api/lp/investor-details
// ---------------------------------------------------------------------------

const VALID_ENTITY_TYPES = [
  "INDIVIDUAL",
  "JOINT",
  "TRUST",
  "TRUST_ESTATE",
  "LLC",
  "LLC_CORPORATION",
  "CORPORATION",
  "PARTNERSHIP",
  "IRA",
  "IRA_RETIREMENT",
  "CHARITY",
  "CHARITY_FOUNDATION",
  "OTHER",
] as const;

export const InvestorDetailsSchema = z.object({
  fundId: z.string().max(100).optional().nullable(),
  entityType: z.enum(VALID_ENTITY_TYPES).optional().nullable(),
  entityName: z.string().max(255).optional().nullable(),
  entityData: z.record(z.string(), z.unknown()).optional().nullable(),
  taxId: z.string().max(20).optional().nullable(),
  taxIdType: z.enum(["SSN", "EIN", "ITIN"]).optional().nullable(),
  address: z
    .object({
      street1: z.string().max(255).optional(),
      street2: z.string().max(255).optional(),
      city: z.string().max(100).optional(),
      state: z.string().max(100).optional(),
      zip: z.string().max(20).optional(),
      country: z.string().max(100).optional(),
    })
    .optional()
    .nullable(),
  authorizedSignerName: z.string().max(255).optional().nullable(),
  authorizedSignerTitle: z.string().max(255).optional().nullable(),
  authorizedSignerEmail: z.string().email().max(254).optional().nullable(),
});

export type InvestorDetailsInput = z.infer<typeof InvestorDetailsSchema>;

// ---------------------------------------------------------------------------
// POST /api/lp/commitment
// ---------------------------------------------------------------------------

export const LpCommitmentSchema = z.object({
  fundId: z.string().min(1, "Fund ID is required"),
  amount: z.coerce.number().positive().max(MAX_AMOUNT),
  units: z.coerce.number().int().positive().optional().nullable(),
  tierId: z.string().uuid().optional().nullable(),
  representations: z
    .record(z.string(), z.unknown())
    .refine((obj) => Object.keys(obj).length <= 20, "Too many representation fields")
    .optional()
    .nullable(),
  noThirdPartyFinancing: z.boolean().optional(),
  sourceOfFunds: z.string().max(50).optional(),
  occupation: z.string().max(255).optional(),
});

export type LpCommitmentInput = z.infer<typeof LpCommitmentSchema>;

// ---------------------------------------------------------------------------
// PUT /api/lp/onboarding-flow
// ---------------------------------------------------------------------------

export const OnboardingFlowUpdateSchema = z.object({
  fundId: z.string().min(1, "Fund ID is required"),
  currentStep: z.number().int().min(0).max(10),
  formData: z.record(z.string(), z.unknown()).optional().nullable(),
  stepsCompleted: z.record(z.string(), z.unknown()).optional().nullable(),
});

export type OnboardingFlowUpdateInput = z.infer<typeof OnboardingFlowUpdateSchema>;

// ---------------------------------------------------------------------------
// POST /api/lp/kyc
// ---------------------------------------------------------------------------

export const KycActionSchema = z.object({
  action: z.enum(["start", "resume"]),
});

export type KycActionInput = z.infer<typeof KycActionSchema>;

// ---------------------------------------------------------------------------
// POST /api/lp/notes
// ---------------------------------------------------------------------------

export const LpNoteSchema = z.object({
  content: z.string().min(1, "Note content is required").max(5000),
});

export type LpNoteInput = z.infer<typeof LpNoteSchema>;

// ---------------------------------------------------------------------------
// POST /api/lp/documents/upload
// ---------------------------------------------------------------------------

const LP_DOCUMENT_TYPES = [
  "NDA",
  "SUBSCRIPTION_AGREEMENT",
  "LPA",
  "SIDE_LETTER",
  "ACCREDITATION_LETTER",
  "TAX_FORM",
  "ID_VERIFICATION",
  "PROOF_OF_ADDRESS",
  "BANK_STATEMENT",
  "WIRE_CONFIRMATION",
  "OTHER",
] as const;

export const LpDocumentUploadSchema = z.object({
  title: z.string().min(1, "Title is required").max(255),
  documentType: z.enum(LP_DOCUMENT_TYPES),
  fundId: z.string().min(1, "Fund ID is required"),
  lpNotes: z.string().max(2000).optional().nullable(),
  isOfflineSigned: z.boolean().optional(),
  externalSigningDate: z.string().optional().nullable(),
  investmentId: z.string().max(100).optional().nullable(),
  fileData: z.string().min(1, "File data is required"),
  fileName: z.string().min(1, "File name is required").max(255),
  mimeType: z.string().max(100).optional().nullable(),
});

export type LpDocumentUploadInput = z.infer<typeof LpDocumentUploadSchema>;

// ---------------------------------------------------------------------------
// POST /api/lp/accreditation
// ---------------------------------------------------------------------------

export const AccreditationSchema = z.object({
  accreditationType: z.string().min(1, "Accreditation type is required").max(100),
  accreditationDetails: z.record(z.string(), z.unknown()).optional().nullable(),
  confirmAccredited: z.literal(true, {
    errorMap: () => ({ message: "Accredited investor confirmation required" }),
  }),
  confirmRiskAware: z.literal(true, {
    errorMap: () => ({ message: "Risk awareness confirmation required" }),
  }),
  confirmDocReview: z.literal(true, {
    errorMap: () => ({ message: "Document review confirmation required" }),
  }),
  confirmRepresentations: z.literal(true, {
    errorMap: () => ({ message: "Representations confirmation required" }),
  }),
  useSimplifiedPath: z.boolean().optional(),
  intendedCommitment: z.coerce.number().min(0).max(MAX_AMOUNT).optional().nullable(),
  accreditationDocIds: z.array(z.string().max(100)).max(20).optional().nullable(),
  accreditationVerificationMethod: z
    .enum(["DOCUMENT_UPLOAD", "SELF_CERTIFICATION"])
    .optional()
    .nullable(),
});

export type AccreditationInput = z.infer<typeof AccreditationSchema>;

// ---------------------------------------------------------------------------
// POST /api/lp/process-payment
// ---------------------------------------------------------------------------

export const ProcessPaymentSchema = z.object({
  subscriptionId: z.string().min(1, "Subscription ID is required"),
});

export type ProcessPaymentInput = z.infer<typeof ProcessPaymentSchema>;
