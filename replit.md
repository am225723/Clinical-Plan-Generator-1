# Gold Standard Treatment Plan Generator

## Overview

A clinical treatment plan generator that converts raw clinical inputs (intake forms, session transcripts, assessment scores, provider notes) into structured, print-ready mental health treatment plans. The application uses AI (OpenAI) to generate comprehensive psychiatric documentation including diagnoses with ICD-10/DSM-5-TR codes, SMART treatment goals, and medical decision-making documentation.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight React router)
- **State Management**: TanStack React Query for server state, React useState for local state
- **UI Components**: shadcn/ui component library with Radix UI primitives
- **Styling**: Tailwind CSS v4 with CSS variables for theming
- **Build Tool**: Vite with custom plugins for Replit integration

The frontend uses a resizable panel layout with an editor panel for clinical inputs and a document viewer for the generated treatment plan. Local storage is used for autosaving inputs and generated plans.

### Backend Architecture
- **Runtime**: Node.js with Express
- **Language**: TypeScript with ESM modules
- **API Pattern**: RESTful endpoints under `/api/*`
- **AI Integration**: OpenAI API via Replit AI Integrations for treatment plan generation

The server handles treatment plan generation by sending structured prompts to OpenAI and returning formatted JSON responses. The build process uses esbuild for server bundling with selective dependency bundling to optimize cold start times.

### Data Storage
- **Database**: PostgreSQL via Drizzle ORM
- **Schema Location**: `shared/schema.ts`
- **Migrations**: Managed via `drizzle-kit push`
- **Session Storage**: In-memory storage class with interface for future database migration
- **Client-side**: LocalStorage for settings, inputs, and generated plans

The schema currently defines a users table with UUID primary keys. Chat-related tables (conversations, messages) are defined in `shared/models/chat.ts` for potential voice/chat features.

### Authentication
- **Provider**: Supabase Auth (optional, client-configured)
- **Storage**: Browser localStorage for Supabase credentials and settings
- **Features**: Sign in, sign up, sign out with connection testing
- **State Management**: Custom `useSupabaseAuth` hook

Authentication is opt-in and configured through a settings modal. Users can connect their own Supabase project for cloud features.

## External Dependencies

### AI Services
- **OpenAI API**: Primary AI provider for treatment plan generation
  - Configured via `AI_INTEGRATIONS_OPENAI_API_KEY` and `AI_INTEGRATIONS_OPENAI_BASE_URL` environment variables
  - Used for structured clinical document generation with JSON output format
  - Also supports image generation (`gpt-image-1`), speech-to-text, and text-to-speech

### Database
- **PostgreSQL**: Primary database
  - Connection via `DATABASE_URL` environment variable
  - ORM: Drizzle with `drizzle-zod` for schema validation

### Optional Integrations
- **Supabase**: Optional cloud backend for authentication and storage
  - Client-side configuration stored in localStorage
  - Used for OCR, transcription, and document storage when enabled
- **PDF.js**: Client-side PDF text extraction
- **FFmpeg**: Server-side audio conversion (WebM to WAV) for voice features

### Key NPM Packages
- `@tanstack/react-query`: Server state management
- `drizzle-orm` / `drizzle-kit`: Database ORM and migrations
- `openai`: OpenAI API client
- `react-dropzone`: File upload handling
- `date-fns`: Date formatting
- `zod`: Schema validation