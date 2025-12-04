self.__BUILD_MANIFEST = {
  "/": [
    "static/chunks/pages/index.js"
  ],
  "/demo/blog/[filename]": [
    "static/chunks/pages/demo/blog/[filename].js"
  ],
  "__rewrites": {
    "afterFiles": [
      {
        "source": "/admin",
        "destination": "/admin/index.html"
      }
    ],
    "beforeFiles": [],
    "fallback": []
  },
  "sortedPages": [
    "/",
    "/_app",
    "/_error",
    "/api/auth/[...nextauth]",
    "/api/tina/[...routes]",
    "/demo/blog/[filename]"
  ]
};self.__BUILD_MANIFEST_CB && self.__BUILD_MANIFEST_CB()