# Gold Standard Treatment Plan Generator

## Overview

A clinical treatment plan generator that converts raw clinical inputs (intake forms, session transcripts, assessment scores, provider notes) into structured, print-ready mental health treatment plans. The application uses AI (OpenAI) to generate comprehensive psychiatric documentation including diagnoses with ICD-10/DSM-5-TR codes, SMART treatment goals, and medical decision-making documentation.

**Current Status**: Fully migrated to Next.js Pages Router with Supabase Auth, role-based access control (admin/doctor), and secure API routes.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: Next.js 15 with Pages Router
- **Language**: TypeScript with ESM modules
- **UI Components**: shadcn/ui component library with Radix UI primitives
- **Styling**: Tailwind CSS v4 with CSS variables via `@theme` directive
- **State Management**: React useState for local state, Context API for Supabase auth

### Backend Architecture
- **Runtime**: Node.js with Next.js custom server
- **Language**: TypeScript with ESM modules
- **API Pattern**: Next.js API routes under `/pages/api/*`
- **AI Integration**: OpenAI API via Replit AI Integrations for treatment plan generation
- **Server Entry**: `server/index.ts` runs a custom Next.js server

### Pages Structure
- `/pages/index.tsx` - Root page (redirects to admin or doctor based on role)
- `/pages/login.tsx` - Login page with Supabase Auth
- `/pages/admin/index.tsx` - Admin dashboard with user management
- `/pages/doctor/index.tsx` - Doctor dashboard with AI controls and treatment plan generation
- `/pages/settings.tsx` - Settings page for AI prompts and document configuration
- `/pages/api/*` - API routes for treatment plan generation, settings, admin, and PDF

### Data Storage
- **Database**: PostgreSQL via Drizzle ORM (local) + Supabase PostgreSQL (auth/profiles)
- **Schema Location**: `shared/schema.ts` (Drizzle), `NEXTJS_SUPABASE_SETUP.sql` (Supabase)
- **Migrations**: Managed via `drizzle-kit push`
- **Client-side**: LocalStorage for settings and inputs

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
- **OpenAI API**: Primary AI provider for treatment plan generation
  - Configured via `AI_INTEGRATIONS_OPENAI_API_KEY` and `AI_INTEGRATIONS_OPENAI_BASE_URL` environment variables
  - Used for structured clinical document generation with JSON output format

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
- `openai`: OpenAI API client
- `tailwindcss` / `@tailwindcss/postcss`: Styling
- `zod`: Schema validation

## Environment Variables
- `VITE_SUPABASE_URL`: Supabase project URL (secret)
- `VITE_SUPABASE_ANON_KEY`: Supabase anonymous key (secret)
- `AI_INTEGRATIONS_OPENAI_API_KEY`: OpenAI API key (via Replit integrations)
- `AI_INTEGRATIONS_OPENAI_BASE_URL`: OpenAI base URL (via Replit integrations)
- `DATABASE_URL`: PostgreSQL connection string