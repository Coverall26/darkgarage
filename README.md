# FundRoom AI

[![Tests](https://github.com/Darkroom4/darkroom/actions/workflows/test.yml/badge.svg)](https://github.com/Darkroom4/darkroom/actions/workflows/test.yml)
[![Deploy](https://github.com/Darkroom4/darkroom/actions/workflows/production.yml/badge.svg)](https://github.com/Darkroom4/darkroom/actions/workflows/production.yml)

Multi-tenant fund operations platform for GPs and LPs. Secure document sharing, native e-signatures, investor onboarding, wire confirmation, and SEC compliance — all in one place.

## Platform Overview

### GP (Fund Manager) Tools
- **9-step Setup Wizard** — Company info, branding, raise style (GP Fund / Startup / Dataroom Only), team invites, fund details, LP onboarding config, integrations, and launch
- **Investor Pipeline** — 7-stage pipeline (Applied → Funded), approval queue with inline editing, manual investor entry, bulk import
- **Fund Management** — Mode-aware dashboards (GP Fund / Startup / Dataroom Only), financial aggregates, tranche pricing, capital tracking
- **Document Review** — Approve/reject/request-revision on LP documents, GP upload on behalf of LP, side-by-side comparison
- **Wire Confirmation** — Confirm wire receipts, review proof-of-payment uploads, auto-advance investor stages
- **Reports & Analytics** — Pipeline distribution, conversion funnels, Form D export, engagement scoring, dataroom analytics
- **Settings Center** — 21 sections across 7 tabs with per-section save, settings inheritance (System → Org → Team → Fund), team CRUD

### LP (Investor) Portal
- **Guided Onboarding** — Account → NDA → Accreditation → Entity Details → Commitment → Document Signing → Verification
- **7 Entity Types** — Individual, Joint, Trust/Estate, LLC/Corporation, Partnership, IRA/Retirement, Charity/Foundation with SEC-compliant accreditation criteria per type
- **Dashboard** — Investment status, document vault, transaction history, 5-stage progress tracker
- **Wire Transfers** — Wire instructions with copy-to-clipboard, proof-of-payment upload, status tracking

### FundRoom Sign (Native E-Signature)
- Split-screen signing: PDF viewer + auto-filled investor fields + signature capture (draw/type/upload)
- Sequential, parallel, and mixed signing modes
- Standalone envelope system — send to any email, not just onboarded LPs
- 16 field types, document filing to org vault and contact vaults
- ESIGN/UETA compliance with SHA-256 audit trail

### CRM & Billing
- **4-tier model** — FREE (20 contacts, 10 e-sig/mo) → CRM_PRO ($20/mo) → FUNDROOM ($79/mo) → AI CRM add-on ($49/mo)
- Contact pipeline with Kanban drag-drop, engagement scoring (Hot/Warm/Cool), AI insights
- Outreach center with sequences, templates, bulk send, CAN-SPAM compliance
- 3-level CRM roles (Viewer / Contributor / Manager)

### SEC Compliance
- Regulation D exemptions: Rule 506(b), 506(c), Reg A+, Rule 504
- Accredited investor verification with entity-type-specific criteria
- Form D data capture and export (OMB 3235-0076)
- Bad Actor 506(d) certification
- 8 SEC investor representations
- Immutable SHA-256 hash-chained audit log

### Dataroom
- Secure document sharing with custom links and policies
- Password protection, expiry, download/print controls, watermark
- Per-link accreditation gate (self-certification, qualified purchaser, accredited only)
- Engagement scoring and page-by-page analytics
- Custom domain support

## Tech Stack

| Category | Technology |
|----------|-----------|
| Framework | Next.js 16 (App Router + Pages Router) |
| UI | React 19, Tailwind CSS, shadcn/ui |
| Database | PostgreSQL (Supabase), Prisma ORM |
| Auth | NextAuth.js (email/password, Google OAuth, magic links) |
| Email | Resend (platform + org-branded) |
| E-Signature | FundRoom Sign (native, zero external cost) |
| Billing | Stripe (CRM subscriptions + marketplace) |
| Analytics | PostHog, Rollbar, Vercel Analytics |
| Storage | AWS S3, Cloudflare R2, Vercel Blob |
| KYC/AML | Persona (Phase 2) |
| CI/CD | GitHub Actions, Vercel |

## Architecture

```
app/                          # Next.js App Router
├── admin/                    # GP dashboard, setup wizard, settings
├── api/                      # App Router API routes (218 routes)
├── lp/                       # LP portal (dashboard, docs, wire, onboarding)
├── view/                     # Public document/dataroom viewer
└── (auth)/                   # Auth pages

pages/api/                    # Pages Router API routes (293 routes)

components/                   # React components
├── admin/                    # GP dashboard, pipeline, sidebar
├── crm/                      # CRM contacts, kanban, outreach
├── esign/                    # FundRoom Sign consolidated signing
├── lp/                       # LP portal components
├── onboarding/               # LP onboarding steps
└── ui/                       # shadcn/ui primitives

lib/                          # Shared utilities
├── auth/                     # RBAC, paywall, CRM roles, getMiddlewareUser
├── audit/                    # Immutable audit logging
├── esign/                    # Envelope service, field types, filing
├── middleware/                # Edge auth, route classification, cron auth
├── security/                 # Rate limiting (7 tiers), bot protection
├── tier/                     # CRM tier resolution + pay gates
└── prisma.ts                 # Database client

prisma/
├── schema.prisma             # 140 models, 91 enums, 5,799 lines
└── migrations/               # 32 migrations
```

## Development

### Prerequisites
- Node.js 22+
- PostgreSQL database
- Required API keys (see `.env.example`)

### Setup

```bash
npm install
npx prisma db push
npx prisma db seed          # Seeds demo tenant
npm run dev
```

### Testing

```bash
npm test                     # Run all tests
npm run test:coverage        # With coverage
```

196 test files, 5,800+ tests across 180+ suites.

### Environment Variables

See `.env.example` for the complete list. Key variables:

```env
SUPABASE_DATABASE_URL=postgresql://...
NEXTAUTH_SECRET=...
NEXTAUTH_URL=https://app.fundroom.ai
RESEND_API_KEY=...
STRIPE_SECRET_KEY=...
ROLLBAR_SERVER_TOKEN=...
```

See [docs/ENV_VARS.md](docs/ENV_VARS.md) for the full reference (~200 variables across 20 categories).

## Deployment

Deployed on Vercel with host-based middleware routing for multi-tenant domain handling.

| Domain | Purpose |
|--------|---------|
| `app.fundroom.ai` | Main application |
| `app.login.fundroom.ai` | Standard login |
| `app.admin.fundroom.ai` | Admin-only login |

Health check: `GET /api/health`

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for full deployment guide.

## Security

- **Authentication** — NextAuth.js with JWT sessions, edge middleware enforcement on ALL API routes (5-layer defense-in-depth), RBAC
- **Rate Limiting** — 7-tier system from blanket (200/min) to strict (3/hr), Redis-backed with in-memory fallback
- **Encryption** — AES-256-GCM for sensitive data (SSN, EIN, API keys, wire instructions, Plaid tokens, MFA secrets). See [docs/ENCRYPTION_AUDIT.md](docs/ENCRYPTION_AUDIT.md) for the full field-level encryption audit
- **Multi-tenant Isolation** — Every query scoped by teamId/orgId, edge middleware blocks cross-tenant access
- **Audit Trail** — Immutable SHA-256 hash-chained log for SEC 506(c) compliance
- **Security Headers** — HSTS, CSP, X-Frame-Options, Permissions-Policy
- **Secret Scanning** — Enable GitHub secret scanning and push protection in repository Settings → Code security and analysis. All API keys should be rotated if they ever appeared in git history. See [docs/SECRETS_AUDIT.md](docs/SECRETS_AUDIT.md) for the full secrets audit

See [SECURITY.md](SECURITY.md) for vulnerability reporting and security architecture.

### Demo Credentials

For demo/staging credentials, all passwords are configured via environment variables (`GP_SEED_PASSWORD`, `LP_SEED_PASSWORD`, `ADMIN_SEED_PASSWORD`). See `.env.example` for the full list. **Never commit real passwords, API keys, or tokens.**

## Payment Architecture

| Service | Purpose |
|---------|---------|
| Manual Wire | Capital movements (wire instructions + proof upload + GP confirmation) |
| Stripe | CRM billing (FREE / CRM_PRO / FUNDROOM + AI add-on) |
| Plaid ACH | Capital calls and distributions (Phase 2) |

## Documentation

| Document | Description |
|----------|-------------|
| [CLAUDE.md](CLAUDE.md) | System prompt, implementation status, build notes |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | System architecture, data flows, multi-tenant design |
| [docs/SEC_COMPLIANCE.md](docs/SEC_COMPLIANCE.md) | Regulation D, accreditation, Form D, audit trail |
| [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) | Vercel deployment, env vars, health checks |
| [docs/ENV_VARS.md](docs/ENV_VARS.md) | Complete environment variable reference |
| [docs/API_REFERENCE.md](docs/API_REFERENCE.md) | API route index (~500 routes) |
| [docs/DATABASE_SETUP.md](docs/DATABASE_SETUP.md) | Database setup, migrations, seeding |
| [docs/LAUNCH_CHECKLIST.md](docs/LAUNCH_CHECKLIST.md) | Pre-launch verification checklist |
| [docs/RUNBOOK.md](docs/RUNBOOK.md) | Operational runbook (12 procedures) |
| [CONTRIBUTING.md](CONTRIBUTING.md) | Development guide, conventions, PR process |
| [SECURITY.md](SECURITY.md) | Security policy, vulnerability reporting |
| [CHANGELOG.md](CHANGELOG.md) | Version history |

## CI/CD

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| `test.yml` | Push to main, PRs | Tests, linting, type-checking |
| `production.yml` | Main branch push | Vercel production deploy |
| `preview.yml` | Pull requests | PR preview deployments |
| `integration.yml` | Weekly schedule | Sandbox API tests |

## License

Proprietary. All rights reserved. See [LICENSE](LICENSE) for details.
