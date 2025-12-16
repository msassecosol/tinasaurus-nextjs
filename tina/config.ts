import { defineConfig, LocalAuthProvider } from "tinacms";
import { OpenIDAuthProvider } from "./OpenIDAuthProvider";

// Your hosting provider likely exposes this as an environment variable
const branch =
  process.env.GITHUB_BRANCH ||
  process.env.VERCEL_GIT_COMMIT_REF ||
  process.env.HEAD ||
  "main";

const isLocal = process.env.TINA_PUBLIC_IS_LOCAL === "true";

export default defineConfig({
  branch,

  // For self-hosted, point to the local API
  contentApiUrlOverride: "/api/tina/gql",

  // Self-hosted auth configuration
  authProvider: isLocal
    ? new LocalAuthProvider()
    : new OpenIDAuthProvider({
        clientId: 'plaza-frontend',
        authorizeUrl: 'https://alpha.avaplace.com/api/asol/idp/connect/authorize',
        tokenUrl: 'https://alpha.avaplace.com/api/asol/idp/connect/token',
        userInfoUrl: 'https://alpha.avaplace.com/api/asol/idp/connect/userinfo',
        redirectUri: 'http://localhost:3000/admin',
        scope: 'openid profile email',
        logoutUrl: 'http://localhost:3000/',
      }),

  build: {
    outputFolder: "admin",
    publicFolder: "public",
  },
  media: {
    tina: {
      mediaRoot: "",
      publicFolder: "public",
    },
  },
  // See docs on content modeling for more info on how to setup new content models: https://tina.io/docs/schema/
  schema: {
    collections: [
      {
        name: "post",
        label: "Posts",
        path: "content/posts",
        fields: [
          {
            type: "string",
            name: "title",
            label: "Title",
            isTitle: true,
            required: true,
          },
          {
            type: "rich-text",
            name: "body",
            label: "Body",
            isBody: true,
          },
        ],
      },
    ],
  },
});
