self.__BUILD_MANIFEST = {
  "/": [
    "static/chunks/pages/index.js"
  ],
  "/admin": [
    "static/chunks/pages/admin.js"
  ],
  "/doctor": [
    "static/chunks/pages/doctor.js"
  ],
  "/login": [
    "static/chunks/pages/login.js"
  ],
  "/settings": [
    "static/chunks/pages/settings.js"
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
    "/api/documents",
    "/api/documents/[id]",
    "/api/generate-pdf",
    "/api/generate-treatment-plan",
    "/api/settings/get",
    "/api/settings/set",
    "/api/templates",
    "/api/templates/[id]",
    "/api/upload-logo",
    "/doctor",
    "/login",
    "/settings"
  ]
};self.__BUILD_MANIFEST_CB && self.__BUILD_MANIFEST_CB()