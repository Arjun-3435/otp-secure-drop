# 🔐 VaultDrop

> Zero-Knowledge End-to-End Encrypted File Sharing — the server never sees your files.

[![React](https://img.shields.io/badge/React-18.3-61DAFB?logo=react&logoColor=white)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Supabase](https://img.shields.io/badge/Supabase-Backend-3ECF8E?logo=supabase&logoColor=white)](https://supabase.com)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Deno](https://img.shields.io/badge/Edge_Functions-Deno-000000?logo=deno&logoColor=white)](https://deno.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## What is VaultDrop?

VaultDrop lets you share sensitive files with anyone using **military-grade AES-256-GCM encryption** and **one-time password (OTP) access control**. Files are encrypted before they leave your server, stored as unreadable ciphertext, and can only be decrypted by a recipient who has the OTP sent to their email.

**Even if someone breaches the database, they cannot read your files.** That is the zero-knowledge guarantee.

---

## ✨ Features

- **AES-256-GCM Encryption** — Every file gets a unique 256-bit random key. GCM mode also detects tampering.
- **Zero-Knowledge Architecture** — The server stores only ciphertext and a wrapped key. Without the OTP, the key is useless.
- **OTP-Gated Access** — Recipients get a 6-digit code via email. Configurable expiry (5–60 min) and download limits.
- **PBKDF2 Key Wrapping** — 100,000 iterations make OTP brute-force computationally infeasible within the expiry window.
- **SHA-256 File Integrity** — Every download is verified against the original file hash. Tampered files are rejected.
- **Full Audit Trail** — Every upload, download attempt, and OTP verification is logged with timestamps.
- **File Revocation** — Senders can revoke access or delete files at any time.
- **Storage Quotas** — Per-user storage tracking with configurable limits.

---

## 🛡️ Security Architecture

```
┌──────────────────────────────────────────────────────┐
│                  UPLOAD FLOW                         │
│                                                      │
│  File → SHA-256 Hash → AES-256-GCM Encrypt          │
│                ↓                                     │
│  OTP → PBKDF2(100k iterations) → KEK               │
│                ↓                                     │
│  AES Key → AES-GCM(KEK) → Wrapped Key              │
│                ↓                                     │
│  DB: Wrapped Key + OTP Hash + IVs + Salt            │
│  Storage: Encrypted File Blob (unreadable)           │
└──────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────┐
│                  DOWNLOAD FLOW                       │
│                                                      │
│  OTP → PBKDF2(Salt, 100k) → KEK                   │
│                ↓                                     │
│  Wrapped Key + KEK → AES Key (unwrapped)           │
│                ↓                                     │
│  Encrypted File + AES Key → Decrypted File          │
│                ↓                                     │
│  SHA-256(Decrypted) == Stored Hash? → ✅ Download   │
└──────────────────────────────────────────────────────┘
```

### Attack Surface Coverage

| Threat | Countermeasure |
|--------|----------------|
| Database breach | Wrapped keys + hashed OTPs — unreadable without OTP |
| Storage breach | Files stored as encrypted blobs — no keys in storage |
| SQL Injection | Supabase parameterized queries — no raw SQL |
| XSS | React auto-escapes all output — `dangerouslySetInnerHTML` never used |
| CSRF | JWT Bearer tokens on all requests + SameSite cookie policy |
| Brute Force | PBKDF2 (100k iterations) + 3-attempt limit + time expiry |
| File Tampering | AES-GCM auth tag + SHA-256 integrity check on every download |
| Unauthorized Access | Row-Level Security — all DB queries filtered by `user_id` |
| Man-in-the-Middle | HTTPS/TLS on all channels |
| Replay Attacks | Time-bound OTPs with configurable short expiry |

---

## 🏗️ Tech Stack

### Frontend
| Technology | Purpose |
|------------|---------|
| React 18 + TypeScript | SPA with full type safety |
| Vite | Build tool — fast HMR and optimized production builds |
| Tailwind CSS | Utility-first styling |
| React Router v6 | Client-side routing with protected routes |
| TanStack React Query | Server state, caching, background refetch |
| shadcn/ui + Radix UI | Accessible component library |
| React Hook Form + Zod | Type-safe form handling and validation |
| Recharts | Activity log dashboard charts |

### Backend
| Technology | Purpose |
|------------|---------|
| Supabase | PostgreSQL DB, Auth, Storage, Edge Functions |
| Deno (Edge Functions) | Serverless backend — encryption logic, OTP handling |
| Web Crypto API | AES-256-GCM, PBKDF2, SHA-256 (hardware-accelerated) |
| Resend | Transactional email for OTP delivery |
| PostgreSQL + RLS | Data storage with row-level access control |

---

## 📁 Project Structure

```
vaultdrop/
├── src/
│   ├── pages/
│   │   ├── Index.tsx          # Landing page
│   │   ├── Auth.tsx           # Login / Signup
│   │   ├── Dashboard.tsx      # User stats + quick actions
│   │   ├── Upload.tsx         # File encryption + upload
│   │   ├── MyFiles.tsx        # File management
│   │   ├── Access.tsx         # OTP verification + download (public)
│   │   ├── ActivityLog.tsx    # Audit trail dashboard
│   │   ├── HowItWorks.tsx     # Security architecture explainer
│   │   └── NotFound.tsx
│   ├── components/ui/         # shadcn/ui components
│   ├── hooks/                 # use-toast, use-mobile
│   ├── integrations/
│   │   └── supabase/          # Auto-generated types + client
│   ├── lib/utils.ts
│   ├── App.tsx                # Router config
│   └── main.tsx
├── supabase/
│   ├── functions/
│   │   ├── encrypt-upload/    # AES encryption + key wrapping
│   │   ├── verify-and-decrypt/# OTP verification + decryption
│   │   ├── get-file-info/     # Public file metadata (no keys)
│   │   └── send-otp-email/    # Resend email integration
│   ├── migrations/            # DB schema with RLS policies
│   └── config.toml
├── package.json
├── tailwind.config.ts
├── vite.config.ts
└── tsconfig.json
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- A [Supabase](https://supabase.com) project
- A [Resend](https://resend.com) account (for OTP emails)

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/vaultdrop.git
cd vaultdrop
npm install
```

### 2. Set Up Environment Variables

Create a `.env` file in the root:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key
VITE_SUPABASE_PROJECT_ID=your-project-id
```

### 3. Set Up Supabase

Run the migration to create the database schema:

```bash
# Using Supabase CLI
supabase db push
```

Or manually run `supabase/migrations/*.sql` in your Supabase SQL editor.

### 4. Configure Edge Function Secrets

In your Supabase Dashboard → Edge Functions → Secrets, add:

| Key | Value |
|-----|-------|
| `RESEND_API_KEY` | Your Resend API key |
| `APP_URL` | Your deployed app URL (e.g. `https://vaultdrop.vercel.app`) |
| `INCLUDE_OTP_IN_RESPONSE` | `true` (dev only — shows OTP in upload response) |

### 5. Deploy Edge Functions

```bash
supabase functions deploy encrypt-upload
supabase functions deploy verify-and-decrypt
supabase functions deploy get-file-info
supabase functions deploy send-otp-email
```

### 6. Run Locally

```bash
npm run dev
```

App runs at `http://localhost:8080`

---

## 📖 How It Works

### Uploading a File

1. Authenticated user selects a file and enters the recipient's email
2. The `encrypt-upload` edge function:
   - Calculates SHA-256 hash of the original file
   - Generates a random AES-256 key and IV
   - Encrypts the file with AES-256-GCM
   - Generates a 6-digit OTP
   - Derives a Key Encryption Key (KEK) from the OTP using PBKDF2 (100k iterations)
   - Wraps (encrypts) the AES key with the KEK
   - Hashes the OTP with SHA-256 — **only the hash is stored**
   - Uploads the encrypted file blob to storage
   - Stores metadata + wrapped key + OTP hash in the database
   - Sends the OTP to the recipient via email
3. Uploader receives a shareable link

### Downloading a File

1. Recipient opens the share link (`/access/:fileId`)
2. Public file info (name, size, expiry countdown) is shown — no keys exposed
3. Recipient enters their OTP
4. The `verify-and-decrypt` edge function:
   - Validates: file active? OTP not expired? Under attempt limit? OTP hash matches?
   - Re-derives the KEK from the submitted OTP using PBKDF2
   - Unwraps the AES key using the KEK
   - Downloads and decrypts the file from storage
   - Verifies SHA-256 integrity — rejects if tampered
   - Logs the access event and increments the counter
5. Decrypted file is returned and saved to the recipient's device

---

## 🗄️ Database Schema

```sql
-- User profiles (auto-created on signup)
profiles (id, email, full_name, storage_used, storage_quota)

-- Encrypted file metadata
files (
  id, user_id, original_filename, encrypted_filename,
  file_size, file_mimetype, original_file_hash,
  encrypted_aes_key, key_salt, file_iv, key_iv,  -- crypto params
  otp_hash, otp_created_at, otp_expires_at,        -- OTP (hash only)
  max_access_attempts, access_count, file_status,  -- access control
  recipient_email, upload_timestamp
)

-- Immutable audit trail
access_logs (id, file_id, user_id, access_type, access_status, failure_reason, timestamp)
```

All tables protected by **Row-Level Security (RLS)** — users can only access their own rows.

---

## 📊 Pages

| Route | Description | Auth |
|-------|-------------|------|
| `/` | Landing page with features overview | Public |
| `/auth` | Login and signup | Public |
| `/dashboard` | Stats and quick actions | 🔒 Required |
| `/upload` | Encrypt and share a file | 🔒 Required |
| `/my-files` | Manage your uploaded files | 🔒 Required |
| `/activity-log` | Live audit trail with charts | 🔒 Required |
| `/how-it-works` | Security architecture explained | Public |
| `/access/:fileId` | Recipient OTP verification and download | Public |

---

## 🔧 Known Limitations

- **Email delivery**: Resend's free tier with `onboarding@resend.dev` only delivers to verified emails. Verify a custom domain in Resend for unrestricted delivery.
- **File size**: Limited to 100MB per file due to edge function memory constraints.
- **Single recipient**: One OTP per file share. Multi-recipient support is planned.

---

## 🛣️ Roadmap

- [ ] Custom domain email (production Resend setup)
- [ ] Client-side encryption via Web Workers for large files
- [ ] SMS OTP as alternative delivery
- [ ] Multiple recipients per file
- [ ] File preview (PDF, images) without download
- [ ] Auto-delete on expiry (scheduled edge function)
- [ ] Team workspaces with role-based access

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

---

## 🙏 Acknowledgements

- [Supabase](https://supabase.com) — Backend infrastructure
- [shadcn/ui](https://ui.shadcn.com) — Component library
- [Resend](https://resend.com) — Email delivery
- [Lucide](https://lucide.dev) — Icons
- [Web Crypto API](https://www.w3.org/TR/WebCryptoAPI/) — W3C cryptography standard

---

<p align="center">Built with ❤️ at JIIT Noida &nbsp;·&nbsp; Web Technology & Security Project</p>
