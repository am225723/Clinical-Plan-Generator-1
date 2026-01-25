# Gold Standard Treatment Plan Generator

## Overview

A clinical treatment plan generator that converts raw clinical inputs (intake forms, session transcripts, assessment scores, provider notes) into structured, print-ready mental health treatment plans. The application uses Perplexity AI to generate comprehensive psychiatric documentation including diagnoses with ICD-10/DSM-5-TR codes, SMART treatment goals, and medical decision-making documentation.

**Current Status**: Next.js Pages Router with Supabase Auth, role-based access control (admin/doctor), secure API routes, document templates with custom AI prompts per template type, document history with search, and advanced glass-morphism UI with dark/light mode.

## User Preferences

Preferred communication style: Simple, everyday language.

## Design System

### Theme
- **Colors**: Teal (#13ecc8) and Blue (#137fec) gradient as primary accent
- **Font**: Inter (system font fallback)
- **Style**: Glass-morphism with translucent panels, blur effects, and subtle shadows
- **Modes**: Dark and Light theme with system preference detection and localStorage persistence

### UI Components
- **Glass Panels**: Translucent cards with backdrop blur and subtle borders
- **Bottom Navigation**: Fixed bottom nav with FAB (Floating Action Button) for generate action
- **Gradient Buttons**: Primary actions use teal-to-blue gradient with glow effect
- **Shadow Glow**: Primary elements have subtle colored glow shadows

## System Architecture

### Frontend Architecture
- **Framework**: Next.js 15 with Pages Router
- **Language**: TypeScript with ESM modules
- **UI Components**: shadcn/ui component library with Radix UI primitives
- **Styling**: Tailwind CSS v4 with CSS variables via `@theme` directive
- **State Management**: React useState for local state, Context API for Supabase auth and theme
- **Theme System**: ThemeProvider in `lib/theme.tsx` with localStorage persistence

### Backend Architecture
- **Runtime**: Node.js with Next.js custom server
- **Language**: TypeScript with ESM modules
- **API Pattern**: Next.js API routes under `/pages/api/*`
- **AI Integration**: Perplexity AI for treatment plan generation
- **Server Entry**: `server/index.ts` runs a custom Next.js server

### Pages Structure
- `/pages/index.tsx` - Root page (redirects to admin or doctor based on role)
- `/pages/login.tsx` - Login page with Supabase Auth
- `/pages/admin/index.tsx` - Admin dashboard with user management
- `/pages/doctor/index.tsx` - Doctor dashboard with tabs: Dashboard, Generate, History
- `/pages/settings.tsx` - Settings page for AI prompts and document configuration
- `/pages/api/*` - API routes for treatment plan generation, settings, admin, and PDF

### Component Structure
```
components/
├── dashboard/
│   ├── header.tsx           # Dashboard header with user info, theme toggle, settings
│   ├── practice-stats.tsx   # Practice overview stats (time saved, compliance, risk)
│   └── clinical-calendar.tsx # Appointment calendar view
├── generator/
│   ├── file-upload.tsx      # Multi-file upload (PDF, Audio, Video, Text)
│   ├── patient-form.tsx     # Patient information form with validation
│   ├── clinical-inputs.tsx  # Clinical context inputs with tabs
│   ├── ai-controls.tsx      # Template selector, detail level, AI instructions
│   ├── note-editor.tsx      # Rich editor with AI refinement and detail slider
│   ├── document-preview.tsx # Document preview with print/download
│   └── validation-screen.tsx # Pre-generation validation with missing field alerts
├── templates/
│   ├── template-editor.tsx  # Full template editor with guardrails and sections
│   └── template-list.tsx    # Template list with CRUD operations
└── ui/
    └── bottom-nav.tsx       # Bottom navigation with FAB button
```

### Data Storage
- **Database**: PostgreSQL via Drizzle ORM (local) + Supabase PostgreSQL (auth/profiles)
- **Schema Location**: `shared/schema.ts` (Drizzle), `NEXTJS_SUPABASE_SETUP.sql` (Supabase)
- **Migrations**: Managed via `drizzle-kit push`
- **Client-side**: LocalStorage for settings, inputs, and theme preference

### Authentication
- **Provider**: Supabase Auth (required, configured via environment variables)
- **Library**: `@supabase/ssr` for server-side rendering support
- **Role-Based Access Control**:
  - `admin`: Access to user management, app settings
  - `doctor`: Access to treatment plan generation, document settings
- **Server-Side Protection**: `requireAdmin()` and `requireDoctor()` functions in `lib/auth.ts`
- **Client-Side State**: Context provider in `pages/_app.tsx` with `useSupabase()` hook

## External Dependencies

### AI Services
- **Perplexity AI**: Primary AI provider for document generation
  - Configured via `PERPLEXITY_API_KEY` environment variable
  - Uses `llama-3.1-sonar-large-128k-online` model for structured clinical document generation
  - Each document template type (Treatment Plan, DARP Note, Psych Note, etc.) has its own customized AI prompt

### Database
- **PostgreSQL**: Primary database
  - Connection via `DATABASE_URL` environment variable
  - ORM: Drizzle with `drizzle-zod` for schema validation
- **Supabase PostgreSQL**: Auth and profiles database
  - Connection via `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` secrets

### API Routes (Next.js)
- `/api/admin/create-user` - Create new doctor users (admin only)
- `/api/admin/update-user` - Update user profiles (admin only)
- `/api/settings/get` - Get app/document settings
- `/api/settings/set` - Update settings (role-based)
- `/api/upload-logo` - Get signed URL for logo upload
- `/api/generate-pdf` - Generate treatment plan PDF HTML
- `/api/generate-treatment-plan` - AI-powered treatment plan generation

### Key NPM Packages
- `next`: Next.js framework
- `@supabase/ssr`: Supabase SSR support
- `@supabase/supabase-js`: Supabase client
- `drizzle-orm` / `drizzle-kit`: Database ORM and migrations
- Native fetch API for Perplexity AI calls
- `tailwindcss` / `@tailwindcss/postcss`: Styling
- `zod`: Schema validation

## Environment Variables
- `VITE_SUPABASE_URL`: Supabase project URL (secret)
- `VITE_SUPABASE_ANON_KEY`: Supabase anonymous key (secret)
- `PERPLEXITY_API_KEY`: Perplexity AI API key (secret)
- `DATABASE_URL`: PostgreSQL connection string

## Features

### Dashboard
- Practice overview with stats (time saved, risk flagged, compliance rate)
- Clinical calendar for appointment tracking
- Dark/light mode toggle with localStorage persistence
- Quick access to recent documents

### Document Generation
- Multi-file upload support (PDF, Audio, Video, Text files)
- Patient information form with validation
- Clinical context inputs (intake data, session transcripts, assessment scores)
- AI-powered document generation with customizable templates
- Detail level slider (Brief, Standard, Detailed, Expert)
- AI refinement with quick actions and custom instructions
- Pre-generation validation with missing field alerts

### Templates
- Multiple document types: Treatment Plan, DARP Note, Psych Note, Progress Note, Discharge Summary
- Custom AI prompts per template type
- Clinical guardrails (HIPAA, ICD-10 validation, medical necessity, suicide risk)
- Drag-and-drop section ordering
- Template duplication and management
- Required vs optional sections with protection against accidental deletion

### Document History
- Saved documents with full-text search by patient name
- Document preview with markdown rendering (XSS-sanitized)
- Print and download functionality
- Edit and regenerate capabilities
