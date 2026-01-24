# Codebase Merge Analysis

## Executive Summary

This document compares the capabilities of **stitch-generator** (UI/UX mockups) and **Clinical-Plan-Generator-1** (current production codebase), identifying all features from both for the merged product: a unified AI-powered psychiatry clinical documentation assistant.

---

## Source 1: stitch-generator (UI/Styling Source of Truth)

### Files Included

| File | Purpose | Key Capabilities |
|------|---------|------------------|
| `clinical_documentation_dashboard/code.html` | Main Dashboard | Calendar, practice stats, dark/light mode |
| `sophisticated_clinical_generator_1/code.html` | Patient Intake & File Upload | Multi-file upload, form inputs, clinical context |
| `sophisticated_clinical_generator_2/code.html` | Pre-Generation Review | Validation, missing field alerts, AI tips |
| `clinical_note_editor_&_ai_chat/code.html` | Note Editor & Export | Rich editor, format controls, PDF export |
| `professional_document_templates/code.html` | Template Configuration | AI prompts, section ordering, guardrails |

### Detailed Capabilities

#### 1. Clinical Documentation Dashboard
- **Welcome Header**: Doctor profile with avatar, welcome message
- **Practice Overview Stats**:
  - Time Saved (hours)
  - Risk Flagged Cases (action required indicator)
  - Compliance Percentage
- **Clinical Calendar**:
  - Daily appointment list with times
  - Patient names and appointment types
  - Room/Virtual indicators
  - Status badges (Completed, Note Pending)
  - iCal import functionality
- **Dark/Light Mode Toggle**
- **Notifications Badge**
- **Bottom Navigation**: Home, Templates, AI Generate (FAB), Patients, Settings

#### 2. Sophisticated Clinical Generator (Patient Intake)
- **Patient Information Form**:
  - Client ID (editable)
  - Patient Name (auto-populated)
  - Date of Service
  - Date of Birth (auto-populated)
  - Appointment Type selector (Initial Evaluation, Follow-up, Medication Management, Psychotherapy, Crisis Intervention)
  - Provider display with verification badge
- **Multi-File Upload System**:
  - PDF upload support
  - Text/document upload
  - Audio file upload
  - Video file upload
  - Attached files display with thumbnails, names, sizes
  - Remove file capability
- **Clinical Context Input**:
  - Tabbed interface (Intake, Session, Scores)
  - Large text area for clinical notes
  - Paste functionality
- **Step Progress Indicator** (Step X of Y)

#### 3. Pre-Generation Review & Validation
- **Clinical Readiness Check**:
  - Progress indicator circle
  - Missing/incomplete info counter
- **Missing Field Alerts**:
  - Medication History (required field)
  - Mental Status Exam (incomplete data)
  - Animated border pulse for urgent items
  - Inline input fields to complete missing data
  - Voice input option for dictation
- **AI Optimization Tip**: Shows accuracy improvement percentage
- **Action Buttons**:
  - "Proceed to Generation"
  - "Skip and Generate Anyway"

#### 4. Clinical Note Editor & AI Chat
- **Document Header**:
  - Patient info (name, ID)
  - Provider info with verification
  - Back navigation
- **Format & Export Panel**:
  - Text size slider (10-16pt)
  - Line height options (compact/normal)
  - Font weight options
  - Export to PDF button
  - Print option
  - Share option
- **Rich Note Editor**:
  - Psychiatric Evaluation title
  - Date and visit type display
  - Section headers (HPI, MSE, etc.)
  - **AI Detail Level Slider**: Brief → Standard → Comprehensive per section
  - Inline text editing with formatting toolbar
  - Bold/Italic buttons
  - "Refine with AI" action per section
  - Highlighted clinical terms (e.g., severity markers)
- **AI Chat Interface** (at bottom)

#### 5. Professional Document Templates
- **Template Selection**: Horizontal scrollable chips
  - Initial Eval, SOAP Note, Discharge Summary, Treatment Plan
- **AI Logic Configuration**:
  - System Prompt editor (large textarea)
  - Version indicator (e.g., v3.0 GPT-4o)
- **Clinical Guardrails**:
  - Suicide Risk Detection toggle
  - Flag ideation markers aggressively
- **Note Structure**:
  - Drag-to-reorder sections
  - Sections: HPI, MSE, Assessment & Plan
  - Visibility toggles per section
  - "Add Section" button
- **Note Preview**:
  - Live sample preview
  - "Test Logic" button to preview with sample data

### Design System (from stitch-generator)
- **Colors**: 
  - Primary: `#137fec` (blue), `#13ecc8` (teal gradient)
  - Background Light: `#f6f7f8`
  - Background Dark: `#101922`
  - Surface Dark: `#162024`
- **Typography**: Inter font family
- **Effects**: 
  - Glass-morphism panels (blur, transparency)
  - Gradient buttons
  - Glow shadows
  - Smooth transitions
- **Icons**: Material Symbols Outlined

---

## Source 2: Clinical-Plan-Generator-1 (Logic Source of Truth)

### Files Included

| File | Purpose | Key Capabilities |
|------|---------|------------------|
| `pages/login.tsx` | Authentication | Supabase email/password login |
| `pages/index.tsx` | Route Redirect | Role-based redirect (admin/doctor) |
| `pages/admin/index.tsx` | Admin Dashboard | User management, create/disable users |
| `pages/doctor/index.tsx` | Doctor Dashboard | Document generation, template selection, history |
| `pages/settings.tsx` | Settings | App settings, document templates, PDF styling |
| `pages/api/generate-treatment-plan.ts` | AI Generation | Perplexity AI integration |
| `pages/api/templates/*.ts` | Template CRUD | Create, read, update, delete templates |
| `pages/api/documents/*.ts` | Document CRUD | Save, search, delete documents |
| `pages/api/admin/*.ts` | Admin APIs | Create/update users |
| `pages/api/settings/*.ts` | Settings APIs | Get/set app settings |
| `pages/api/generate-pdf.ts` | PDF Generation | HTML to PDF conversion |
| `pages/api/upload-logo.ts` | Logo Upload | Signed URL for logo storage |
| `lib/auth.ts` | Auth Helpers | requireAuth, requireAdmin, requireDoctor |
| `lib/supabase.ts` | Supabase Client | Server/browser client creation |

### Detailed Capabilities

#### 1. Authentication & Authorization
- **Supabase Auth Integration**
- **Email/Password Login**
- **Role-Based Access Control**:
  - Admin role: User management, app settings
  - Doctor role: Document generation, templates, history
- **Server-Side Auth Checks**: requireAuth, requireAdmin, requireDoctor
- **Session Management**: Cookie-based with SSR support

#### 2. Admin Dashboard
- **User Management**:
  - List all users (profiles table)
  - Create new doctor accounts
  - Edit user profiles (name, role)
  - Disable/enable accounts
- **App Settings**: Practice name, logo, global configuration

#### 3. Doctor Dashboard
- **Patient Information Form**:
  - Patient Name
  - Client ID
  - Date of Birth
  - Date of Service
- **Clinical Input Tabs**:
  - Intake Form (text area)
  - Session Transcript (text area)
  - Assessment Scores (text area)
  - Provider Notes (text area)
- **Template Selection**:
  - Dropdown to select custom templates
  - Templates filter by doctor
- **AI Document Generation**:
  - Perplexity AI integration (llama-3.1-sonar-large-128k-online)
  - Template-specific AI prompts
  - Robust JSON parsing with fallbacks
- **Generated Document Display**:
  - Dynamic rendering based on template type
  - Supports various document structures
- **Document Actions**:
  - Save to History
  - Print Document
  - View as PDF
- **Document History Tab**:
  - List saved documents
  - Search by patient name
  - View past documents
  - Delete documents

#### 4. Settings Page
- **Tabs**: Practice Settings, Document Templates, PDF Styling
- **Practice Settings**:
  - Practice Name
  - Logo upload (to Supabase Storage)
  - Provider Name
- **Document Templates** (per doctor):
  - Create new templates
  - Template types: Treatment Plan, DARP Note, Psych Note, Progress Note, Discharge Summary, Custom
  - Custom AI prompts per template
  - Edit/Delete templates
  - Set default template
- **PDF Styling**:
  - Font size adjustment
  - Color scheme

#### 5. AI Integration
- **Provider**: Perplexity AI (via API)
- **Model**: llama-3.1-sonar-large-128k-online
- **Features**:
  - Template-specific system prompts
  - Structured JSON output
  - Error handling with fallback parsing

#### 6. Database Schema (Supabase)
- **profiles**: User profiles with roles
- **document_templates**: Custom templates per doctor
- **saved_documents**: Document history with search
- **Row Level Security**: Doctor-scoped access

---

## Merged Product: Feature Matrix

### Features Comparison

| Feature | stitch-generator | Clinical-Plan-Generator | Final Product |
|---------|------------------|-------------------------|---------------|
| **Dashboard with Calendar** | ✅ Full UI | ❌ Not present | ✅ INCLUDE (new) |
| **Practice Overview Stats** | ✅ Full UI | ❌ Not present | ✅ INCLUDE (new) |
| **Dark/Light Mode** | ✅ Full UI | ❌ Not present | ✅ INCLUDE (new) |
| **Multi-File Upload** | ✅ PDF/Audio/Video/Text | ❌ Text only | ✅ UPGRADE |
| **Patient Intake Form** | ✅ Glass UI | ✅ Basic form | ✅ UPGRADE styling |
| **Template Selection** | ✅ Chips | ✅ Dropdown | ✅ UPGRADE to chips |
| **AI Document Generation** | ✅ UI only | ✅ Full Perplexity API | ✅ KEEP logic |
| **Pre-Generation Validation** | ✅ Full UI | ❌ Not present | ✅ INCLUDE (new) |
| **Missing Field Alerts** | ✅ Full UI | ❌ Not present | ✅ INCLUDE (new) |
| **Note Editor with AI Refine** | ✅ Full UI | ❌ Basic display | ✅ UPGRADE |
| **AI Detail Level Slider** | ✅ Full UI | ❌ Not present | ✅ INCLUDE (new) |
| **Format & Export Controls** | ✅ Full UI | ✅ Basic (font size only) | ✅ UPGRADE |
| **PDF Export** | ✅ UI button | ✅ Full implementation | ✅ KEEP logic |
| **Print/Share** | ✅ UI buttons | ❌ Print only | ✅ UPGRADE (add share) |
| **Template Configuration** | ✅ Full UI | ✅ Basic form | ✅ UPGRADE styling |
| **System Prompt Editor** | ✅ Full UI | ✅ Textarea | ✅ UPGRADE styling |
| **Clinical Guardrails** | ✅ Toggles UI | ❌ Not present | ✅ INCLUDE (new) |
| **Section Ordering (drag)** | ✅ Full UI | ❌ Not present | ✅ INCLUDE (new) |
| **Note Preview** | ✅ Full UI | ❌ Not present | ✅ INCLUDE (new) |
| **Test Logic Button** | ✅ Full UI | ❌ Not present | ✅ INCLUDE (new) |
| **Document History** | ❌ Not present | ✅ Full implementation | ✅ KEEP logic |
| **Search Documents** | ❌ Not present | ✅ By patient name | ✅ KEEP logic |
| **Supabase Auth** | ❌ Not present | ✅ Full implementation | ✅ KEEP logic |
| **Role-Based Access** | ❌ Not present | ✅ Admin/Doctor | ✅ KEEP logic |
| **User Management** | ❌ Not present | ✅ Full implementation | ✅ KEEP logic |
| **Bottom Navigation** | ✅ Full UI | ❌ Not present | ✅ INCLUDE (new) |

---

## Final Product Specification

### New Features (from stitch-generator)

1. **Dashboard with Calendar**
   - Practice overview stats (time saved, risk flagged, compliance)
   - Clinical calendar with appointments
   - iCal import
   - Welcome header with doctor profile

2. **Multi-File Upload System**
   - PDF, Audio, Video, Text file uploads
   - File preview with thumbnails
   - Remove file capability
   - Attach multiple files per document

3. **Pre-Generation Validation**
   - Missing field detection
   - Inline completion forms
   - AI optimization tips
   - Skip/proceed options

4. **Enhanced Note Editor**
   - Rich text editing
   - AI Detail Level slider per section
   - "Refine with AI" per section
   - Format controls (text size, line height, weight)

5. **Clinical Guardrails**
   - Suicide risk detection toggle
   - Configurable safety flags

6. **Section Ordering**
   - Drag-to-reorder note sections
   - Add/remove sections
   - Visibility toggles

7. **Dark/Light Mode**
   - System-wide theme toggle
   - Persisted preference

8. **Bottom Navigation**
   - Home, Templates, Generate (FAB), Patients, Settings

### Preserved Features (from Clinical-Plan-Generator)

1. **Authentication**
   - Supabase email/password login
   - Role-based access (admin/doctor)
   - Server-side auth protection

2. **User Management (Admin)**
   - Create/edit/disable users
   - Role assignment

3. **Document Generation**
   - Perplexity AI integration
   - Template-specific prompts
   - JSON parsing with fallbacks

4. **Document Templates**
   - Custom templates per doctor
   - Template types (Treatment Plan, DARP, Psych, Progress, Discharge, Custom)
   - AI prompt customization

5. **Document History**
   - Save documents
   - Search by patient name
   - View/delete past documents

6. **PDF Export**
   - HTML to PDF generation
   - Custom styling

7. **Settings**
   - Practice name/logo
   - PDF styling options

### Upgraded Features (merged)

1. **Patient Intake Form**
   - Glass-morphism styling (stitch)
   - Full form fields (both)
   - Auto-populated fields feature (stitch)

2. **Template Selection**
   - Horizontal chip selector (stitch styling)
   - Full CRUD + custom prompts (logic)

3. **Format & Export**
   - Full controls (text size, line height, weight) (stitch)
   - PDF/Print implementation (logic)
   - Add Share functionality (stitch)

---

## Implementation Priority

### Phase 1: Core Dashboard & Navigation
1. Implement new dashboard layout with calendar
2. Add bottom navigation
3. Add dark/light mode toggle

### Phase 2: Enhanced Document Generation
1. Upgrade patient intake form styling
2. Implement multi-file upload
3. Add pre-generation validation screen

### Phase 3: Note Editor Enhancement
1. Implement rich note editor
2. Add AI detail level sliders
3. Add "Refine with AI" per section
4. Upgrade format controls

### Phase 4: Template Configuration
1. Upgrade template UI to stitch design
2. Add clinical guardrails
3. Implement section ordering (drag)
4. Add note preview

### Phase 5: Polish & Integration
1. Apply glass-morphism styling throughout
2. Test all features work together
3. Ensure authentication still works
4. Final accessibility pass

---

## Verification Checklist

Before proceeding to implementation, confirm:

- [ ] All stitch-generator UI features documented
- [ ] All Clinical-Plan-Generator logic preserved
- [ ] No capabilities dropped without explicit decision
- [ ] Merge strategy clear for each feature
- [ ] Priority order makes sense for delivery

---

## Differences & Upgrades Summary

| Area | Before (Clinical-Plan-Generator) | After (Merged) |
|------|----------------------------------|----------------|
| Dashboard | Basic doctor dashboard | Full dashboard with calendar & stats |
| Theme | Light only | Dark/Light toggle |
| File Upload | Text input only | Multi-file (PDF/Audio/Video/Text) |
| Validation | None | Pre-generation validation with AI tips |
| Note Editor | Static display | Rich editor with AI refinement |
| Templates | Basic form | Full config with guardrails & ordering |
| Navigation | Page links | Bottom nav with FAB |
| Styling | Basic Tailwind | Glass-morphism, gradients, animations |
