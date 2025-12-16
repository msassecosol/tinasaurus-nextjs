import { TinaNodeBackend, LocalBackendAuthProvider } from "@tinacms/datalayer";
import { createOpenIDBackendAuthProviderFromEnv } from "../../../tina/OpenIDBackendAuthProvider";

import databaseClient from "../../../tina/__generated__/databaseClient";

const isLocal = process.env.TINA_PUBLIC_IS_LOCAL === "true";

const handler = TinaNodeBackend({
  authProvider: isLocal
    ? LocalBackendAuthProvider()
    : createOpenIDBackendAuthProviderFromEnv(),
  databaseClient,
});

export default (req, res) => {
  // Modify the request here if you need to
  return handler(req, res);
};
