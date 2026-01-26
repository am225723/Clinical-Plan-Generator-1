self.__BUILD_MANIFEST = {
  "/": [
    "static/chunks/pages/index.js"
  ],
  "/doctor": [
    "static/chunks/pages/doctor.js"
  ],
  "/login": [
    "static/chunks/pages/login.js"
  ],
  "__rewrites": {
    "afterFiles": [],
    "beforeFiles": [],
    "fallback": []
  },
  "sortedPages": [
    "/",
    "/_app",
    "/_error",
    "/admin",
    "/api/admin/create-user",
    "/api/admin/update-user",
    "/api/dashboard/appointments",
    "/api/dashboard/calendar-imports",
    "/api/dashboard/summary",
    "/api/documents",
    "/api/documents/[id]",
    "/api/generate-pdf",
    "/api/generate-treatment-plan",
    "/api/settings/get",
    "/api/settings/set",
    "/api/templates",
    "/api/templates/[id]",
    "/api/transcriptions",
    "/api/transcriptions/[id]",
    "/api/upload-logo",
    "/doctor",
    "/login",
    "/patients",
    "/settings"
  ]
};self.__BUILD_MANIFEST_CB && self.__BUILD_MANIFEST_CB()