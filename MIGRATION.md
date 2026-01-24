# Migration Guide: Extracting the Unified Branch

This repository contains a unified application merging `Clinical-Plan-Generator-1` logic with `Stitch-Generator` UI.

## Structure

The merged code resides in `client/src`. Key additions:

-   `client/src/components/layout`: Contains the main layout shell.
-   `client/src/components/dashboard`: Dashboard widgets.
-   `client/src/components/generator`: Clinical generation logic + UI.
-   `client/src/components/templates`: Template configuration UI.
-   `client/src/components/navigation`: Mobile-first bottom navigation.
-   `client/src/pages`: Updated routes (`home`, `generator`, `templates`, etc.).
-   `client/src/index.css`: Updated with new styling variables.

## Extraction Steps

To extract this branch into a standalone repository:

1.  Clone this repository.
2.  Checkout this branch.
3.  Delete unrelated server-side code if creating a pure frontend repo, OR keep `server/` if the Express backend is needed (it handles API calls for generation).
4.  Ensure `package.json` dependencies are installed (`npm install`).
5.  Run `npm run dev` to start the development server.

## Configuration

-   **Styling**: `client/src/index.css` contains the Tailwind theme configuration (colors, fonts, etc.).
-   **Routing**: `client/src/App.tsx` handles client-side routing.
-   **API**: `client/src/lib/clinical-generator.ts` handles API calls to the backend or OpenAI.

## Dependencies

Key dependencies added/updated:
-   `framer-motion`: For animations.
-   `pdfjs-dist`: For client-side PDF text extraction.
-   `lucide-react` & Material Symbols (via CDN): For icons.
